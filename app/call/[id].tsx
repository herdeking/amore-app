// app/call/[id].tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Dimensions
} from "react-native";
import { RTCView, MediaStream } from "react-native-webrtc";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { db } from "../../services/firebase";
import { doc, addDoc, collection, deleteDoc } from "firebase/firestore";
import { WebRTCCall, CallType } from "../../services/webrtcService";

const FREE_CALL_LIMIT = 30;
const { width, height } = Dimensions.get("window");

export default function CallScreen() {
  const {
    id, type, callerId, callerName,
    receiverId, receiverName, channelName, isAnswering
  } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const callRef = useRef<WebRTCCall | null>(null);
  const timerRef = useRef<any>(null);
  const timeLimitHitRef = useRef(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [status, setStatus] = useState<"connecting" | "ringing" | "connected" | "ended">("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  const callId = (channelName as string) || `call_${id}_${Date.now()}`;
  const isVideo = type === "video";
  const isCallee = isAnswering === "true";
  const otherName = isCallee ? (callerName as string) : (receiverName as string);

  useEffect(() => {
    initCall();
    return () => { endCall(false); };
  }, []);

  const initCall = async () => {
    try {
      const webrtc = new WebRTCCall(callId, user?.id ?? "");
      callRef.current = webrtc;

      webrtc.onRemoteStream = (stream) => {
        setRemoteStream(stream);
        setStatus("connected");
        startTimer();
      };

      webrtc.onConnected = () => {
        setStatus("connected");
        startTimer();
      };

      webrtc.onCallEnded = () => {
        endCall(true);
      };

      const stream = await webrtc.initLocalStream(isVideo);
      setLocalStream(stream);

      if (isCallee) {
        setStatus("connecting");
        await webrtc.answerCall();
      } else {
        setStatus("ringing");
        await webrtc.createOffer(
          type as CallType,
          user?.id ?? "",
          user?.name ?? "",
          receiverId as string,
          receiverName as string
        );
      }
    } catch (e: any) {
      Alert.alert("Call Error", e.message ?? "Could not start call");
      router.back();
    }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setCallDuration(d => {
        const next = d + 1;
        if (!user?.isPremium && next >= FREE_CALL_LIMIT && !timeLimitHitRef.current) {
          timeLimitHitRef.current = true;
          endCall(false);
          Alert.alert(
            "Time is up ⏰",
            "Free calls are limited to 30 seconds. Upgrade to VIP for unlimited calls!",
            [
              { text: "Maybe Later", style: "cancel" },
              { text: "👑 Get VIP", onPress: () => router.push("/payment" as any) },
            ]
          );
        }
        return next;
      });
    }, 1000);
  };

  const endCall = async (navigate = true) => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await callRef.current?.endCall();
    } catch {}
    callRef.current?.cleanup();

    // Save call history
    try {
      const participants = [user?.id, isCallee ? (callerId as string) : (receiverId as string)].filter(Boolean);
      await addDoc(collection(db, "callHistory"), {
        callerId: isCallee ? callerId : user?.id,
        callerName: isCallee ? callerName : user?.name,
        receiverId: isCallee ? user?.id : receiverId,
        receiverName: isCallee ? user?.name : receiverName,
        type,
        duration: callDuration,
        startedAt: new Date().toISOString(),
        participants,
      });
    } catch {}

    // Clean up invite
    try { await deleteDoc(doc(db, "callInvites", user?.id ?? "")); } catch {}

    setStatus("ended");
    if (navigate) router.back();
  };

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  const toggleMute = () => {
    const muted = callRef.current?.toggleMute();
    if (muted !== undefined) setIsMuted(muted);
  };

  const toggleCamera = () => {
    callRef.current?.toggleCamera();
    setIsCameraOff(p => !p);
  };

  const flipCamera = () => callRef.current?.switchCamera();

  const statusText = status === "ringing" ? "Ringing..." : status === "connecting" ? "Connecting..." : status === "connected" ? fmt(callDuration) : "Call Ended";

  return (
    <SafeAreaView style={styles.container}>
      {/* Remote video / background */}
      {remoteStream && isVideo ? (
        <RTCView
          streamURL={(remoteStream as any).toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={styles.audioBackground}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{otherName?.[0]?.toUpperCase() ?? "?"}</Text>
          </View>
          <Text style={styles.callerName}>{otherName}</Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      )}

      {/* Local video (PiP) */}
      {localStream && isVideo && (
        <RTCView
          streamURL={(localStream as any).toURL()}
          style={styles.localVideo}
          objectFit="cover"
          mirror={true}
          zOrder={1}
        />
      )}

      {/* Header */}
      {isVideo && (
        <View style={styles.header}>
          <Text style={styles.headerName}>{otherName}</Text>
          <Text style={styles.headerStatus}>{statusText}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, isMuted && styles.controlBtnActive]} onPress={toggleMute}>
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={26} color="#fff" />
          <Text style={styles.controlLabel}>{isMuted ? "Unmute" : "Mute"}</Text>
        </TouchableOpacity>

        {isVideo && (
          <TouchableOpacity style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]} onPress={toggleCamera}>
            <Ionicons name={isCameraOff ? "videocam-off" : "videocam"} size={26} color="#fff" />
            <Text style={styles.controlLabel}>{isCameraOff ? "Cam On" : "Cam Off"}</Text>
          </TouchableOpacity>
        )}

        {isVideo && (
          <TouchableOpacity style={styles.controlBtn} onPress={flipCamera}>
            <Ionicons name="camera-reverse" size={26} color="#fff" />
            <Text style={styles.controlLabel}>Flip</Text>
          </TouchableOpacity>
        )}

        {!isVideo && (
          <TouchableOpacity style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]} onPress={() => setIsSpeaker(p => !p)}>
            <Ionicons name={isSpeaker ? "volume-high" : "volume-low"} size={26} color="#fff" />
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.controlBtn, styles.endBtn]} onPress={() => endCall(true)}>
          <Ionicons name="call" size={26} color="#fff" />
          <Text style={styles.controlLabel}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Free user timer warning */}
      {!user?.isPremium && status === "connected" && callDuration >= 20 && (
        <View style={styles.timerWarning}>
          <Text style={styles.timerWarningText}>⏰ {FREE_CALL_LIMIT - callDuration}s remaining (Free)</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  remoteVideo: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  audioBackground: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  avatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#FF4B6E", alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 48, fontWeight: "700", color: "#fff" },
  callerName: { fontSize: 28, fontWeight: "700", color: "#fff" },
  statusText: { fontSize: 16, color: "rgba(255,255,255,0.7)" },
  localVideo: { position: "absolute", top: 80, right: 16, width: 100, height: 150, borderRadius: 12, backgroundColor: "#000", overflow: "hidden" },
  header: { position: "absolute", top: 50, left: 0, right: 0, alignItems: "center" },
  headerName: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerStatus: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  controls: { position: "absolute", bottom: 40, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 16, paddingHorizontal: 24 },
  controlBtn: { alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 50, padding: 16 },
  controlBtnActive: { backgroundColor: "rgba(255,255,255,0.4)" },
  controlLabel: { fontSize: 11, color: "#fff" },
  endBtn: { backgroundColor: "#FF3B30" },
  timerWarning: { position: "absolute", top: 110, left: 0, right: 0, alignItems: "center" },
  timerWarningText: { backgroundColor: "rgba(255,60,60,0.8)", color: "#fff", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, fontSize: 13, fontWeight: "600" },
});
