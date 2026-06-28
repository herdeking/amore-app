path = '/data/data/com.termux/files/home/amore-app/app/(tabs)/matches.tsx'
with open(path, 'r') as f:
    content = f.read()

# Check what's imported
if 'onSnapshot' not in content:
    content = content.replace(
        "import { collection, query, where, getDocs,",
        "import { collection, query, where, getDocs, onSnapshot,"
    )
    print('✅ Added onSnapshot import')

# Replace loadMatches with real-time listener
old_load = """  const loadMatches = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const m = await fetchMatches(user.id);
    setRealMatches(m);
    setLoading(false);
  }, [user?.id]);"""

new_load = """  const loadMatches = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const m = await fetchMatches(user.id);
    setRealMatches(m);
    setLoading(false);
  }, [user?.id]);

  // Real-time listener for new messages
  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, 'matches'),
      where('users', 'array-contains', user.id)
    );
    const unsub = onSnapshot(q, async () => {
      const m = await fetchMatches(user.id);
      setRealMatches(m);
    });
    return () => unsub();
  }, [user?.id]);"""

content = content.replace(old_load, new_load)

with open(path, 'w') as f:
    f.write(content)
print('✅ Real-time matches listener added')
