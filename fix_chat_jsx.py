path = '/data/data/com.termux/files/home/amore-app/app/chat/[id].tsx'
with open(path, 'r') as f:
    content = f.read()

old = """            <Text>📷</Text>
          </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={send}
          >
            <Text style={{ color: '#fff', fontSize: 18 }}>➤</Text>
          </TouchableOpacity>
        </View>"""

new = """            <Text>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={send}
          >
            <Text style={{ color: '#fff', fontSize: 18 }}>➤</Text>
          </TouchableOpacity>
        </View>"""

content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)
print('✅ JSX fixed')
