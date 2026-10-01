const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
c = c.replace(/else if \(session\.role !== "ADMIN" && session\.role !== "SUPER_ADMIN"\) router\.push\("\/dashboard"\);/, 
  'else if (session.globalRole !== "SUPER_ADMIN") router.push("/dashboard"); // TODO check EventRole');
fs.writeFileSync('src/app/admin/page.tsx', c);

let d = fs.readFileSync('src/app/cashier/page.tsx', 'utf8');
d = d.replace(/else if \(session\.role !== "CASHIER" && session\.role !== "ADMIN" && session\.role !== "SUPER_ADMIN"\) router\.push\("\/dashboard"\);/, 
  'else if (session.globalRole !== "SUPER_ADMIN") router.push("/dashboard"); // TODO check EventRole');
fs.writeFileSync('src/app/cashier/page.tsx', d);
