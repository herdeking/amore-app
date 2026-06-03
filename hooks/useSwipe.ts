import { User } from '../types';

export const useSwipe = () => {
  return {
    profiles: [] as User[],
    swipe: async (id: string, action: 'like' | 'pass' | 'superlike') => undefined,
    matched: false,
    matchedUser: null as User | null,
    dismissMatch: () => {},
  };
};
