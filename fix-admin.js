const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const regex = /const fetchQueue = async \(\) => \{[\s\S]*?setLoading\(false\);\s*\}\s*\};/;
const replacement = \const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/admin/verification-queue");
      if (!res.ok) throw new Error("Failed to load queue");
      const data = await res.json();
      setQueue(data.queue || []);
      setFetchError(null);
    } catch (e: any) {
      setFetchError(e.message);
    } finally {
      setLoading(false);
    }
  };\;

content = content.replace(regex, replacement);
fs.writeFileSync('src/app/admin/page.tsx', content);
