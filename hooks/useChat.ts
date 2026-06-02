import { useState, useEffect } from 'react';
import { subscribeToMessages, sendMessage, markAsRead } from '../services/messages';
import { useAuthStore } from '../store/authStore';
import { Message } from '../types';

export const useChat = (matchId: string) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    const unsub = subscribeToMessages(matchId, msgs => {
      setMessages(msgs);
      msgs
        .filter(m => m.senderId !== user?.id && !m.read)
        .forEach(m => markAsRead(matchId, m.id));
    });
    return unsub;
  }, [matchId]);

  const send = async (text: string) => {
    if (!user || !text.trim()) return;
    setSending(true);
    await sendMessage(matchId, user.id, text.trim());
    setSending(false);
  };

  return { messages, send, sending };
};
