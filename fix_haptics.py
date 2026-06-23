path = '/data/data/com.termux/files/home/amore-app/app/(tabs)/swipe.tsx'
with open(path, 'r') as f:
    content = f.read()

old = """  const handleSwipe = (action: 'like' | 'pass' | 'superlike') => {
    const target = profiles[currentIndex];
    if (!target) return;
    const x = action === 'pass' ? -SW * 1.5 : SW * 1.5;
    Animated.timing(position, { toValue: { x, y: 0 }, duration: 300, useNativeDriver: false }).start(() => {
      swipe(target.id, action);
      setCurrentIndex(i => i + 1);
      setPhotoIndex(0);
      position.setValue({ x: 0, y: 0 });
    });
  };"""

new = """  const handleSwipe = (action: 'like' | 'pass' | 'superlike') => {
    const target = profiles[currentIndex];
    if (!target) return;

    // Haptic feedback
    if (action === 'like') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (action === 'superlike') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const x = action === 'pass' ? -SW * 1.5 : SW * 1.5;
    Animated.timing(position, { toValue: { x, y: 0 }, duration: 300, useNativeDriver: false }).start(() => {
      swipe(target.id, action);
      setCurrentIndex(i => i + 1);
      setPhotoIndex(0);
      position.setValue({ x: 0, y: 0 });
    });
  };"""

content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)
print('✅ Haptic feedback added')
