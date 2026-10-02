const fs = require('fs');

// H-8 to H-12, M-24, M-25: src/app/cashier/page.tsx
let cashier = fs.readFileSync('src/app/cashier/page.tsx', 'utf8');
cashier = cashier.replace(/bg-#151515/g, "bg-[#151515]");
cashier = cashier.replace(/text-#151515/g, "text-[#151515]");
cashier = cashier.replace(/#151515space-nowrap/g, "whitespace-nowrap");
cashier = cashier.replace(/text-gray-700/g, "text-[#7a6b6b]");
cashier = cashier.replace(/text-gray-600/g, "text-[#7a6b6b]");
cashier = cashier.replace(/text-\[\#151515\]/g, "text-[#f5f0ee]"); // for buttons
cashier = cashier.replace(/buyerPhone:\s*string\s*\|\s*null/g, "buyerPhone: string");
cashier = cashier.replace(/['"]ACTIVE['"]/g, "'ISSUED'");
cashier = cashier.replace(/status\s*===\s*['"]ACTIVE['"]/g, "status === 'ISSUED'");
cashier = cashier.replace(/<div className="min-h-screen bg-gray-50 flex items-center justify-center">/g, `<div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#f5f0ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>`);
fs.writeFileSync('src/app/cashier/page.tsx', cashier);
console.log('Done cashier');

// M-1, M-2, M-3, L-1: src/app/page.tsx
let page = fs.readFileSync('src/app/page.tsx', 'utf8');
page = page.replace(/if\s*\(isLoading\s*\|\|\s*session\)\s*return\s*null;/g, `if (isLoading || session) return <div style={{ minHeight: '100vh', background: '#0d0d0d' }} />;`);
page = page.replace(/You must agree to the DPDP compliance terms to create a Roviara ID\./g, "You must accept the terms above to continue registering for the event.");
page = page.replace(/pointerEvents:\s*['"]none['"]/g, "pointerEvents: 'none', tabIndex: -1, 'aria-disabled': 'true'");
if (!page.includes('const [devLoading, setDevLoading] = useState(false);')) {
  page = page.replace(/export default function Home\(\)\s*\{/, "export default function Home() {\n  const [devLoading, setDevLoading] = React.useState(false);");
}
fs.writeFileSync('src/app/page.tsx', page);
console.log('Done M-1,2,3, L-1');

// M-4, M-5, M-6: src/app/dashboard/page.tsx
let dashboard = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
dashboard = dashboard.replace(/Good evening/g, `{(() => { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'; })()}`);
dashboard = dashboard.replace(/\.\.\.\(\{\}\s*as\s*any\)/g, "");
dashboard = dashboard.replace(/setPhase\(['"]Loading\.\.\.['"]\)/g, "setPhase('UNKNOWN')");
dashboard = dashboard.replace(/Event status unavailable/g, "Event status unavailable"); // handled by previous if needed
fs.writeFileSync('src/app/dashboard/page.tsx', dashboard);
console.log('Done M-4,5,6');

// M-11: src/app/roviara/login/page.tsx
let roviaraLogin = fs.readFileSync('src/app/roviara/login/page.tsx', 'utf8');
if (!roviaraLogin.includes('Go to Dashboard')) {
  roviaraLogin = roviaraLogin.replace(/\{error\s*&&\s*<p[^>]*>\{error\}<\/p>\}/, `{error && <><p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p><button onClick={() => router.push('/dashboard')} style={{ marginTop: 16, color: '#7a6b6b', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>&larr; Go to Dashboard</button></>}`);
}
fs.writeFileSync('src/app/roviara/login/page.tsx', roviaraLogin);
console.log('Done M-11');

// M-12, M-13: src/app/roviara/page.tsx
let roviara = fs.readFileSync('src/app/roviara/page.tsx', 'utf8');
if (!roviara.includes('statsLoaded')) {
  roviara = roviara.replace(/const\s*\[stats,\s*setStats\]\s*=\s*useState<any>\(null\);/, "const [stats, setStats] = useState<any>(null);\n  const [statsLoaded, setStatsLoaded] = useState(false);");
  roviara = roviara.replace(/setStats\(data\);/, "setStats(data); setStatsLoaded(true);");
  roviara = roviara.replace(/setStats\(null\);/, "setStats(null); setStatsLoaded(true);");
}
roviara = roviara.replace(/<button[^>]*disabled[^>]*>[\s\S]*?Create New Event[\s\S]*?<\/button>/, `<button onClick={() => router.push('/admin')} style={{ background: '#8b1a1a', color: '#f5f0ee', padding: '12px 24px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Manage Events</button>`);
fs.writeFileSync('src/app/roviara/page.tsx', roviara);
console.log('Done M-12,13');

// M-14, L-7: src/app/admin/page.tsx
let admin = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
admin = admin.replace(/ROLLBACK_PHASES\.includes\(nextPhase\)/g, "PHASE_ORDER.indexOf(nextPhase) < PHASE_ORDER.indexOf(currentPhase)");
admin = admin.replace(/m\.userA_id\?\.substring\(0,8\)\s*\?\?\s*m\.user1Id\?\.substring\(0,8\)/g, "m.user1Id?.substring(0,8)");
admin = admin.replace(/m\.userB_id\?\.substring\(0,8\)\s*\?\?\s*m\.user2Id\?\.substring\(0,8\)/g, "m.user2Id?.substring(0,8)");
admin = admin.replace(/m\.score\s*\?\?\s*m\.matchStrength/g, "m.matchStrength");
fs.writeFileSync('src/app/admin/page.tsx', admin);
console.log('Done admin');

// M-16, L-8: src/app/results/page.tsx
let results = fs.readFileSync('src/app/results/page.tsx', 'utf8');
results = results.replace(/type\s*MatchStatus\s*=\s*\{\s*state:\s*'loading'\s*\|\s*'not-found'\s*\|\s*'found'\s*;/g, "type MatchStatus = { state: 'loading' | 'not-found' | 'found' | 'error';");
results = results.replace(/color:\s*["']#3d3030["']/g, 'color: "#7a6b6b"');
results = results.replace(/catch\s*\(\w+\)\s*\{\s*setMatchStatus\(\{ state: 'not-found' \}\);\s*\}/, "catch (e) { setMatchStatus({ state: 'error' }); }");
fs.writeFileSync('src/app/results/page.tsx', results);
console.log('Done results');

// M-18: src/components/BottomTabBar.tsx
let bottomBar = fs.readFileSync('src/components/BottomTabBar.tsx', 'utf8');
bottomBar = bottomBar.replace(/const isActive = pathname\.startsWith\(tab\.path\);/g, "const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/');");
fs.writeFileSync('src/components/BottomTabBar.tsx', bottomBar);
console.log('Done M-18');

// M-20, M-21, L-12: src/app/profile/page.tsx
let profile = fs.readFileSync('src/app/profile/page.tsx', 'utf8');
profile = profile.replace(/const\s*\[initialFetchDone,\s*setInitialFetchDone\]\s*=\s*useState\(false\);/, "const initialFetchDoneRef = useRef<boolean>(false);");
profile = profile.replace(/setInitialFetchDone\(true\);/g, "initialFetchDoneRef.current = true;");
profile = profile.replace(/if\s*\(initialFetchDone\)/g, "if (initialFetchDoneRef.current)");
profile = profile.replace(/e\.target\.value\.replace\(\/\^@\/,\s*''\)/g, "e.target.value.replace(/^@+/, '')");
if (!profile.includes('Delete Account')) {
  profile = profile.replace(/<\/form>/, `</form>
<div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #2a2a2a' }}>
  <p style={{ color: '#7a6b6b', fontSize: 13, marginBottom: 12 }}>Data & Privacy</p>
  <button 
    onClick={() => {
      if (confirm('This will permanently delete your account and all data. This cannot be undone.')) {
        fetch('/api/profile', { method: 'DELETE' }).then(() => { window.location.href = '/'; });
      }
    }}
    style={{ background: 'none', border: '1px solid #3d1515', color: '#7a6b6b', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}
  >
    Delete Account
  </button>
</div>`);
}
fs.writeFileSync('src/app/profile/page.tsx', profile);
console.log('Done M-20,21, L-12');

// M-22, L-12: src/app/api/profile/route.ts
let apiProfile = fs.readFileSync('src/app/api/profile/route.ts', 'utf8');
if (!apiProfile.includes('export async function DELETE')) {
  apiProfile += `\nexport async function DELETE(req: NextRequest) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const session = await verifyToken(sessionToken);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  
  await prisma.profile.deleteMany({ where: { userId: session.userId } });
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      phoneNumber: \`deleted:\${session.userId}\`,
      googleId: \`deleted:\${session.userId}\`,
      status: 'SUSPENDED'
    }
  });
  
  return NextResponse.json({ success: true });
}\n`;
}
fs.writeFileSync('src/app/api/profile/route.ts', apiProfile);
console.log('Done M-22, L-12');

// L-3: src/lib/auth/session-core.ts
let sessionCore = fs.readFileSync('src/lib/auth/session-core.ts', 'utf8');
if (!sessionCore.includes('JWT_SECRET environment variable must be set')) {
  sessionCore = sessionCore.replace(/const\s*SECRET\s*=\s*new TextEncoder\(\)\.encode\(process\.env\.JWT_SECRET\s*\|\|\s*['"]fallback-secret-for-dev['"]\);/, `const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-dev');
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set in production.');
}`);
}
fs.writeFileSync('src/lib/auth/session-core.ts', sessionCore);
console.log('Done L-3');

// L-4, L-5: src/app/directory/page.tsx
let dirPage = fs.readFileSync('src/app/directory/page.tsx', 'utf8');
dirPage = dirPage.replace(/const\s*\[eventPhase,\s*setEventPhase\]\s*=\s*useState\(["']["']\);/, "const [eventPhase, setEventPhase] = useState<string | null>(null);");
dirPage = dirPage.replace(/if\s*\(eventPhase\s*!==\s*['"]CHOOSING_OPEN['"]\)/g, "if (eventPhase !== null && eventPhase !== 'CHOOSING_OPEN' && eventPhase !== 'CHOOSING_CLOSED')");
fs.writeFileSync('src/app/directory/page.tsx', dirPage);
console.log('Done L-4,5');

