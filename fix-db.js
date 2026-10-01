const fs = require('fs');
let s = fs.readFileSync('prisma/schema.prisma', 'utf8');
s = s.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
fs.writeFileSync('prisma/schema.prisma', s);
