export interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  location: string;
  interests: string[];
  gender: 'male' | 'female' | 'other';
  lookingFor: 'male' | 'female' | 'both';
  distanceRange: number;
  ageRange: { min: number; max: number };
  createdAt: Date;
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
