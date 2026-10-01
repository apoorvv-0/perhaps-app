const fs = require('fs');
let c = fs.readFileSync('src/app/admin/users/page.tsx', 'utf8');
c = c.replace(/else if \(session\.role !== "ADMIN" && session\.role !== "SUPER_ADMIN"\) router\.push\("\/dashboard"\);/, 
  'else if (session.globalRole !== "SUPER_ADMIN") router.push("/dashboard");');
fs.writeFileSync('src/app/admin/users/page.tsx', c);
