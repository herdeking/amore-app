// app/call/[id].tsx
// Real video/voice call using Agora SDK
import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Platform, SafeAreaView
} from "react-native";
import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
} from "react-native-agora";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { db } from "../../services/firebase";
import { doc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore";

const AGORA_APP_ID = "dad5b4e4123c4a4eb54f171912b11c9a";

export default function CallScreen() {
  const { id, type, callerId, callerName, channelName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const engine = useRef<IRtcEngine | null>(null);

  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(type === "voice");
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<any>(null);
  const isVideo = type === "video";
  const channel = (channelName as string) || `call_${id}`;
  const isIncoming = callerId !== user?.id;

  useEffect(() => {
    initAgora();
    return () => {
      endCall();
    };
  }, []);

  // Listen for call end from other side
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "calls", channel), (snap) => {
      if (!snap.exists()) {
        // Call was ended by other party
        cleanup();
        router.back();
      }
    });
    return () => unsub();
  }, [channel]);

  const initAgora = async () => {
    try {
      engine.current = createAgoraRtcEngine();
      engine.current.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      engine.current.addListener("onUserJoined", (connection, uid) => {
        setRemoteUid(uid);
        startTimer();
      });

      engine.current.addListener("onUserOffline", () => {
        setRemoteUid(null);
        endCall();
      });

      if (isVideo && !videoOff) {
        engine.current.enableVideo();
        engine.current.startPreview();
      } else {
        engine.current.enableAudio();
      }

      await engine.current.joinChannel("", channel, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });

      setJoined(true);

      // Save call doc so other side knows call is active
      await setDoc(doc(db, "calls", channel), {
        callerId: user?.id,
        callerName: user?.name,
        type,
        channel,
        startedAt: new Date().toISOString(),
      });

    } catch (e: any) {
      Alert.alert("Call Error", e.message);
      router.back();
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration(d => d + 1);
    }, 1000);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const cleanup = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      engine.current?.leaveChannel();
      engine.current?.release();
      await deleteDoc(doc(db, "calls", channel));
    } catch {}
  };

  const endCall = async () => {
    await cleanup();
    router.back();
  };

  const toggleMute = () => {
    engine.current?.muteLocalAudioStream(!muted);
    setMuted(!muted);
  };

  const toggleVideo = () => {
    if (!isVideo) return;
    if (videoOff) {
      engine.current?.enableVideo();
      engine.current?.startPreview();
    } else {
      engine.current?.disableVideo();
    }
    setVideoOff(!videoOff);
  };

  const toggleSpeaker = () => {
    engine.current?.setEnableSpeakerphone(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Remote video */}
      {isVideo && remoteUid !== null && !videoOff ? (
        <RtcSurfaceView
          style={StyleSheet.absoluteFill}
          canvas={{ uid: remoteUid }}
        />
      ) : (
        <View style={styles.noVideo}>
          <Ionicons name="person-circle-outline" size={120} color="rgba(255,255,255,0.3)" />
          <Text style={styles.callerName}>{callerName ?? "User"}</Text>
          <Text style={styles.callStatus}>
            {remoteUid ? formatDuration(callDuration) : joined ? "Ringing..." : "Connecting..."}
          </Text>
        </View>
      )}

      {/* Local video preview */}
      {isVideo && joined && !videoOff && (
        <RtcSurfaceView
          style={styles.localVideo}
          canvas={{ uid: 0 }}
        />
      )}

      {/* Call duration */}
      {remoteUid && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleMute}>
          <Ionicons name={muted ? "mic-off" : "mic"} size={26} color="#fff" />
          <Text style={styles.controlLabel}>{muted ? "Unmute" : "Mute"}</Text>
        </TouchableOpacity>

        {isVideo && (
          <TouchableOpacity style={styles.controlBtn} onPress={toggleVideo}>
            <Ionicons name={videoOff ? "videocam-off" : "videocam"} size={26} color="#fff" />
            <Text style={styles.controlLabel}>{videoOff ? "Start Video" : "Stop Video"}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.controlBtn} onPress={toggleSpeaker}>
          <Ionicons name="volume-high" size={26} color="#fff" />
          <Text style={styles.controlLabel}>Speaker</Text>
        </TouchableOpacity>

        {/* End call */}
        <TouchableOpacity style={styles.endBtn} onPress={endCall}>
          <Ionicons name="call" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  noVideo: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  callerName: { fontSize: 28, fontWeight: "700", color: "#fff" },
  callStatus: { fontSize: 16, color: "rgba(255,255,255,0.6)" },
  localVideo: {
    position: "absolute", top: 60, right: 16,
    width: 100, height: 140, borderRadius: 12,
    borderWidth: 2, borderColor: "#fff", zIndex: 10,
  },
  durationBadge: {
    position: "absolute", top: 60, left: 0, right: 0, alignItems: "center",
  },
  durationText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  controls: {
    position: "absolute", bottom: 50, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center",
    alignItems: "center", gap: 20, paddingHorizontal: 20,
  },
  controlBtn: { alignItems: "center", gap: 4 },
  controlLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  endBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#FF3B30",
    alignItems: "center", justifyContent: "center",
    marginLeft: 12,
  },
});
