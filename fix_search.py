path = '/data/data/com.termux/files/home/amore-app/app/search.tsx'
with open(path, 'r') as f:
    content = f.read()

old = """  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('name'),
        startAt(searchText.trim()),
        endAt(searchText.trim() + '')
      );
      const snap = await getDocs(q);
      const users = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) => u.id !== user?.id);
      setResults(users);
    } catch (e) {
      console.log('Search error:', e);
    } finally {
      setLoading(false);
    }
  };"""

new = """  const handleSearch = async () => {
    const term = searchText.trim();
    if (!term) return;
    setLoading(true);
    setSearched(true);
    try {
      let users: any[] = [];

      // Search by ID (exact match)
      if (term.length >= 15) {
        const { getDoc, doc: fsDoc } = await import('firebase/firestore');
        const snap = await getDoc(fsDoc(db, 'users', term));
        if (snap.exists() && snap.id !== user?.id) {
          users = [{ id: snap.id, ...snap.data() }];
        }
      }

      // Search by name (prefix match)
      if (users.length === 0) {
        const nameLower = term.toLowerCase();
        const q = query(
          collection(db, 'users'),
          orderBy('nameLower'),
          startAt(nameLower),
          endAt(nameLower + '\uf8ff')
        );
        const snap = await getDocs(q);
        users = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((u: any) => u.id !== user?.id);

        // Fallback: also try original case
        if (users.length === 0) {
          const q2 = query(
            collection(db, 'users'),
            orderBy('name'),
            startAt(term),
            endAt(term + '\uf8ff')
          );
          const snap2 = await getDocs(q2);
          users = snap2.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((u: any) => u.id !== user?.id);
        }
      }

      setResults(users);
    } catch (e) {
      console.log('Search error:', e);
    } finally {
      setLoading(false);
    }
  };"""

content = content.replace(old, new)

# Update placeholder text to mention ID search
content = content.replace(
    'placeholder="Search by name..."',
    'placeholder="Search by name or user ID..."'
)

with open(path, 'w') as f:
    f.write(content)
print('✅ search.tsx updated')
