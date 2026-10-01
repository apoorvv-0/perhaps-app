const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const insertion = `
          {/* Leaderboard card */}
          {phase !== 'DRAFT' && phase !== 'REGISTRATION_OPEN' && phase !== 'REGISTRATION_CLOSED' && phase !== 'CHOOSING_OPEN' && (
            <Link href="/leaderboard"
              className="flex flex-col p-6 bg-gradient-to-br from-brand-dark to-brand-primary rounded-xl shadow-lg text-white hover:shadow-xl transition-shadow">
              <span className="text-2xl mb-2">👑</span>
              <h3 className="font-bold">The Leaderboard</h3>
              <p className="text-sm opacity-90 mt-1">Discover the most wanted of the season</p>
            </Link>
          )}

          {/* Directory card */`;

c = c.replace(/{\/\* Directory card \*\//, insertion);
fs.writeFileSync('src/app/dashboard/page.tsx', c);
console.log('done');
