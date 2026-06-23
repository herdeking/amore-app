import os

# ── 1. Create themeStore.ts ──
theme_store = '''\
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (val: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => set((s) => ({ isDark: !s.isDark })),
      setDark: (val) => set({ isDark: val }),
    }),
    { name: 'amore-theme', storage: createJSONStorage(() => AsyncStorage) }
  )
);
'''
with open('/data/data/com.termux/files/home/amore-app/store/themeStore.ts', 'w') as f:
    f.write(theme_store)
print('✅ themeStore.ts created')

# ── 2. Create useTheme hook ──
use_theme = '''\
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
'''
os.makedirs('/data/data/com.termux/files/home/amore-app/hooks', exist_ok=True)
with open('/data/data/com.termux/files/home/amore-app/hooks/useTheme.ts', 'w') as f:
    f.write(use_theme)
print('✅ useTheme.ts created')

# ── 3. Add dark mode toggle in settings.tsx ──
settings_path = '/data/data/com.termux/files/home/amore-app/app/settings.tsx'
with open(settings_path, 'r') as f:
    content = f.read()

# Add import
old_import = "import { Colors } from '../constants/colors';"
new_import = """import { Colors } from '../constants/colors';
import { useTheme } from '../hooks/useTheme';"""
content = content.replace(old_import, new_import)

# Add hook usage after existing hooks
old_hook = "  const [notifications, setNotifications] = useState(true);"
new_hook = """  const { isDark, toggleTheme, colors } = useTheme();
  const [notifications, setNotifications] = useState(true);"""
content = content.replace(old_hook, new_hook)

# Find dark mode section in settings and add toggle
# Add after the existing Switch items - find "showOnline" switch row and add after
old_section = "  const [showOnline, setShowOnline] = useState(true);"
new_section = "  const [showOnline, setShowOnline] = useState(true);"
# Already correct, now find the render section for the switch

old_render = "            <View style={styles.settingRow}>\n              <Text style={styles.settingLabel}>Show online status</Text>"
new_render = """            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Dark mode 🌙</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={isDark ? '#fff' : '#fff'}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show online status</Text>"""
content = content.replace(old_render, new_render)

with open(settings_path, 'w') as f:
    f.write(content)
print('✅ settings.tsx updated with dark mode toggle')

# ── 4. Wrap _layout.tsx with theme background ──
layout_path = '/data/data/com.termux/files/home/amore-app/app/_layout.tsx'
with open(layout_path, 'r') as f:
    content = f.read()

old_import2 = "import { useAuth } from '../hooks/useAuth';"
new_import2 = """import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { View } from 'react-native';"""
content = content.replace(old_import2, new_import2)

old_layout_fn = "  useAuth();\n  const { user } = useAuthStore();"
new_layout_fn = """  useAuth();
  const { user } = useAuthStore();
  const { colors } = useTheme();"""
content = content.replace(old_layout_fn, new_layout_fn)

old_return = "  return (\n    <Stack screenOptions={{ headerShown: false }}>"
new_return = """  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>"""
content = content.replace(old_return, new_return)

old_close = "    </Stack>\n  );"
new_close = """    </Stack>
    </View>
  );"""
content = content.replace(old_close, new_close)

with open(layout_path, 'w') as f:
    f.write(content)
print('✅ _layout.tsx updated with theme background')

print('\n🎉 Dark mode done!')
