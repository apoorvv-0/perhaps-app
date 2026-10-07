const fs = require('fs');
let c = fs.readFileSync('src/app/api/directory/route.ts', 'utf8');
c = c.replace(/hasDuplicateName: \([^)]+\) > 1,/, 'alias: (nameCounts.get(`${p.firstName.toLowerCase()}|${p.lastName.toLowerCase()}`) ?? 0) > 1 ? (aliasMap.get(p.college || "") || p.college) : undefined,');
fs.writeFileSync('src/app/api/directory/route.ts', c);
