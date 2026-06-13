import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, Image, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { getAIReply, getIcebreakers } from '../../services/aiReply';
import { sendGift, GIFTS } from '../../services/gifts';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { recordProfileView } from '../../services/profileViews';
import { subscribeToMessages, sendMessage, getOtherUserInMatch, ChatMessage } from '../../services/chatService';
import { useEffect } from 'react';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

const QUICK_REPLIES = ['Get to know each other?', 'Hello, my dear 👋', 'Is it convenient to talk?', 'You look amazing! 😍'];

const DEMO_MESSAGES = [
  { id: '1', senderId: 'other', text: "I've been feeling lazy and sleepy lately 💤", createdAt: new Date().toISOString() },
  { id: '2', senderId: 'other', text: 'I just want to lie in bed for a while, want to lie here by my side?', createdAt: new Date().toISOString() },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [translatedMsgs, setTranslatedMsgs] = useState<Record<string, string>>({});
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const isRealMatch = !id?.startsWith('1') && !id?.startsWith('2') && !id?.startsWith('3') && !id?.startsWith('4') && !id?.startsWith('5') && !id?.startsWith('6') && !id?.startsWith('7') && !id?.startsWith('8') && id?.length > 10;

  useEffect(() => {
    if (!isRealMatch || !user?.id || !id) return;

    setLoadingUser(true);
    getOtherUserInMatch(id, user.id).then(u => {
      if (u) setOtherUser(u);
    }).catch(() => {}).finally(() => setLoadingUser(false));

    setMessages([]); // clear demo messages for real matches

    const unsub = subscribeToMessages(id, (msgs) => {
      setMessages(msgs as any);
    });
    return () => unsub();
  }, [id, user?.id]);

  const matchName = isRealMatch ? (otherUser?.name ?? (loadingUser ? 'Loading...' : 'User')) : 'Sonia';
  const matchProfile = otherUser ?? { name: matchName, age: 25, bio: 'Artist & dreamer', interests: ['Art', 'Music'], location: 'Abuja' };
  const matchPhoto = otherUser?.photos?.[0] ?? 'https://randomuser.me/api/portraits/women/1.jpg';
  const isOnline = true;

  const send = () => {
    if (!text.trim()) return;
    const messageText = text.trim();

    if (isRealMatch && user?.id && id) {
      sendMessage(id, user.id, messageText).catch(() => {});
    } else {
      const msg = {
        id: Date.now().toString(),
        senderId: user?.id ?? 'me',
        text: messageText,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, msg]);
    }
    setText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendQuick = (reply: string) => {
    const msg = {
      id: Date.now().toString(),
      senderId: user?.id ?? 'me',
      text: reply,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleTranslate = async (msgId: string, text: string) => {
    if (translatedMsgs[msgId]) {
      setTranslatedMsgs(prev => { const n = {...prev}; delete n[msgId]; return n; });
      return;
    }
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{ role: 'user', content: 'Translate this to English. Reply with ONLY the translation, nothing else: ' + text }],
        }),
      });
      const data = await response.json();
      const translation = data.content?.[0]?.text ?? text;
      setTranslatedMsgs(prev => ({ ...prev, [msgId]: translation }));
    } catch (e) {
      Alert.alert('Translation failed', 'Could not translate message.');
    }
  };

  const handleSendGift = async (giftId: string) => {
    setShowGifts(false);
    const gift = GIFTS.find(g => g.id === giftId);
    if (!gift) return;
    if ((user?.diamonds ?? 0) < gift.cost) {
      Alert.alert('Not enough 💎', `You need ${gift.cost} diamonds. Buy more in the store!`, [
        { text: 'Buy Diamonds', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' }
      ]);
      return;
    }
    try {
      await sendGift(user?.id ?? '', id, giftId, user?.diamonds ?? 0);
      await updateDoc(doc(db, 'users', user?.id ?? ''), { diamonds: increment(-gift.cost) });
      const msg = {
        id: Date.now().toString(),
        senderId: user?.id ?? 'me',
        text: `${gift.emoji} Gift: ${gift.name}`,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, msg]);
      Alert.alert('Gift Sent! ' + gift.emoji, `You sent a ${gift.name} for ${gift.cost} 💎`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAIReply = async () => {
    const lastOther = [...messages].reverse().find(m => !isMine(m.senderId));
    if (!lastOther) {
      Alert.alert('AI Reply', 'No message to reply to yet!');
      return;
    }
    setAiLoading(true);
    const { reply, error } = await getAIReply(user?.id ?? '', user?.isPremium ?? false, matchProfile, lastOther.text);
    setAiLoading(false);
    if (error) {
      Alert.alert('Limit Reached 👑', error, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Become VIP 👑', style: 'default' }
      ]);
      return;
    }
    setText(reply);
  };

  const handleIcebreakers = async () => {
    setAiLoading(true);
    const suggestions = await getIcebreakers(user?.id ?? '', user?.isPremium ?? false, matchProfile);
    setAiLoading(false);
    Alert.alert(
      '🤖 AI Suggestions',
      'Pick an opening line:',
      [
        ...suggestions.map((s: string) => ({ text: s, onPress: () => setText(s) })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleCall = (type: 'voice' | 'video') => {
    Alert.alert(
      type === 'video' ? '📹 Video Call' : '📞 Voice Call',
      'Free users get 10 seconds. Upgrade to VIP for unlimited calls!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call (10s free)', onPress: () => Alert.alert('Calling...', 'Your 10 second free call has started!') },
        { text: '👑 Become VIP', style: 'default', onPress: () => Alert.alert('VIP', 'VIP feature coming soon!') },
      ]
    );
  };

  const isMine = (senderId: string) => senderId === (user?.id ?? 'me');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Image source={{ uri: matchPhoto }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{matchName}</Text>
          <Text style={[styles.headerStatus, isOnline && styles.busy]}>
            {isOnline ? '● Busy' : '● Offline'}
          </Text>
        </View>
        <TouchableOpacity style={styles.followBtn}>
          <Text style={styles.followText}>Follow</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <View style={[styles.msgRow, isMine(item.senderId) && styles.msgRowMine]}>
              {!isMine(item.senderId) && (
                <Image source={{ uri: matchPhoto }} style={styles.msgAvatar} />
              )}
              <TouchableOpacity
                onLongPress={() => handleTranslate(item.id, item.text)}
                style={[styles.bubble, isMine(item.senderId) ? styles.bubbleMine : styles.bubbleOther]}
              >
                <Text style={[styles.bubbleText, isMine(item.senderId) && styles.bubbleTextMine]}>
                  {item.text}
                  {translatedMsgs[item.id] && (
                    <Text style={{ fontSize: 12, opacity: 0.8, marginTop: 4, fontStyle: 'italic' }}>
                      🌍 {translatedMsgs[item.id]}
                    </Text>
                  )}
                </Text>
              </TouchableOpacity>
              {isMine(item.senderId) && (
                <Image source={{ uri: user?.photos?.[0] ?? matchPhoto }} style={styles.msgAvatar} />
              )}
            </View>
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Video call button */}
        <TouchableOpacity style={styles.videoCallBtn} onPress={() => handleCall('video')}>
          <Text style={styles.videoCallIcon}>📞</Text>
          <Text style={styles.videoCallText}>Video call</Text>
        </TouchableOpacity>

        {/* Gift picker */}
        {showGifts && (
          <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', padding: 12 }}>
            <Text style={{ fontSize: 13, color: '#999', marginBottom: 8, fontWeight: '600' }}>Send a Gift (💎 {user?.diamonds ?? 0} available)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {GIFTS.map(g => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => handleSendGift(g.id)}
                  style={{ alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 10, width: 70 }}
                >
                  <Text style={{ fontSize: 28 }}>{g.emoji}</Text>
                  <Text style={{ fontSize: 11, color: '#333', marginTop: 2 }}>{g.name}</Text>
                  <Text style={{ fontSize: 10, color: '#FF4B6E', fontWeight: 'bold' }}>{g.cost}💎</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick replies */}
        <FlatList
          horizontal
          data={QUICK_REPLIES}
          keyExtractor={r => r}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickReplies}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.quickReply} onPress={() => sendQuick(item)}>
              <Text style={styles.quickReplyText}>{item}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.inputIcon} onPress={() => setShowGifts(!showGifts)}>
            <Text>🎁</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Send a message"
            placeholderTextColor={Colors.textLight}
            multiline
          />
          <TouchableOpacity style={styles.inputIcon} onPress={messages.length <= 2 ? handleIcebreakers : handleAIReply} disabled={aiLoading}>
            <Text>{aiLoading ? '⏳' : '🤖'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputIcon}>
            <Text>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, text.trim() && styles.sendBtnActive]}
            onPress={send}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8 },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 32, color: Colors.text, lineHeight: 32 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  headerStatus: { fontSize: 12, color: Colors.textLight },
  busy: { color: '#FF4B4B' },
  followBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  followText: { fontSize: 13, color: Colors.text },
  moreBtn: { padding: 4 },
  moreIcon: { fontSize: 20, color: Colors.text },
  messageList: { padding: 16, gap: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  msgRowMine: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 32, height: 32, borderRadius: 16 },
  bubble: { maxWidth: '70%', padding: 12, borderRadius: 18 },
  bubbleOther: { backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  bubbleTextMine: { color: Colors.white },
  videoCallBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD700', marginHorizontal: 80, marginBottom: 8, paddingVertical: 12, borderRadius: 30, gap: 8 },
  videoCallIcon: { fontSize: 18 },
  videoCallText: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.white },
  quickReplies: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  quickReply: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  quickReplyText: { fontSize: 13, color: Colors.text },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  inputIcon: { padding: 4 },
  input: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, color: Colors.text, maxHeight: 100 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: Colors.primary },
  sendIcon: { color: Colors.white, fontSize: 16 },
});
