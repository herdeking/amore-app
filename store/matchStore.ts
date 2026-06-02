import { create } from 'zustand';
import { Match, User } from '../types';

interface MatchState {
  profiles: User[];
  matches: Match[];
  swipedIds: string[];
  setProfiles: (profiles: User[]) => void;
  setMatches: (matches: Match[]) => void;
  addSwipedId: (id: string) => void;
  removeTopProfile: () => void;
}

export const useMatchStore = create<MatchState>(set => ({
  profiles: [],
  matches: [],
  swipedIds: [],
  setProfiles: profiles => set({ profiles }),
  setMatches: matches => set({ matches }),
  addSwipedId: id => set(s => ({ swipedIds: [...s.swipedIds, id] })),
  removeTopProfile: () => set(s => ({ profiles: s.profiles.slice(1) })),
}));
