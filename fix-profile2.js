const fs = require('fs');
let c = fs.readFileSync('src/app/api/profile/route.ts', 'utf8');
c = c.replace(/    \/\/[\r\n ]+\}\);/, '');
fs.writeFileSync('src/app/api/profile/route.ts', c);
