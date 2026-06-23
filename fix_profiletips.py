import os

# ── 1. Create ProfileCompletionTips component ──
tips_component = '''\
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  user: any;
  onFieldPress: (field: string) => void;
}

const REQUIRED_FIELDS = [
  { key: 'photos', label: 'Add a profile photo', check: (u: any) => (u.photos?.length ?? 0) > 0, icon: '📷' },
  { key: 'bio', label: 'Write a bio', check: (u: any) => !!u.bio?.trim(), icon: '✍️' },
  { key: 'dob', label: 'Add your birthday', check: (u: any) => !!u.dob, icon: '🎂' },
  { key: 'location', label: 'Add your location', check: (u: any) => !!u.location?.trim(), icon: '📍' },
  { key: 'gender', label: 'Set your gender', check: (u: any) => !!u.gender, icon: '👤' },
  { key: 'interests', label: 'Add interests (3+)', check: (u: any) => (u.interests?.length ?? 0) >= 3, icon: '🎯' },
  { key: 'height', label: 'Add your height', check: (u: any) => !!u.height, icon: '📏' },
  { key: 'education', label: 'Add education', check: (u: any) => !!u.education, icon: '🎓' },
  { key: 'photos', label: 'Add 3+ photos', check: (u: any) => (u.photos?.length ?? 0) >= 3, icon: '🖼️' },
  { key: 'purpose', label: 'Set what you\'re looking for', check: (u: any) => !!u.purpose, icon: '💕' },
];

export const calculateProfileScore = (user: any): number => {
  const done = REQUIRED_FIELDS.filter(f => f.check(user)).length;
  return Math.round((done / REQUIRED_FIELDS.length) * 100);
};

export const ProfileCompletionTips: React.FC<Props> = ({ user, onFieldPress }) => {
  const score = calculateProfileScore(user);
  const missing = REQUIRED_FIELDS.filter(f => !f.check(user));

  if (score === 100) return null;

  const barColor = score < 40 ? '#F44336' : score < 70 ? '#FF9800' : '#4CAF50';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile Strength</Text>
        <Text style={[styles.score, { color: barColor }]}>{score}%</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${score}%` as any, backgroundColor: barColor }]} />
      </View>

      <Text style={styles.subtitle}>Complete these to get more matches:</Text>

      {missing.slice(0, 3).map((field, i) => (
        <TouchableOpacity
          key={i}
          style={styles.tipRow}
          onPress={() => onFieldPress(field.key)}
        >
          <Text style={styles.tipIcon}>{field.icon}</Text>
          <Text style={styles.tipLabel}>{field.label}</Text>
          <Text style={styles.tipArrow}>›</Text>
        </TouchableOpacity>
      ))}

      {missing.length > 3 && (
        <Text style={styles.more}>+{missing.length - 3} more to complete</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16, padding: 16, backgroundColor: '#FFF5F7',
    borderRadius: 16, borderWidth: 1, borderColor: '#FFD6DE',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  score: { fontSize: 18, fontWeight: '800' },
  barBg: { height: 6, backgroundColor: '#FFD6DE', borderRadius: 3, marginBottom: 12 },
  barFill: { height: 6, borderRadius: 3 },
  subtitle: { fontSize: 12, color: '#888', marginBottom: 8 },
  tipRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#FFE8ED',
  },
  tipIcon: { fontSize: 18 },
  tipLabel: { flex: 1, fontSize: 14, color: '#333' },
  tipArrow: { fontSize: 20, color: Colors.primary },
  more: { fontSize: 12, color: '#999', marginTop: 8, textAlign: 'center' },
});
'''
os.makedirs('/data/data/com.termux/files/home/amore-app/components/profile', exist_ok=True)
with open('/data/data/com.termux/files/home/amore-app/components/profile/ProfileCompletionTips.tsx', 'w') as f:
    f.write(tips_component)
print('✅ ProfileCompletionTips.tsx created')

# ── 2. Add to profile.tsx ──
profile_path = '/data/data/com.termux/files/home/amore-app/app/(tabs)/profile.tsx'
with open(profile_path, 'r') as f:
    content = f.read()

# Add import
old_import = "import { Colors } from '../../constants/colors';"
new_import = """import { Colors } from '../../constants/colors';
import { ProfileCompletionTips } from '../../components/profile/ProfileCompletionTips';"""
content = content.replace(old_import, new_import)

# Add tips just after the opening ScrollView in the profile render
# Find the ScrollView that wraps profile content
old_scroll = "  return (\n    <SafeAreaView style={styles.container}>\n      <ScrollView"
new_scroll = """  return (
    <SafeAreaView style={styles.container}>
      <ScrollView"""
# Already same, find where photos section starts to insert tips before it
old_photos = "        {/* Photos */}"
new_photos = """        {/* Profile Completion Tips */}
        {user && (
          <ProfileCompletionTips
            user={user}
            onFieldPress={(field) => {
              if (field === 'photos') {
                // scroll to photos or trigger picker
                Alert.alert('Add Photos', 'Tap the + button in your photos section to add more photos.');
              } else {
                setEditField(field);
              }
            }}
          />
        )}

        {/* Photos */}"""
content = content.replace(old_photos, new_photos)

with open(profile_path, 'w') as f:
    f.write(content)
print('✅ profile.tsx updated with completion tips')

print('\n🎉 Profile completion tips done!')
