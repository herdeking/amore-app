// app/call/[id].tsx
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, Alert } from "react-native";
import { JitsiMeeting, JitsiRefProps } from "@jitsi/react-native-sdk";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { db } from "../../services/firebase";
import { doc, setDoc, deleteDoc, onSnapshot, addDoc, collection } from "firebase/firestore";

const FREE_CALL_LIMIT_SECONDS = 30;

export default function CallScreen() {
  const {
    id, type, callerId, callerName,
    receiverId, receiverName, channelName, isLive
  } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const jitsiRef = useRef<JitsiRefProps>(null);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<any>(null);
  const timeLimitReachedRef = useRef(false);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const channel = (channelName as string) || `call_${id}`;
  const isVideo = type === "video";

  useEffect(() => {
    if (isLive !== "true") {
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
    }
    return () => { cleanup(); };
  }, []);

  const saveCallHistory = async () => {
    if (isLive === "true") return;
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
      try { await deleteDoc(doc(db, "liveStreams", user.id)); } catch {}
    }
  };

  const endCall = async () => {
    try { jitsiRef.current?.close(); } catch {}
    await cleanup();
    router.back();
  };

  const onConferenceJoined = () => {
    timerRef.current = setInterval(() => {
      setCallDuration(d => {
        const next = d + 1;
        if (!user?.isPremium && next >= FREE_CALL_LIMIT_SECONDS && !timeLimitReachedRef.current) {
          timeLimitReachedRef.current = true;
          try { jitsiRef.current?.close(); } catch {}
        }
        return next;
      });
    }, 1000);
  };

  const onConferenceLeft = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await cleanup();
    if (timeLimitReachedRef.current) {
      Alert.alert(
        "Time's up! ⏰",
        "Free calls are limited to 30 seconds. Upgrade to VIP for unlimited calls!",
        [
          { text: "Maybe Later", style: "cancel", onPress: () => router.back() },
          { text: "👑 Get VIP", onPress: () => { router.back(); router.push('/payment' as any); } },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <JitsiMeeting
        ref={jitsiRef}
        room={channel}
        serverURL="https://meet.jit.si"
        userInfo={{
          displayName: user?.name ?? "User",
          avatarURL: user?.photos?.[0] ?? "",
          email: "",
        }}
        config={{
          startWithAudioMuted: false,
          startWithVideoMuted: !isVideo,
          requireDisplayName: false,
          subject: isLive === "true" ? "Amore Live" : "Amore Call",
        }}
        flags={{
          "audio-mute.enabled": true,
          "video-mute.enabled": true,
          "audioOnly.enabled": !isVideo,
          "fullscreen.enabled": false,
          "ios.screensharing.enabled": false,
          "pip.enabled": false,
          "invite.enabled": false,
          "meeting-name.enabled": false,
          "add-people.enabled": false,
          "calendar.enabled": false,
          "car-mode.enabled": false,
          "chat.enabled": true,
          "closed-captions.enabled": false,
          "conference-timer.enabled": true,
          "filmstrip.enabled": true,
          "kick-out.enabled": false,
          "live-streaming.enabled": false,
          "overflow-menu.enabled": true,
          "video-share.enabled": false,
          "recording.enabled": false,
          "security-options.enabled": false,
          "settings.enabled": true,
          "speakerstats.enabled": false,
          "tile-view.enabled": true,
          "toolbox.alwaysVisible": false,
          "prejoinpage.enabled": false,
          "welcomepage.enabled": false,
          "lobby-mode.enabled": false,
        }}
        eventListeners={{
          onConferenceJoined,
          onConferenceLeft,
          onReadyToClose: endCall,
        }}
        style={styles.jitsi}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  jitsi: { flex: 1 },
});
