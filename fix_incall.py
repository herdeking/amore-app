path = '/data/data/com.termux/files/home/amore-app/app/call/[id].tsx'
with open(path, 'r') as f:
    content = f.read()

# Remove import
content = content.replace('import InCallManager from "react-native-incall-manager";\n', '')

# Replace all InCallManager calls with no-ops
import re
content = re.sub(r'InCallManager\.[^;]+;', '// audio managed by WebRTC', content)

with open(path, 'w') as f:
    f.write(content)
print('✅ InCallManager removed from call screen')
