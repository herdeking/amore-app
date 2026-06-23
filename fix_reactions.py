path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(path, 'r') as f:
    content = f.read()

# Fix addReaction to save to Firestore
old_reaction = """  const addReaction = (msgId: string, emoji: string) => {
    setReactions(prev => ({ ...prev, [msgId]: emoji }));
    setReactionMsgId(null);
  };"""

new_reaction = """  const addReaction = async (msgId: string, emoji: string) => {
    setReactions(prev => ({ ...prev, [msgId]: emoji }));
    setReactionMsgId(null);
    // Persist to Firestore
    if (isRealMatch && id) {
      try {
        const { doc: fDoc, updateDoc: fUpdate } = await import('firebase/firestore');
        const { db: fdb } = await import('../../services/firebase');
        await fUpdate(fDoc(fdb, 'matches', id as string, 'messages', msgId), {
          [`reactions.${user?.id}`]: emoji,
        });
      } catch {}
    }
  };"""

content = content.replace(old_reaction, new_reaction)

# Load reactions from Firestore messages
old_subscribe = """    let isFirstLoad = true;
    const unsub = subscribeToMessages(id, (msgs) => {
      if (!isFirstLoad && msgs.length > messages.length) {
        const newest = msgs[msgs.length - 1];
        if (newest.senderId !== user?.id) {
          // Use otherUser.name directly — matchName may still be 'User' if not loaded yet
          const senderName = otherUser?.name ?? 'New message';
          sendLocalNotification(`${senderName} 💬`, newest.text, 'messages');
        }
      }
      setMessages(msgs as any);
      isFirstLoad = false;
    });"""

new_subscribe = """    let isFirstLoad = true;
    const unsub = subscribeToMessages(id, (msgs) => {
      if (!isFirstLoad && msgs.length > messages.length) {
        const newest = msgs[msgs.length - 1];
        if (newest.senderId !== user?.id) {
          const senderName = otherUser?.name ?? 'New message';
          sendLocalNotification(`${senderName} 💬`, newest.text, 'messages');
        }
      }
      setMessages(msgs as any);
      // Sync reactions from Firestore into local state
      const reactionMap: Record<string, string> = {};
      msgs.forEach((m: any) => {
        if (m.reactions && typeof m.reactions === 'object') {
          const entries = Object.values(m.reactions) as string[];
          if (entries.length > 0) reactionMap[m.id] = entries[entries.length - 1];
        }
      });
      if (Object.keys(reactionMap).length > 0) {
        setReactions(prev => ({ ...prev, ...reactionMap }));
      }
      isFirstLoad = false;
    });"""

content = content.replace(old_subscribe, new_subscribe)

with open(path, 'w') as f:
    f.write(content)
print('✅ Reactions now persist to Firestore')
