import { useState } from 'react';
import { sendLocalNotification } from '../services/notifications';
import { User } from '../types';

const DEMO_PROFILES: User[] = [
  { id: '1', name: 'Amara', age: 24, bio: 'Love hiking and cooking 🍳', photos: ['https://randomuser.me/api/portraits/women/1.jpg'], location: 'Lagos', interests: ['Hiking', 'Cooking'] },
  { id: '2', name: 'Chioma', age: 26, bio: 'Artist & dreamer ✨', photos: ['https://randomuser.me/api/portraits/women/2.jpg'], location: 'Abuja', interests: ['Art', 'Music'] },
  { id: '3', name: 'Fatima', age: 23, bio: 'Coffee addict ☕ travel lover', photos: ['https://randomuser.me/api/portraits/women/3.jpg'], location: 'Kano', interests: ['Travel', 'Coffee'] },
  { id: '4', name: 'Ngozi', age: 27, bio: 'Doctor by day, dancer by night 💃', photos: ['https://randomuser.me/api/portraits/women/4.jpg'], location: 'Port Harcourt', interests: ['Dancing', 'Medicine'] },
  { id: '5', name: 'Blessing', age: 25, bio: 'Foodie & Netflix enthusiast 🎬', photos: ['https://randomuser.me/api/portraits/women/5.jpg'], location: 'Ibadan', interests: ['Food', 'Movies'] },
  { id: '6', name: 'Adaeze', age: 22, bio: 'Tech girl building the future 💻', photos: ['https://randomuser.me/api/portraits/women/6.jpg'], location: 'Lagos', interests: ['Tech', 'Gaming'] },
  { id: '7', name: 'Kemi', age: 28, bio: 'Yoga & mindfulness 🧘', photos: ['https://randomuser.me/api/portraits/women/7.jpg'], location: 'Enugu', interests: ['Yoga', 'Wellness'] },
  { id: '8', name: 'Tolu', age: 24, bio: 'Music producer & singer 🎵', photos: ['https://randomuser.me/api/portraits/women/8.jpg'], location: 'Lagos', interests: ['Music', 'Production'] },
  { id: '9', name: 'Halima', age: 26, bio: 'Fashion designer with big dreams 👗', photos: ['https://randomuser.me/api/portraits/women/9.jpg'], location: 'Abuja', interests: ['Fashion', 'Design'] },
  { id: '10', name: 'Uju', age: 23, bio: 'Bookworm & beach lover 📚', photos: ['https://randomuser.me/api/portraits/women/10.jpg'], location: 'Calabar', interests: ['Reading', 'Beach'] },
  { id: '11', name: 'Sade', age: 27, bio: 'Chef & food blogger 🍽️', photos: ['https://randomuser.me/api/portraits/women/11.jpg'], location: 'Lagos', interests: ['Cooking', 'Blogging'] },
  { id: '12', name: 'Ini', age: 25, bio: 'Lawyer who loves to laugh 😂', photos: ['https://randomuser.me/api/portraits/women/12.jpg'], location: 'Uyo', interests: ['Law', 'Comedy'] },
  { id: '13', name: 'Zainab', age: 24, bio: 'Photographer capturing moments 📸', photos: ['https://randomuser.me/api/portraits/women/13.jpg'], location: 'Kano', interests: ['Photography', 'Travel'] },
  { id: '14', name: 'Ebere', age: 26, bio: 'Fitness coach & nutrition lover 💪', photos: ['https://randomuser.me/api/portraits/women/14.jpg'], location: 'Lagos', interests: ['Fitness', 'Nutrition'] },
  { id: '15', name: 'Aisha', age: 22, bio: 'Student. Dreamer. Go-getter 🌟', photos: ['https://randomuser.me/api/portraits/women/15.jpg'], location: 'Abuja', interests: ['Learning', 'Travel'] },
];

export const useSwipe = () => {
  const [matched, setMatched] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);

  const swipe = async (id: string, action: "like" | "pass" | "superlike") => {
    if (action === "like" || action === "superlike") {
      const user = DEMO_PROFILES.find(p => p.id === id);
      if (user && Math.random() > 0.5) {
        setMatchedUser(user);
        setMatched(true);
        await sendLocalNotification(
          "It's a Match! 💕",
          `You and ${user.name} liked each other!`
        );
      }
    }
    return undefined;
  };

  const dismissMatch = () => {
    setMatched(false);
    setMatchedUser(null);
  };

  return { profiles: DEMO_PROFILES, swipe, matched, matchedUser, dismissMatch };
};
