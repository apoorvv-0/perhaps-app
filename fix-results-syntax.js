const fs = require('fs');
let c = fs.readFileSync('src/app/results/page.tsx', 'utf8');
c = c.replace(/\\`/g, '`');
c = c.replace(/\\\$/g, '$');
fs.writeFileSync('src/app/results/page.tsx', c);
