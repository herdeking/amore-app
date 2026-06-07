import { useState, useEffect } from 'react';
import { User } from '../types';
import { useAuthStore } from '../store/authStore';
import { fetchProfiles, recordSwipe } from '../services/swipeService';
import { sendLocalNotification } from '../services/notifications';

const DEMO_PROFILES: User[] = [
  { id: 'd1', name: 'Amara', age: 24, bio: 'Love hiking and cooking 🍳', photos: ['https://randomuser.me/api/portraits/women/1.jpg'], location: 'Lagos', interests: ['Hiking', 'Cooking'] },
  { id: 'd2', name: 'Chioma', age: 26, bio: 'Artist & dreamer ✨', photos: ['https://randomuser.me/api/portraits/women/2.jpg'], location: 'Abuja', interests: ['Art', 'Music'] },
  { id: 'd3', name: 'Fatima', age: 23, bio: 'Coffee addict ☕ travel lover', photos: ['https://randomuser.me/api/portraits/women/3.jpg'], location: 'Kano', interests: ['Travel', 'Coffee'] },
  { id: 'd4', name: 'Ngozi', age: 27, bio: 'Doctor by day, dancer by night 💃', photos: ['https://randomuser.me/api/portraits/women/4.jpg'], location: 'Port Harcourt', interests: ['Dancing', 'Medicine'] },
  { id: 'd5', name: 'Blessing', age: 25, bio: 'Foodie & Netflix enthusiast 🎬', photos: ['https://randomuser.me/api/portraits/women/5.jpg'], location: 'Ibadan', interests: ['Food', 'Movies'] },
  { id: 'd6', name: 'Adaeze', age: 22, bio: 'Tech girl building the future 💻', photos: ['https://randomuser.me/api/portraits/women/6.jpg'], location: 'Lagos', interests: ['Tech', 'Gaming'] },
  { id: 'd7', name: 'Kemi', age: 28, bio: 'Yoga & mindfulness 🧘', photos: ['https://randomuser.me/api/portraits/women/7.jpg'], location: 'Enugu', interests: ['Yoga', 'Wellness'] },
  { id: 'd8', name: 'Tolu', age: 24, bio: 'Music producer & singer 🎵', photos: ['https://randomuser.me/api/portraits/women/8.jpg'], location: 'Lagos', interests: ['Music', 'Production'] },
  { id: 'd9', name: 'Halima', age: 26, bio: 'Fashion designer with big dreams 👗', photos: ['https://randomuser.me/api/portraits/women/9.jpg'], location: 'Abuja', interests: ['Fashion', 'Design'] },
  { id: 'd10', name: 'Uju', age: 23, bio: 'Bookworm & beach lover 📚', photos: ['https://randomuser.me/api/portraits/women/10.jpg'], location: 'Calabar', interests: ['Reading', 'Beach'] },
  { id: 'd11', name: 'Sade', age: 27, bio: 'Chef & food blogger 🍽️', photos: ['https://randomuser.me/api/portraits/women/11.jpg'], location: 'Lagos', interests: ['Cooking', 'Blogging'] },
  { id: 'd12', name: 'Ini', age: 25, bio: 'Lawyer who loves to laugh 😂', photos: ['https://randomuser.me/api/portraits/women/12.jpg'], location: 'Uyo', interests: ['Law', 'Comedy'] },
  { id: 'd13', name: 'Zainab', age: 24, bio: 'Photographer capturing moments 📸', photos: ['https://randomuser.me/api/portraits/women/13.jpg'], location: 'Kano', interests: ['Photography', 'Travel'] },
  { id: 'd14', name: 'Ebere', age: 26, bio: 'Fitness coach & nutrition lover 💪', photos: ['https://randomuser.me/api/portraits/women/14.jpg'], location: 'Lagos', interests: ['Fitness', 'Nutrition'] },
  { id: 'd15', name: 'Aisha', age: 22, bio: 'Student. Dreamer. Go-getter 🌟', photos: ['https://randomuser.me/api/portraits/women/15.jpg'], location: 'Abuja', interests: ['Learning', 'Travel'] },
];

export const useSwipe = () => {
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState<User[]>([]);
  const [matched, setMatched] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setProfiles(DEMO_PROFILES);
        return;
      }
      const real = await fetchProfiles(user.id);
      setProfiles(real.length > 0 ? [...real, ...DEMO_PROFILES] : DEMO_PROFILES);
    };
    load();
  }, [user?.id]);

  const swipe = async (id: string, action: 'like' | 'pass' | 'superlike') => {
    if (!user?.id) {
      // demo mode
      return { matched: false };
    }
    const result = await recordSwipe({
      userId: user.id,
      targetId: id,
      action,
    });

    if (result.matched) {
      const matchedProfile = profiles.find(p => p.id === id);
      if (matchedProfile) {
        setMatchedUser(matchedProfile);
        setMatched(true);
        await sendLocalNotification(
          "It's a Match! 💕",
          `You and ${matchedProfile.name} liked each other!`
        );
      }
    }
    return result;
  };

  const dismissMatch = () => {
    setMatched(false);
    setMatchedUser(null);
  };

  return { profiles, swipe, matched, matchedUser, dismissMatch };
};
