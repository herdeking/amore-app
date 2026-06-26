import re

# Fix 1: Call history - remove orderBy to avoid index requirement
path = '/data/data/com.termux/files/home/amore-app/app/(tabs)/matches.tsx'
with open(path, 'r') as f:
    content = f.read()

old = """      const q = query(
        collection(db, 'callHistory'),
        where('participants', 'array-contains', user.id),
        orderBy('startedAt', 'desc'),
        limit(30)
      );"""
new = """      const q = query(
        collection(db, 'callHistory'),
        where('participants', 'array-contains', user.id),
        limit(30)
      );"""
content = content.replace(old, new)

old_set = "      setCallHistory(calls);"
new_set = """      calls.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setCallHistory(calls);"""
content = content.replace(old_set, new_set)

with open(path, 'w') as f:
    f.write(content)
print('✅ Call history query fixed')

# Fix 2: Add speaker button to video call
call_path = '/data/data/com.termux/files/home/amore-app/app/call/[id].tsx'
with open(call_path, 'r') as f:
    call = f.read()

if 'speakerOn' not in call:
    old_state = "  const [callDuration, setCallDuration] = React.useState(0);"
    new_state = """  const [callDuration, setCallDuration] = React.useState(0);
  const [speakerOn, setSpeakerOn] = React.useState(false);"""
    call = call.replace(old_state, new_state)

    old_btn = """          <TouchableOpacity style={styles.controlBtn} onPress={handleFlipCamera}>
            <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
            <Text style={styles.controlLabel}>Flip</Text>
          </TouchableOpacity>"""
    new_btn = """          <TouchableOpacity style={styles.controlBtn} onPress={handleFlipCamera}>
            <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
            <Text style={styles.controlLabel}>Flip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => setSpeakerOn(s => !s)}>
            <Ionicons name={speakerOn ? "volume-high-outline" : "volume-low-outline"} size={28} color="#fff" />
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>"""
    call = call.replace(old_btn, new_btn)

    with open(call_path, 'w') as f:
        f.write(call)
    print('✅ Speaker button added to video call')
else:
    print('ℹ️ Speaker already exists')
