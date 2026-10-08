
const fs = require("fs");
let c = fs.readFileSync("src/app/admin/page.tsx", "utf8");

const oldFetchQueue = `  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/admin/verification-queue");
      const data = await res.json();
      if (res.ok) setQueue(data.queue || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };`;

const newFetchQueue = `  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/admin/verification-queue");
      if (!res.ok) throw new Error("Failed to load queue");
      const data = await res.json();
      setQueue(data.queue || []);
      setFetchError(null);
    } catch (e) {
      setFetchError(e.message);
    } finally {
      setLoading(false);
    }
  };`;

c = c.replace(oldFetchQueue, newFetchQueue);

const oldLoading = `if (loading) return <div className="mt-8 text-center text-brand-taupe">Loading queue...</div>;`;
const newLoading = `if (loading) return <div className="mt-8 text-center text-brand-taupe">Loading queue...</div>;
  if (fetchError) return <div className="mt-8 text-center text-red-400">Error: {fetchError}</div>;`;

c = c.replace(oldLoading, newLoading);

fs.writeFileSync("src/app/admin/page.tsx", c);

