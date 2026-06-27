path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(path, 'r') as f:
    content = f.read()

# Fix input row styles
old_styles = """  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  inputIcon: { padding: 4 },"""
new_styles = """  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingVertical: 8, backgroundColor: '#F0F0F0', gap: 6 },
  inputIcon: { padding: 6, marginBottom: 4 },"""
content = content.replace(old_styles, new_styles)

# Fix send button styles
old_send = """  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: Colors.primary },"""
new_send = """  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: Colors.primary },"""
content = content.replace(old_send, new_send)

# Fix TextInput style
old_input = "          style={styles.input}"
new_input = "          style={[styles.input, { minHeight: 42, maxHeight: 120 }]}"
content = content.replace(old_input, new_input)

# Fix input container style in StyleSheet
old_input_style = "  input: {"
# Find and update input style - add it after inputIcon
content = content.replace(
    "  input: {",
    "  input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 21, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: Colors.text, borderWidth: 0, // override below\n  } as any, inputX: {"
)

# Fix the input render section
old_render = """        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.inputIcon} onPress={() => setShowGifts(!showGifts)}>
            <Text>🎁</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { minHeight: 42, maxHeight: 120 }]}
            value={text}
            onChangeText={handleTextChange}
            placeholder="Send a message"
            placeholderTextColor={Colors.textLight}
            multiline
          />

          <TouchableOpacity style={styles.inputIcon} onPress={async () => {"""

new_render = """        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.inputIcon} onPress={() => setShowGifts(!showGifts)}>
            <Text style={{ fontSize: 22 }}>😊</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 12, paddingVertical: 4, minHeight: 44, borderWidth: 0 }}>
            <TextInput
              style={{ flex: 1, fontSize: 15, color: Colors.text, maxHeight: 120, paddingVertical: 8 }}
              value={text}
              onChangeText={handleTextChange}
              placeholder="Type a message"
              placeholderTextColor={Colors.textLight}
              multiline
            />
            <TouchableOpacity style={{ padding: 4, marginBottom: 4 }} onPress={async () => {"""

# Fix closing of image picker button
old_close = """          <TouchableOpacity style={styles.inputIcon} onPress={async () => {"""
new_close = """          <TouchableOpacity style={{ padding: 4, marginBottom: 4 }} onPress={async () => {"""

# Fix send button
old_send_btn = """          <TouchableOpacity
            style={[styles.sendBtn, text.trim() && styles.sendBtnActive]}
            onPress={send}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>"""
new_send_btn = """          </View>
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={send}
          >
            <Text style={{ color: '#fff', fontSize: 18 }}>➤</Text>
          </TouchableOpacity>"""

content = content.replace(old_send_btn, new_send_btn)

with open(path, 'w') as f:
    f.write(content)
print('✅ Chat UI updated to WhatsApp style')
