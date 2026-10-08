
const fs = require("fs");
let c = fs.readFileSync("src/app/admin/page.tsx", "utf8");
c = c.replace(/if \(fetchError\).*?\n/g, "");
c = c.replace("  const [loading, setLoading] = useState(true);", "  const [loading, setLoading] = useState(true);\n  const [fetchError, setFetchError] = useState<string | null>(null);");
c = c.replace("  if (loading) return <div className=\"mt-8 text-center text-brand-taupe\">Loading queue...</div>;", "  if (loading) return <div className=\"mt-8 text-center text-brand-taupe\">Loading queue...</div>;\n  if (fetchError) return <div className=\"mt-8 text-center text-red-400\">Error: {fetchError}</div>;");
fs.writeFileSync("src/app/admin/page.tsx", c);

