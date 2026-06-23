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
