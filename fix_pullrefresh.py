path = '/data/data/com.termux/files/home/amore-app/app/(tabs)/swipe.tsx'
with open(path, 'r') as f:
    content = f.read()

# Add RefreshControl to imports
old_import = "  View, Text, StyleSheet, Animated, PanResponder,\n  Image, TouchableOpacity, Dimensions, ActivityIndicator, Modal, ScrollView, Alert"
new_import = "  View, Text, StyleSheet, Animated, PanResponder,\n  Image, TouchableOpacity, Dimensions, ActivityIndicator, Modal, ScrollView, Alert, RefreshControl"
content = content.replace(old_import, new_import)

# Wrap card container with ScrollView + RefreshControl
old_container = "      <View style={styles.cardContainer}>"
new_container = """      <ScrollView
        contentContainerStyle={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setCurrentIndex(0);
              setRefreshing(false);
            }}
            colors={['#FF4B6E']}
            tintColor="#FF4B6E"
          />
        }
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.cardContainer}>"""
content = content.replace(old_container, new_container)

# Close the ScrollView after cardContainer closes
old_close = "      </View>\n\n      {/* Profile Detail Modal */}"
new_close = "      </View>\n      </ScrollView>\n\n      {/* Profile Detail Modal */}"
content = content.replace(old_close, new_close)

with open(path, 'w') as f:
    f.write(content)
print('✅ Pull to refresh added')
