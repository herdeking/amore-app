export interface User {
  id: string;
  name: string;
  age?: number;
  dob?: string;
  bio: string;
  photos: string[];
  location: string;
  interests: string[];
  gender: string;
  lookingFor: string;
  distanceRange?: number;
  ageRange?: { min: number; max: number };
  minAge?: number;
  maxAge?: number;
  createdAt: Date;
  height?: number;
  weight?: number;
  physique?: string;
  education?: string;
  financialSituation?: string;
  dwelling?: string;
  car?: string;
  smoking?: string;
  sociability?: string;
}

export interface Match {
  id: string;
  users: [string, string];
  createdAt: Date;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  createdAt: Date;
  read: boolean;
}

export interface SwipeAction {
  userId: string;
  targetId: string;
  action: 'like' | 'pass' | 'superlike';
  createdAt: Date;
}
