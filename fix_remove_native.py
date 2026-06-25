import os, re

# Fix swipe.tsx - remove haptics
path = '/data/data/com.termux/files/home/amore-app/app/(tabs)/swipe.tsx'
with open(path, 'r') as f:
    content = f.read()
content = content.replace("import * as Haptics from 'expo-haptics';\n", '')
content = content.replace("      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);\n", '')
content = content.replace("      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);\n", '')
content = content.replace("      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);\n", '')
with open(path, 'w') as f:
    f.write(content)
print('✅ Haptics removed from swipe.tsx')

# Fix profile.tsx - remove haptics
path2 = '/data/data/com.termux/files/home/amore-app/app/(tabs)/profile.tsx'
with open(path2, 'r') as f:
    content2 = f.read()
content2 = content2.replace("import * as Haptics from 'expo-haptics';\n", '')
with open(path2, 'w') as f:
    f.write(content2)
print('✅ Haptics removed from profile.tsx')

# Remove VoiceMessagePlayer and VoiceRecordButton components
os.remove('/data/data/com.termux/files/home/amore-app/components/chat/VoiceMessagePlayer.tsx')
os.remove('/data/data/com.termux/files/home/amore-app/components/chat/VoiceRecordButton.tsx')
print('✅ Voice components removed')

# Fix chat/[id].tsx - remove voice message imports and handler
path3 = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(path3, 'r') as f:
    content3 = f.read()
content3 = content3.replace("import { VoiceRecordButton } from '../../components/chat/VoiceRecordButton';\n", '')
content3 = content3.replace("import { VoiceMessagePlayer } from '../../components/chat/VoiceMessagePlayer';\n", '')

# Remove handleVoiceMessage function
content3 = re.sub(r'\n  const handleVoiceMessage = async.*?};\n', '\n', content3, flags=re.DOTALL)

# Remove VoiceRecordButton from render
content3 = content3.replace('          <VoiceRecordButton onRecordingComplete={handleVoiceMessage} />\n', '')

# Remove voice message player render
old_voice = """                    // Voice message
                    const voiceMatch = item.text.match(/🎤 \\[Voice\\]\\((https?:\\/\\/[^)]+)\\)\\|(\\d+)/);
                    if (voiceMatch) {
                      return (
                        <VoiceMessagePlayer
                          uri={voiceMatch[1]}
                          isMine={isMine(item.senderId)}
                          duration={parseInt(voiceMatch[2])}
                        />
                      );
                    }
"""
content3 = content3.replace(old_voice, '')

with open(path3, 'w') as f:
    f.write(content3)
print('✅ Voice messages removed from chat')

# Remove expo-av from app.json plugins
import json
with open('/data/data/com.termux/files/home/amore-app/app.json', 'r') as f:
    d = json.load(f)
plugins = d['expo']['plugins']
plugins = [p for p in plugins if not (isinstance(p, list) and p[0] == 'expo-av')]
d['expo']['plugins'] = plugins
with open('/data/data/com.termux/files/home/amore-app/app.json', 'w') as f:
    json.dump(d, f, indent=2)
print('✅ expo-av removed from app.json plugins')

print('\n🎉 All native-crashing packages removed!')
