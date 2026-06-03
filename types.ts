export interface User {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  photos: string[];
  interests?: string[];
  location?: string;
  gender?: string;
  lookingFor?: string;
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
