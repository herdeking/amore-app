// app/call/[id].tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { db } from "../../services/firebase";
import { doc, setDoc, deleteDoc, onSnapshot, addDoc, collection } from "firebase/firestore";

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export default function CallScreen() {
  const {
    id, type, callerId, callerName,
    receiverId, receiverName, channelName, isLive
  } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [callDuration, setCallDuration] = useState(0);
  const [connected, setConnected] = useState(false);
  const timerRef = useRef<any>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const channel = (channelName as string) || `call_${id}`;
  const isVideo = type === "video";
  const isHost = (callerId as string) === user?.id;
  const otherName = isHost ? (receiverName as string) : (callerName as string);

  useEffect(() => {
    if (isLive === "true") {
      // Live streams: no shared "calls" doc that ends the session for everyone
      return () => { cleanup(); };
    }
    setDoc(doc(db, "calls", channel), {
      callerId: callerId ?? user?.id,
      callerName: callerName ?? user?.name,
      receiverId: receiverId ?? null,
      receiverName: receiverName ?? null,
      type,
      channel,
      startedAt: startedAtRef.current,
    }).catch(() => {});

    const unsub = onSnapshot(doc(db, "calls", channel), (snap) => {
      if (!snap.exists()) { cleanup(); router.back(); }
    });

    return () => { unsub(); cleanup(); };
  }, []);

  const saveCallHistory = async () => {
    if (isLive === "true") return; // skip history for live streams
    try {
      const participants = [callerId ?? user?.id, receiverId].filter(Boolean) as string[];
      if (participants.length < 1) return;
      await addDoc(collection(db, "callHistory"), {
        callerId: callerId ?? user?.id,
        callerName: callerName ?? user?.name,
        receiverId: receiverId ?? null,
        receiverName: receiverName ?? null,
        type,
        duration: callDuration,
        startedAt: startedAtRef.current,
        endedAt: new Date().toISOString(),
        participants,
      });
    } catch (e) {
      console.log("saveCallHistory error:", e);
    }
  };

  const cleanup = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await saveCallHistory();
    if (isLive !== "true") {
      try { await deleteDoc(doc(db, "calls", channel)); } catch {}
    } else if (user?.id && (callerId as string) === user.id) {
      // Only the host deletes the liveStreams doc when they end the stream
      try { await deleteDoc(doc(db, "liveStreams", user.id)); } catch {}
    }
  };

  const endCall = async () => { await cleanup(); router.back(); };

  const onLoad = () => {
    setConnected(true);
    timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const roomName = `amore-${channel}`.replace(/[^a-zA-Z0-9-]/g, "-");
  const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(user?.name ?? "User")}"&config.startWithVideoMuted=${!isVideo}&config.startWithAudioMuted=false&config.prejoinPageEnabled=false&config.disableDeepLinking=true&config.disableInviteFunctions=true&config.toolbarButtons=microphone,camera,hangup,chat,tileview&config.disableVirtualBackground=true&config.disableProfile=true&config.disableAddingBackgroundImages=true`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={endCall} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.callerName}>{otherName ?? (isLive === "true" ? "Live Stream" : "User")}</Text>
          <Text style={styles.duration}>
            {connected ? formatDuration(callDuration) : "Connecting..."}
          </Text>
        </View>
        <TouchableOpacity style={styles.endBtn} onPress={endCall}>
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={styles.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>
      <WebView
        source={{ uri: jitsiUrl }}
        style={styles.webview}
        userAgent={DESKTOP_UA}
        onLoad={onLoad}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        onError={() => Alert.alert("Error", "Could not connect to call")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  backBtn: { padding: 6 },
  headerInfo: { flex: 1 },
  callerName: { fontSize: 18, fontWeight: "700", color: "#fff" },
  duration: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  webview: { flex: 1 },
  endBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FF3B30", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  endBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
