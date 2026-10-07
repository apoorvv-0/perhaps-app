const fs = require('fs');
let c = fs.readFileSync('src/app/cashier/page.tsx', 'utf8');
c = c.replace(/\\`/g, '`');
c = c.replace(/\\\$/g, '$');
fs.writeFileSync('src/app/cashier/page.tsx', c);
