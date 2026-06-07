export interface User {
  id: string;
  name: string;
  age?: number;
  dob?: string;
  bio?: string;
  photos: string[];
  location?: string;
  gender?: string;
  lookingFor?: string;
  interests?: string[];
  height?: string;
  weight?: string;
  physique?: string;
  education?: string;
  financial?: string;
  dwelling?: string;
  car?: string;
  smoking?: string;
  alcohol?: string;
  children?: string;
  sociability?: string;
  purpose?: string;
  isPremium?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  diamonds?: number;
  followingCount?: number;
  followersCount?: number;
}

export interface Match {
  id: string;
  users: string[];
  createdAt?: string;
  lastMessage?: { text: string };
  unreadCount?: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt?: string;
  read?: boolean;
}

export type SwipeActionType = "like" | "pass" | "superlike";

export interface SwipeAction {
  userId: string;
  targetId: string;
  action: SwipeActionType;
}
