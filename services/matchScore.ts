import { User } from '../types';

export const calculateMatchScore = (userA: User, userB: User): number => {
  let score = 0;
  let total = 0;

  // Shared interests
  const interestsA = userA.interests ?? [];
  const interestsB = userB.interests ?? [];
  const sharedInterests = interestsA.filter(i => interestsB.includes(i));
  score += sharedInterests.length * 15;
  total += 45;

  // Same location
  if (userA.location && userB.location) {
    if (userA.location.toLowerCase() === userB.location.toLowerCase()) score += 20;
    total += 20;
  }

  // Same purpose
  if (userA.purpose && userB.purpose) {
    if (userA.purpose === userB.purpose) score += 20;
    total += 20;
  }

  // Age compatibility
  if (userA.age && userB.age) {
    const diff = Math.abs(userA.age - userB.age);
    if (diff <= 3) score += 15;
    else if (diff <= 7) score += 10;
    else if (diff <= 12) score += 5;
    total += 15;
  }

  // Has photo
  if (userB.photos?.length > 0) score += 10;
  total += 10;

  const percent = total > 0 ? Math.round((score / total) * 100) : 50;
  return Math.min(percent, 99);
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#3ddc84';
  if (score >= 60) return '#FFD166';
  return '#FF4B6E';
};

export const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Great Match! 💕';
  if (score >= 60) return 'Good Match 😊';
  return 'Low Match 🤔';
};
