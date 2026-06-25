path = '/data/data/com.termux/files/home/amore-app/app/settings.tsx'
with open(path, 'r') as f:
    content = f.read()

# Remove dark mode switch row
old = """            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Dark mode 🌙</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={isDark ? '#fff' : '#fff'}
              />
            </View>
"""
content = content.replace(old, '')

with open(path, 'w') as f:
    f.write(content)
print('✅ Dark mode toggle removed from settings')
