import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageList } from '../../components/chat/MessageList';
import { ChatInput } from '../../components/chat/ChatInput';
import { useChat } from '../../hooks/useChat';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { messages, send } = useChat(id);

  useEffect(() => {
    navigation.setOptions({ title: 'Chat' });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <MessageList messages={messages} matchId={id} />
      <ChatInput onSend={(text: string) => send(text)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
