const fs = require('fs');
let c = fs.readFileSync('src/app/api/profile/route.ts', 'utf8');

c = c.replace(/if \(user\?\.roviaraId\) \{[\s\S]*?\.catch\(e => console\.error\("Roviara delete failed", e\)\);\r?\n    \}/, '');

fs.writeFileSync('src/app/api/profile/route.ts', c);
