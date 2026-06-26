path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(path, 'r') as f:
    content = f.read()

# Remove AI reply import
content = content.replace("import { getAIReply, getIcebreakers } from '../../services/aiReply';\n", '')

# Remove translate function that uses Anthropic API
import re
content = re.sub(r'\n  const handleTranslate = async.*?}\n  };\n', '\n', content, flags=re.DOTALL)

# Remove translate button from UI if any
content = content.replace("onPress={() => handleTranslate(item.id, item.text)}", "onPress={() => {}}")

with open(path, 'w') as f:
    f.write(content)
print('✅ AI auto reply removed')
