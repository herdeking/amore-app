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
