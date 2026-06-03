import { User, Match } from '../types';

export const signIn = async (email: string, password: string) => {};
export const signUp = async (email: string, password: string, name?: string) => {};
export const logOut = async () => {};
export const getProfile = async (userId: string): Promise<User | null> => null;
export const onAuthChange = (callback: (user: any) => void) => () => {};
