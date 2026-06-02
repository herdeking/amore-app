import { useEffect } from 'react';
import { fetchMatches } from '../services/matches';
import { useAuthStore } from '../store/authStore';
import { useMatchStore } from '../store/matchStore';

export const useMatches = () => {
  const { user } = useAuthStore();
  const { matches, setMatches } = useMatchStore();

  useEffect(() => {
    if (!user) return;
    fetchMatches(user.id).then(setMatches);
  }, [user]);

  return { matches };
};
