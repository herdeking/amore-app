import React, { useRef, useEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ChatBubble } from './ChatBubble';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';

interface Props {
  matchId: string;
}

export const MessageList: React.FC<Props> = ({ matchId }) => {
  const { messages } = useChat(matchId);
  const { user } = useAuthStore();
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={m => m.id}
      renderItem={({ item }) => (
        <ChatBubble message={item} isOwn={item.senderId === user?.id} />
      )}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: { paddingVertical: 12 },
});
