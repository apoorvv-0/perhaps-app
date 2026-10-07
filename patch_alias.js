const fs = require('fs');
let c = fs.readFileSync('src/app/api/directory/route.ts', 'utf8');

const target = 'hasDuplicateName: (nameCounts.get(`${p.firstName.toLowerCase()}|${p.lastName.toLowerCase()}`) ?? 0) > 1,';
const replacement = 'alias: (nameCounts.get(`${p.firstName.toLowerCase()}|${p.lastName.toLowerCase()}`) ?? 0) > 1 ? (aliasMap.get(p.college || "") || p.college) : undefined,';

c = c.replace(target, replacement);
fs.writeFileSync('src/app/api/directory/route.ts', c);
