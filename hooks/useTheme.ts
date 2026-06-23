import { useThemeStore } from '../store/themeStore';

export const LightColors = {
  primary: '#FF4B6E',
  secondary: '#FF8C6B',
  accent: '#FFD93D',
  background: '#FFFFFF',
  surface: '#F8F8F8',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textLight: '#8A8A9B',
  border: '#EBEBEB',
  success: '#4CAF50',
  error: '#F44336',
  like: '#4CDF6A',
  pass: '#FF4B6E',
  superlike: '#4FC3F7',
  overlay: 'rgba(0,0,0,0.4)',
  white: '#FFFFFF',
  black: '#000000',
  inputBg: '#F5F5F5',
  tabBar: '#FFFFFF',
  headerBg: '#FFFFFF',
};

export const DarkColors = {
  primary: '#FF4B6E',
  secondary: '#FF8C6B',
  accent: '#FFD93D',
  background: '#0F0F0F',
  surface: '#1A1A1A',
  card: '#1E1E1E',
  text: '#F0F0F0',
  textLight: '#9A9AB0',
  border: '#2A2A2A',
  success: '#4CAF50',
  error: '#F44336',
  like: '#4CDF6A',
  pass: '#FF4B6E',
  superlike: '#4FC3F7',
  overlay: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF',
  black: '#000000',
  inputBg: '#2A2A2A',
  tabBar: '#1A1A1A',
  headerBg: '#1A1A1A',
};

export const useTheme = () => {
  const { isDark, toggleTheme, setDark } = useThemeStore();
  const colors = isDark ? DarkColors : LightColors;
  return { isDark, toggleTheme, setDark, colors };
};
