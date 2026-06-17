import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, Image, KeyboardAvoidingView, Platform, Alert, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { getAIReply, getIcebreakers } from '../../services/aiReply';
import { sendGift, GIFTS } from '../../services/gifts';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, writeBatch, doc as fsDoc, setDoc, serverTimestamp, onSnapshot as fsOnSnapshot } from 'firebase/firestore';
import { recordProfileView } from '../../services/profileViews';
import { sendLocalNotification } from '../../services/notifications';
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
  const [showChatProfile, setShowChatProfile] = useState(false);
  const isRealMatch = !id?.startsWith('1') && !id?.startsWith('2') && !id?.startsWith('3') && !id?.startsWith('4') && !id?.startsWith('5') && !id?.startsWith('6') && !id?.startsWith('7') && !id?.startsWith('8') && id?.length > 10;

  useEffect(() => {
    if (!isRealMatch || !user?.id || !id) return;

    setLoadingUser(true);
    getOtherUserInMatch(id, user.id).then(u => {
      if (u) setOtherUser(u);
    }).catch(() => {}).finally(() => setLoadingUser(false));

    setMessages([]); // clear demo messages for real matches

    let isFirstLoad = true;
    const unsub = subscribeToMessages(id, (msgs) => {
      if (!isFirstLoad && msgs.length > messages.length) {
        const newest = msgs[msgs.length - 1];
        if (newest.senderId !== user?.id) {
          sendLocalNotification(`${matchName} 💬`, newest.text);
        }
      }
      setMessages(msgs as any);
      isFirstLoad = false;
    });
    return () => unsub();
  }, [id, user?.id]);

  // Mark all unread messages as read when chat opens
  useEffect(() => {
    if (!id || !user?.id || !isRealMatch) return;
    const markRead = async () => {
      try {
        // Get all messages then filter in JS to avoid compound index requirement
        const snap = await getDocs(collection(db, 'matches', id, 'messages'));
        const unread = snap.docs.filter(d => {
          const data = d.data();
          return data.senderId !== user.id && !data.read;
        });
        if (unread.length === 0) return;
        const batch = writeBatch(db);
        unread.forEach(d => batch.update(fsDoc(db, 'matches', id, 'messages', d.id), { read: true }));
        await batch.commit();
      } catch(e) { console.log('markRead error:', e); }
    };
    markRead();
  }, [id, user?.id, isRealMatch]);

  const matchName = isRealMatch ? (otherUser?.name ?? (loadingUser ? 'Loading...' : 'User')) : 'Sonia';
  const matchProfile = otherUser ?? { name: matchName, age: 25, bio: 'Artist & dreamer', interests: ['Art', 'Music'], location: 'Abuja' };
  const matchPhoto = otherUser?.photos?.[0] ?? 'https://randomuser.me/api/portraits/women/1.jpg';
  const isOnline = otherUser?.isOnline ?? false;
  const lastSeenText = isOnline ? '● Online' : otherUser?.lastSeen
    ? `Last seen ${new Date(otherUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '● Offline';

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
    if (isRealMatch && user?.id && id) {
      sendMessage(id, user.id, reply).catch(() => {});
    } else {
      const msg = {
        id: Date.now().toString(),
        senderId: user?.id ?? 'me',
        text: reply,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, msg]);
    }
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
    const channelName = `call_${id}_${Date.now()}`;
    // Save call invite to Firestore so other user gets notified
    import('firebase/firestore').then(({ doc, setDoc }) => {
      setDoc(doc(db, 'callInvites', otherUser?.id ?? ''), {
        callerId: user?.id,
        callerName: user?.name,
        receiverId: otherUser?.id,
        receiverName: matchName,
        channelName,
        type,
        matchId: id,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    });
    router.push({
      pathname: `/call/${id}`,
      params: {
        type,
        callerId: user?.id,
        callerName: user?.name,
        receiverId: otherUser?.id,
        receiverName: matchName,
        channelName,
      }
    } as any);
  };

  const isMine = (senderId: string) => senderId === (user?.id ?? 'me');

  // ── Typing indicator state ──
  const [otherTyping, setOtherTyping] = React.useState(false);
  const [reactions, setReactions] = React.useState<Record<string, string>>({});
  const [reactionMsgId, setReactionMsgId] = React.useState<string | null>(null);
  const [selectedMsgId, setSelectedMsgId] = React.useState<string | null>(null);

  const fmtTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const deleteMessage = async (msgId: string) => {
    if (!id || !isRealMatch) return;
    try {
      const { deleteDoc, doc: dDoc } = await import('firebase/firestore');
      const { db: fdb } = await import('../../services/firebase');
      await deleteDoc(dDoc(fdb, 'matches', id as string, 'messages', msgId));
      setMessages((prev: any) => prev.filter((m: any) => m.id !== msgId));
    } catch(e: any) {
      Alert.alert('Error', e.message);
    }
    setSelectedMsgId(null);
  };

  const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👏', '🔥'];

  const addReaction = (msgId: string, emoji: string) => {
    setReactions(prev => ({ ...prev, [msgId]: emoji }));
    setReactionMsgId(null);
  };
  const typingTimeoutRef = React.useRef<any>(null);

  // Watch other user typing status
  React.useEffect(() => {
    if (!id || !user?.id || !isRealMatch) return;
    const otherUserId = (id as string);
    const typingRef = fsDoc(db, 'matches', id, 'typing', 'status');
    const unsub = fsOnSnapshot(typingRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const otherKey = Object.keys(data).find(k => k !== user.id);
      if (otherKey) setOtherTyping(data[otherKey] === true);
    });
    return () => unsub();
  }, [id, user?.id, isRealMatch]);

  // Send typing status when user types
  const handleTextChange = async (val: string) => {
    setText(val);
    if (!id || !user?.id || !isRealMatch) return;
    const typingRef = fsDoc(db, 'matches', id, 'typing', 'status');
    await setDoc(typingRef, { [user.id]: true }, { merge: true }).catch(() => {});
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      await setDoc(typingRef, { [user.id]: false }, { merge: true }).catch(() => {});
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowChatProfile(true)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Image source={{ uri: matchPhoto }} style={styles.headerAvatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{matchName}</Text>
            <Text style={[styles.headerStatus, isOnline && styles.busy]}>
              {lastSeenText}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.followBtn} onPress={async () => {
          if (!otherUser?.id || !user?.id) return;
          try {
            const { followUser } = await import('../../services/followService');
            await followUser(user.id, user.name || 'Someone', otherUser.id);
            Alert.alert('Following', `You are now following ${matchName}`);
          } catch(e: any) {
            Alert.alert('Error', e.message);
          }
        }}>
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
            <View>
              <View style={[styles.msgRow, isMine(item.senderId) && styles.msgRowMine]}>
                {!isMine(item.senderId) && (
                  <Image source={{ uri: matchPhoto }} style={styles.msgAvatar} />
                )}
                <TouchableOpacity
                  onLongPress={() => {
                    if (isMine(item.senderId)) {
                      Alert.alert('Message', 'What would you like to do?', [
                        { text: 'React', onPress: () => setReactionMsgId(item.id) },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(item.id) },
                        { text: 'Cancel', style: 'cancel' },
                      ]);
                    } else {
                      setReactionMsgId(item.id);
                    }
                  }}
                  onPress={() => {}}
                  style={[styles.bubble, isMine(item.senderId) ? styles.bubbleMine : styles.bubbleOther]}
                >
                  {(() => {
                    const photoMatch = item.text.match(/📷 \[Photo\]\((https?:\/\/[^\)]+)\)/);
                    if (photoMatch) {
                      return (
                        <Image
                          source={{ uri: photoMatch[1] }}
                          style={{ width: 200, height: 200, borderRadius: 12 }}
                          resizeMode="cover"
                        />
                      );
                    }
                    return (
                      <Text style={[styles.bubbleText, isMine(item.senderId) && styles.bubbleTextMine]}>
                        {item.text}
                        {translatedMsgs[item.id] && (
                          <Text style={{ fontSize: 12, opacity: 0.8, marginTop: 4, fontStyle: 'italic' }}>
                            🌍 {translatedMsgs[item.id]}
                          </Text>
                        )}
                      </Text>
                    );
                  })()}
                </TouchableOpacity>
                {isMine(item.senderId) && (
                  <Image source={{ uri: user?.photos?.[0] ?? matchPhoto }} style={styles.msgAvatar} />
                )}
              </View>
              <Text style={[styles.msgTime, isMine(item.senderId) && styles.msgTimeMine]}>
                {fmtTime(item.createdAt)}
                {isMine(item.senderId) ? ((item as any).read ? ' ✓✓' : ' ✓') : ''}
              </Text>
              {reactions[item.id] && (
                <Text style={[styles.reactionBadge, isMine(item.senderId) && styles.reactionBadgeMine]}>
                  {reactions[item.id]}
                </Text>
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
            onChangeText={handleTextChange}
            placeholder="Send a message"
            placeholderTextColor={Colors.textLight}
            multiline
          />
          <TouchableOpacity style={styles.inputIcon} onPress={messages.length <= 2 ? handleIcebreakers : handleAIReply} disabled={aiLoading}>
            <Text>{aiLoading ? '⏳' : '🤖'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputIcon} onPress={async () => {
            const ImagePicker = require('expo-image-picker');
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.7,
            });
            if (result.canceled || !result.assets?.[0]) return;
            try {
              const { uploadToCloudinary } = require('../../services/cloudinary');
              const url = await uploadToCloudinary(result.assets[0].uri);
              const msgText = `📷 [Photo](${url})`;
              if (isRealMatch && user?.id && id) {
                sendMessage(id, user.id, msgText).catch(() => {});
              } else {
                setMessages((prev: any) => [...prev, {
                  id: Date.now().toString(),
                  senderId: user?.id ?? 'me',
                  text: msgText,
                  createdAt: new Date().toISOString(),
                }]);
              }
            } catch(e: any) {
              Alert.alert('Upload failed', e.message);
            }
          }}>
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
      {/* Chat partner profile modal */}
      <Modal visible={showChatProfile} animationType="slide" onRequestClose={() => setShowChatProfile(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <ScrollView>
            <View style={{ position: 'relative' }}>
              <Image source={{ uri: matchPhoto }} style={{ width: '100%', height: 400 }} />
              <TouchableOpacity
                style={{ position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 6 }}
                onPress={() => setShowChatProfile(false)}
              >
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 26, fontWeight: 'bold', color: Colors.text, marginBottom: 4 }}>
                {matchProfile?.name}{matchProfile?.age ? `, ${matchProfile.age}` : ''}
              </Text>
              {matchProfile?.location && (
                <Text style={{ fontSize: 15, color: Colors.textLight, marginBottom: 12 }}>📍 {matchProfile.location}</Text>
              )}
              {matchProfile?.bio && (
                <Text style={{ fontSize: 15, color: Colors.text, lineHeight: 22, marginBottom: 16 }}>{matchProfile.bio}</Text>
              )}
              {(otherUser?.photos?.length ?? 0) > 1 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 10 }}>More Photos</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {otherUser?.photos?.slice(1).map((p: string, i: number) => (
                      <Image key={i} source={{ uri: p }} style={{ width: 120, height: 160, borderRadius: 12, marginRight: 10 }} />
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      {/* Reaction Picker */}
      {reactionMsgId && (
        <TouchableOpacity
          style={styles.reactionOverlay}
          activeOpacity={1}
          onPress={() => setReactionMsgId(null)}
        >
          <View style={styles.reactionPicker}>
            {REACTION_EMOJIS.map(emoji => (
              <TouchableOpacity key={emoji} onPress={() => addReaction(reactionMsgId, emoji)}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
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
  quickReplies: { paddingHorizontal: 12, paddingBottom: 10, paddingTop: 4, gap: 8 },
  quickReply: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  quickReplyText: { fontSize: 14, color: Colors.text, fontWeight: '500' as const },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 6, gap: 6 },
  typingBubble: { backgroundColor: '#f0f0f0', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  typingDots: { fontSize: 18, color: '#999', letterSpacing: 2 },
  msgTime: { fontSize: 10, color: '#aaa', marginLeft: 44, marginTop: 2, marginBottom: 4 },
  msgTimeMine: { textAlign: 'right' as const, marginRight: 44, marginLeft: 0 },
  reactionBadge: { fontSize: 16, marginLeft: 40, marginTop: -8, marginBottom: 4 },
  reactionBadgeMine: { textAlign: 'right' as const, marginRight: 40, marginLeft: 0 },
  reactionOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center' as const, alignItems: 'center' as const, zIndex: 999 },
  reactionPicker: { flexDirection: 'row' as const, backgroundColor: '#fff', borderRadius: 30, padding: 10, gap: 8, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 },
  reactionEmoji: { fontSize: 28 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  inputIcon: { padding: 4 },
  input: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: Colors.text, maxHeight: 100, minHeight: 44 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: Colors.primary },
  sendIcon: { color: Colors.white, fontSize: 16 },
});
