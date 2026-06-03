import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useChat } from '../../hooks/useChat';
import { MessageList } from '../../components/chat/MessageList';
import { ChatInput } from '../../components/chat/ChatInput';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { messages, send } = useChat(id);

  useEffect(() => {
    navigation.setOptions({ title: 'Chat' });
  }, []);

  return (
    <View style={styles.container}>
      <MessageList matchId={id} />
      <ChatInput onSend={(text) => send(text)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});
