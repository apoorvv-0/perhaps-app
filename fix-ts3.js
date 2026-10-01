const fs = require('fs');
let m = fs.readFileSync('src/lib/matching/matching-handlers.ts', 'utf8');
m = m.replace(/hasEventRole\(session,\s*["']SUPER_ADMIN["']\)/g, '(session.globalRole === "SUPER_ADMIN")');
m = m.replace(/import \{ getSession, hasEventRole \} from/g, 'import { getSession } from');
fs.writeFileSync('src/lib/matching/matching-handlers.ts', m);
