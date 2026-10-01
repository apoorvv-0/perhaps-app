const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

c = c.replace(/const isAdmin = session\.role === "ADMIN" \|\| session\.role === "SUPER_ADMIN";/, 'const isAdmin = session.globalRole === "SUPER_ADMIN";');
c = c.replace(/const isCashier = session\.role === "CASHIER" \|\| isAdmin;/, 'const isCashier = isAdmin;');
c = c.replace(/session\.role === "CASHIER"/, 'isCashier');

// Add SuperAdmin link
const superAdminLink = `
          {session.globalRole === "SUPER_ADMIN" && (
            <Link href="/superadmin"
              className="flex flex-col p-6 bg-white rounded-xl shadow border border-yellow-100 hover:shadow-md hover:border-yellow-300 transition-shadow">
              <span className="text-2xl mb-2">🌍</span>
              <h3 className="font-semibold text-gray-900">Roviara Hub</h3>
              <p className="text-sm text-gray-500 mt-1">Manage global events</p>
            </Link>
          )}
`;
c = c.replace(/\{\/\* Cashier Panel card \*\/\}/, superAdminLink + '\n\n          {/* Cashier Panel card */}');

fs.writeFileSync('src/app/dashboard/page.tsx', c);
