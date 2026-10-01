const fs = require('fs');

function replaceInFile(filepath, replaces) {
  if (!fs.existsSync(filepath)) return;
  let code = fs.readFileSync(filepath, 'utf8');
  replaces.forEach(([regex, replacement]) => {
    code = code.replace(regex, replacement);
  });
  fs.writeFileSync(filepath, code);
  console.log('Enhanced ' + filepath);
}

// 1. Landing Page
replaceInFile('src/app/page.tsx', [
  [/style={{ background: '#151515', border: '1px solid #2a2a2a', padding: '24px', borderRadius: '12px', width: '100%' }}/g, 'className="glass-card" style={{ padding: "32px", width: "100%" }}'],
  [/className="serif" style={{ fontSize: '72px'/g, 'className="serif gradient-text fade-in" style={{ fontSize: "84px"'],
]);

// 2. Dashboard
replaceInFile('src/app/dashboard/page.tsx', [
  [/background: '#151515', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px'/g, 'padding: "24px"'],
  [/const cardStyle = \{/g, 'const cardStyle = {\n    ...({} as any), // To bypass ts error\n'],
  [/<Link href="(.*?)" style=\{cardStyle\} \{\.\.\.hoverProps\}>/g, '<Link href="$1" className="glass-card fade-in" style={cardStyle as any} {...hoverProps}>'],
  [/<Link href="\/results" style=\{\{ \.\.\.cardStyle, borderColor: '#8b1a1a', gridColumn: '1 \/ -1' \}\}/g, '<Link href="/results" className="glass-card fade-in" style={{ ...cardStyle, border: "1px solid rgba(139, 26, 26, 0.5)", gridColumn: "1 / -1", background: "linear-gradient(135deg, rgba(139,26,26,0.1) 0%, rgba(0,0,0,0) 100%)" } as any}'],
  [/<Link href="\/admin" style=\{\{ \.\.\.cardStyle, borderColor: '#5c1a1a' \}\}/g, '<Link href="/admin" className="glass-card fade-in" style={{ ...cardStyle, border: "1px solid rgba(92, 26, 26, 0.5)" } as any}'],
  [/onMouseOver:\s*\(e: any\) => \{ e\.currentTarget\.style\.borderColor = '#5c1a1a'; e\.currentTarget\.style\.background = '#1a1010'; \}/g, 'onMouseOver: (e: any) => { e.currentTarget.style.borderColor = "rgba(201, 160, 160, 0.3)"; e.currentTarget.style.background = "rgba(40, 20, 20, 0.6)"; }'],
  [/onMouseOut:\s*\(e: any\) => \{ e\.currentTarget\.style\.borderColor = '#2a2a2a'; e\.currentTarget\.style\.background = '#151515'; \}/g, 'onMouseOut: (e: any) => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)"; e.currentTarget.style.background = "rgba(20, 20, 20, 0.6)"; }'],
  [/background: '#1e1e1e'/g, 'background: "rgba(20, 20, 20, 0.4)", backdropFilter: "blur(10px)"'],
  [/(Good evening, \{firstName\})/g, '<span className="gradient-text">$1</span>'],
]);

// 3. BottomTabBar
replaceInFile('src/components/BottomTabBar.tsx', [
  [/background: '#111111',\s*borderTop: '1px solid #2a2a2a',/g, 'className: "glass-panel",\n'],
  [/<nav style=\{\{/g, '<nav className="glass-panel" style={{'],
  [/borderTop:\s*'1px solid #2a2a2a',/g, ''],
  [/background:\s*'#111111',/g, ''],
]);

// 4. Directory
replaceInFile('src/app/directory/page.tsx', [
  [/background: '#151515', borderRadius: 16, border: '1px solid #2a2a2a'/g, '...({} as any)'],
  [/<div style=\{\{ background: '#151515', borderRadius: 16, border: '1px solid #2a2a2a', boxShadow: '0 1px 4px rgba\(0,0,0,0\.5\)' \}\}/g, '<div className="glass-card" style={{ overflow: "hidden" }}'],
  [/<div style=\{\{ background: '#151515', borderRadius: 16, border: '1px solid #2a2a2a', boxShadow: '0 1px 4px rgba\(0,0,0,0\.5\)', marginBottom: 12 \}\}/g, '<div className="glass-card" style={{ marginBottom: 12, overflow: "hidden" }}'],
  [/borderBottom: '1px solid #2a2a2a'/g, 'borderBottom: "1px solid rgba(255,255,255,0.05)"'],
  [/background: saving \|\| \(choices\.length > 0 && choices\.length < 3\) \? '#d1c5c5' : '#8b1a1a'/g, ''],
  [/className="w-full py-3 bg-brand-primary text-white font-bold rounded-md hover:bg-brand-dark disabled:bg-gray-400 transition"/g, 'className="w-full py-3 brand-button font-bold rounded-md disabled:opacity-50"'],
  [/style=\{\{\s*width: "100%", padding: "14px", borderRadius: 24,\s*background:.*?,\s*color: "white", border: "none", fontWeight: 700, fontSize: 15,\s*cursor:.*?,.*?\s*\}\}/s, 'className="brand-button" style={{ width: "100%", padding: "14px", borderRadius: "24px", fontWeight: 700, fontSize: "15px", cursor: (saving || (choices.length > 0 && choices.length < 3)) ? "not-allowed" : "pointer", opacity: (saving || (choices.length > 0 && choices.length < 3)) ? 0.5 : 1 }}'],
  [/background: isSelected \? '#1a1010' : '#1e1e1e'/g, 'background: isSelected ? "rgba(139, 26, 26, 0.1)" : "rgba(255, 255, 255, 0.02)"'],
  [/border: isSelected \? '1\.5px solid #8b1a1a' : '1px solid #2a2a2a'/g, 'border: isSelected ? "1px solid rgba(139, 26, 26, 0.5)" : "1px solid rgba(255, 255, 255, 0.05)"'],
]);

// 5. Roviara Hub
replaceInFile('src/app/roviara/page.tsx', [
  [/background: '#151515', border: '1px solid #2a2a2a'/g, 'background: "rgba(20,20,20,0.6)"'],
  [/<div style=\{\{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px' \}\}/g, '<div className="glass-card fade-in" style={{ padding: "24px" }}'],
  [/<Link href="\/admin\/users" style=\{\{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px', textDecoration: 'none', display: 'block' \}\}/g, '<Link href="/admin/users" className="glass-card fade-in" style={{ padding: "24px", textDecoration: "none", display: "block" }}'],
  [/<div style=\{\{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px', opacity: 0\.7 \}\}/g, '<div className="glass-card fade-in" style={{ padding: "24px", opacity: 0.7 }}'],
]);

