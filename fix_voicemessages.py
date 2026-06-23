import os

# ── 1. Create VoiceMessage component ──
voice_component = '''\
import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Colors } from '../../constants/colors';

interface Props {
  uri: string;
  isMine: boolean;
  duration?: number;
}

export const VoiceMessagePlayer: React.FC<Props> = ({ uri, isMine, duration = 0 }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const togglePlay = async () => {
    try {
      if (playing && soundRef.current) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
        stopPulse();
        return;
      }

      if (soundRef.current) {
        await soundRef.current.playAsync();
        setPlaying(true);
        startPulse();
        return;
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          if (status.durationMillis) setTotalDuration(status.durationMillis);
          setProgress(status.positionMillis / (status.durationMillis ?? 1));
          if (status.didJustFinish) {
            setPlaying(false);
            setProgress(0);
            stopPulse();
            soundRef.current = null;
          }
        }
      );
      soundRef.current = sound;
      setPlaying(true);
      startPulse();
    } catch (e) {
      console.log('Voice play error:', e);
    }
  };

  const fmtDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, isMine ? styles.mine : styles.other]}>
      <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
        <Animated.Text style={[styles.playIcon, { transform: [{ scale: pulseAnim }] }]}>
          {playing ? '⏸' : '▶️'}
        </Animated.Text>
      </TouchableOpacity>
      <View style={styles.waveContainer}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.waveBar,
              { height: 8 + Math.sin(i * 0.8) * 8 },
              i / 20 <= progress && styles.waveBarActive,
              isMine && styles.waveBarMine,
            ]}
          />
        ))}
      </View>
      <Text style={[styles.duration, isMine && styles.durationMine]}>
        {fmtDuration(totalDuration)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, padding: 10, gap: 8, minWidth: 180,
  },
  mine: { backgroundColor: Colors.primary },
  other: { backgroundColor: '#F0F0F0' },
  playBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 20 },
  waveContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.2)' },
  waveBarActive: { backgroundColor: 'rgba(0,0,0,0.5)' },
  waveBarMine: { backgroundColor: 'rgba(255,255,255,0.5)' },
  duration: { fontSize: 11, color: '#666', minWidth: 32 },
  durationMine: { color: 'rgba(255,255,255,0.85)' },
});
'''
os.makedirs('/data/data/com.termux/files/home/amore-app/components/chat', exist_ok=True)
with open('/data/data/com.termux/files/home/amore-app/components/chat/VoiceMessagePlayer.tsx', 'w') as f:
    f.write(voice_component)
print('✅ VoiceMessagePlayer.tsx created')

# ── 2. Create VoiceRecordButton component ──
record_btn = '''\
import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Animated, View } from 'react-native';
import { Audio } from 'expo-av';
import { Colors } from '../../constants/colors';

interface Props {
  onRecordingComplete: (uri: string, duration: number) => void;
}

export const VoiceRecordButton: React.FC<Props> = ({ onRecordingComplete }) => {
  const [recording, setRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const startTimeRef = useRef<number>(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission needed', 'Microphone access is required for voice messages.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      startTimeRef.current = Date.now();
      setRecording(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.3, duration: 400, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } catch (e) {
      console.log('Recording error:', e);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const duration = Date.now() - startTimeRef.current;
      recordingRef.current = null;
      setRecording(false);
      if (uri) onRecordingComplete(uri, duration);
    } catch (e) {
      console.log('Stop recording error:', e);
      setRecording(false);
    }
  };

  return (
    <TouchableOpacity
      onLongPress={startRecording}
      onPressOut={stopRecording}
      delayLongPress={200}
      style={styles.btn}
      activeOpacity={0.7}
    >
      <Animated.Text style={[styles.icon, recording && { transform: [{ scale: scaleAnim }] }]}>
        🎤
      </Animated.Text>
      {recording && <View style={styles.recordingDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  recordingDot: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: 'red',
  },
});
'''
with open('/data/data/com.termux/files/home/amore-app/components/chat/VoiceRecordButton.tsx', 'w') as f:
    f.write(record_btn)
print('✅ VoiceRecordButton.tsx created')

# ── 3. Hook into chat/[id].tsx ──
chat_path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(chat_path, 'r') as f:
    content = f.read()

# Add imports
old_import = "import { subscribeToMessages, sendMessage, getOtherUserInMatch, ChatMessage } from '../../services/chatService';"
new_import = """import { subscribeToMessages, sendMessage, getOtherUserInMatch, ChatMessage } from '../../services/chatService';
import { VoiceRecordButton } from '../../components/chat/VoiceRecordButton';
import { VoiceMessagePlayer } from '../../components/chat/VoiceMessagePlayer';"""
content = content.replace(old_import, new_import)

# Add voice upload handler after existing state declarations
old_state = "  const [otherTyping, setOtherTyping] = React.useState(false);"
new_state = """  const [otherTyping, setOtherTyping] = React.useState(false);

  const handleVoiceMessage = async (uri: string, duration: number) => {
    try {
      const { uploadToCloudinary } = require('../../services/cloudinary');
      const url = await uploadToCloudinary(uri);
      const msgText = `🎤 [Voice](${url})|${duration}`;
      if (isRealMatch && user?.id && id) {
        sendMessage(id, user.id, msgText).catch(() => {});
      }
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    }
  };"""
content = content.replace(old_state, new_state)

# Render voice messages in bubble
old_render = """                    return (
                      <Text style={[styles.bubbleText, isMine(item.senderId) && styles.bubbleTextMine]}>
                        {item.text}
                        {translatedMsgs[item.id] && (
                          <Text style={{ fontSize: 12, opacity: 0.8, marginTop: 4, fontStyle: 'italic' }}>
                            🌍 {translatedMsgs[item.id]}
                          </Text>
                        )}
                      </Text>
                    );"""
new_render = """                    // Voice message
                    const voiceMatch = item.text.match(/🎤 \\[Voice\\]\\((https?:\\/\\/[^)]+)\\)\\|(\\d+)/);
                    if (voiceMatch) {
                      return (
                        <VoiceMessagePlayer
                          uri={voiceMatch[1]}
                          isMine={isMine(item.senderId)}
                          duration={parseInt(voiceMatch[2])}
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
                    );"""
content = content.replace(old_render, new_render)

# Add VoiceRecordButton in input row
old_input_icon = "          <TouchableOpacity style={styles.inputIcon} onPress={async () => {\n            const ImagePicker = require('expo-image-picker');"
new_input_icon = """          <VoiceRecordButton onRecordingComplete={handleVoiceMessage} />
          <TouchableOpacity style={styles.inputIcon} onPress={async () => {
            const ImagePicker = require('expo-image-picker');"""
content = content.replace(old_input_icon, new_input_icon)

with open(chat_path, 'w') as f:
    f.write(content)
print('✅ chat/[id].tsx updated with voice messages')

print('\n🎉 Voice messages done!')
