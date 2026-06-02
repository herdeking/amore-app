import { useEffect } from 'react';
import { onAuthChange, getProfile } from '../services/auth';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, firebaseUid, isLoading, setUser, setFirebaseUid, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthChange(async firebaseUser => {
      setLoading(true);
      if (firebaseUser) {
        setFirebaseUid(firebaseUser.uid);
        const profile = await getProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setFirebaseUid(null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, firebaseUid, isLoading };
};

cat > hooks/useSwipe.ts << 'EOF'
import { useEffect, useCallback } from 'react';
import { fetchProfiles } from '../services/profiles';
import { recordSwipe, checkMutualLike, createMatch } from '../services/matches';
import { useAuthStore } from '../store/authStore';
import { useMatchStore } from '../store/matchStore';

export const useSwipe = () => {
  const { user } = useAuthStore();
  const { profiles, swipedIds, setProfiles, addSwipedId, removeTopProfile, setMatches, matches } = useMatchStore();

  useEffect(() => {
    if (!user) return;
    fetchProfiles(user, swipedIds).then(setProfiles);
  }, [user]);

  const swipe = useCallback(async (targetId: string, action: 'like' | 'pass' | 'superlike') => {
    if (!user) return;

    addSwipedId(targetId);
    removeTopProfile();

    await recordSwipe({
      userId: user.id,
      targetId,
      action,
      createdAt: new Date(),
    });

    if (action === 'like' || action === 'superlike') {
      const mutual = await checkMutualLike(user.id, targetId);
      if (mutual) {
        const match = await createMatch(user.id, targetId);
        setMatches([...matches, match]);
        return { matched: true, matchId: match.id };
      }
    }

    return { matched: false };
  }, [user, matches]);

  return { profiles, swipe };
};
