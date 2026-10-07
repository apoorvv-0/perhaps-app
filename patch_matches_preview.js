const fs = require('fs');
let c = fs.readFileSync('src/app/admin/matches/page.tsx', 'utf8');

c = c.replace('const [matches, setMatches] = useState<any[]>([]);', `const [matches, setMatches] = useState<any[]>([]);\n  const [previewMatches, setPreviewMatches] = useState<any[] | null>(null);\n  const [loadingPreview, setLoadingPreview] = useState(false);`);

const previewFn = `
  const fetchPreview = async () => {
    try {
      setLoadingPreview(true);
      const res = await fetch('/api/admin/matching/dry-run', { method: 'POST' });
      const data = await res.json();
      if (data.matches) setPreviewMatches(data.matches);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPreview(false);
    }
  };
`;

c = c.replace('const fetchMatches = async () => {', previewFn + '\n  const fetchMatches = async () => {');

const emptyState = `          {matches.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <p className="text-brand-taupe mb-4">No committed matches found.</p>
              {previewMatches ? (
                <div className="w-full text-left">
                  <h3 className="text-brand-rose font-bold mb-4 text-center">PREVIEW (DRY RUN) MATCHES ({previewMatches.length})</h3>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-brand-burgundy/50 text-brand-blush/40 text-xs uppercase tracking-wider font-bold">
                        <th className="p-4">User 1</th>
                        <th className="p-4">User 2</th>
                        <th className="p-4">Match Strength</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {previewMatches.map((m, i) => (
                        <tr key={i} className="border-b border-brand-burgundy/20 hover:bg-white/5 transition opacity-70">
                          <td className="p-4">
                            <div className="font-medium text-brand-blush">{m.user1.firstName} {m.user1.lastName}</div>
                            <div className="text-xs text-brand-taupe mt-1">{m.user1.college}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-brand-blush">{m.user2.firstName} {m.user2.lastName}</div>
                            <div className="text-xs text-brand-taupe mt-1">{m.user2.college}</div>
                          </td>
                          <td className="p-4 font-bold">{m.matchStrength}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <button onClick={fetchPreview} disabled={loadingPreview} className="px-6 py-2 rounded-full bg-brand-wine border border-brand-burgundy text-brand-rose hover:bg-white/5 transition">
                  {loadingPreview ? "Running Algorithm..." : "Preview Algorithm Results"}
                </button>
              )}
            </div>
          ) : (`;

c = c.replace(`          {matches.length === 0 ? (\n            <p className="text-center text-brand-taupe p-12">No matches generated yet. Run the matching engine first.</p>\n          ) : (`, emptyState);

fs.writeFileSync('src/app/admin/matches/page.tsx', c);
