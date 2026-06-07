import { db } from './firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

const AI_DAILY_LIMIT_FREE = 5;

export const getAIReply = async (
  userId: string,
  isPremium: boolean,
  matchProfile: any,
  lastMessage: string
): Promise<{ reply: string; error?: string }> => {
  try {
    // Check daily limit for free users
    if (!isPremium) {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const today = new Date().toDateString();
      const aiUsage = userData?.aiUsage ?? { date: today, count: 0 };

      if (aiUsage.date !== today) {
        await updateDoc(userRef, { aiUsage: { date: today, count: 0 } });
      } else if (aiUsage.count >= AI_DAILY_LIMIT_FREE) {
        return {
          reply: '',
          error: 'You have used all 5 free AI replies today. Upgrade to VIP for unlimited AI replies! 👑',
        };
      }
      await updateDoc(userRef, { 'aiUsage.count': increment(1), 'aiUsage.date': today });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `You are helping someone reply on a dating app. 
Match profile: Name: ${matchProfile.name}, Age: ${matchProfile.age}, Bio: ${matchProfile.bio}, Interests: ${(matchProfile.interests || []).join(', ')}.
Last message received: "${lastMessage}"
Write a friendly, flirty, and natural reply in 1-2 sentences. No quotes, just the reply.`,
        }],
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? 'Hey! How are you doing today? 😊';
    return { reply };
  } catch (e) {
    return { reply: 'Hey! How are you doing today? 😊' };
  }
};

export const getIcebreakers = async (
  userId: string,
  isPremium: boolean,
  matchProfile: any
): Promise<string[]> => {
  try {
    if (!isPremium) {
      return [
        `Hey ${matchProfile.name}! I noticed you like ${matchProfile.interests?.[0] ?? 'interesting things'} 😊`,
        `Hi ${matchProfile.name}! What brings you to Amore? 💕`,
      ];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Generate 3 fun and flirty opening messages for a dating app.
Match profile: Name: ${matchProfile.name}, Age: ${matchProfile.age}, Bio: ${matchProfile.bio}, Interests: ${(matchProfile.interests || []).join(', ')}, Location: ${matchProfile.location}.
Return only a JSON array of 3 strings. No explanation.`,
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    return [
      `Hey ${matchProfile.name}! 😊`,
      `Hi ${matchProfile.name}! How is your day going? 💕`,
      `Hey! I love that you are into ${matchProfile.interests?.[0] ?? 'cool things'}!`,
    ];
  }
};
