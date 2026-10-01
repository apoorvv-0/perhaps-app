const fs = require('fs');

let c = fs.readFileSync('src/app/results/page.tsx', 'utf8');
c = c.replace(/paddingBottom:\s*["']80px["'],\s*background:\s*['"]#0d0d0d['"],\s*paddingBottom:\s*80/g, "paddingBottom: '80px', background: '#0d0d0d'");
fs.writeFileSync('src/app/results/page.tsx', c);

let m = fs.readFileSync('src/lib/matching/matching-handlers.ts', 'utf8');
m = m.replace(/hasEventRole\(session\.userId,\s*["']ADMIN["']\)/g, "hasEventRole(session.userId, event.id, 'ADMIN')");
fs.writeFileSync('src/lib/matching/matching-handlers.ts', m);
