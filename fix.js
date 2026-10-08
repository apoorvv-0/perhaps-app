const fs = require('fs');
let content = fs.readFileSync('src/app/verify-id/page.tsx', 'utf8');

content = content.replace('const [phone, setPhone] = useState("+91");', 'const [phone, setPhone] = useState((session)?.phone || "+91");\n\n  useEffect(() => {\n    if ((session)?.phone && phone === "+91") setPhone((session).phone);\n  }, [session]);');

content = content.replace('5000', '10000');
content = content.replace('The Oracle is manually reviewing your College ID. Check back in a little while!', 'The Oracle is manually reviewing your College ID. Verification usually takes about 1 hour. You can close this page and come back later!');

const oldUnder = \        <button onClick={logout} className="text-brand-taupe/50 hover:text-brand-blush text-xs transition-colors mb-4">
          Log out / Switch Account
        </button>
        <button
          onClick={async () => {
            if (confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) {
              try {
                await fetch("/api/profile", { method: "DELETE" });
                await logout();
              } catch (e) {
                alert("Failed to delete account");
              }
            }
          }}
          className="text-red-500/50 hover:text-red-400 text-xs underline transition-colors"
        >
          Permanently Delete Account
        </button>\;

const newUnder = \        <div className="flex flex-col gap-4 w-full mt-4">
          <button onClick={logout} className="w-full py-4 bg-brand-charcoal border border-brand-taupe/20 rounded-xl text-brand-taupe hover:text-brand-blush transition-colors font-medium">
            Log out / Switch Account
          </button>
          <button
            onClick={async () => {
              if (prompt("Type 'delete' to permanently delete your account:") === 'delete') {
                try {
                  await fetch("/api/profile", { method: "DELETE" });
                  await logout();
                } catch (e) {
                  alert("Failed to delete account");
                }
              }
            }}
            className="w-full py-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-500 hover:bg-red-900/50 hover:text-red-300 transition-colors font-medium"
          >
            Permanently Delete Account
          </button>
        </div>\;

content = content.replace(oldUnder, newUnder);

const oldUpload = \        <div className="mt-8 text-center flex flex-col gap-4">
          <button onClick={logout} className="text-brand-taupe/50 hover:text-brand-blush text-xs transition-colors">
            Log out / Switch Account
          </button>
          <button
            onClick={async () => {
              if (confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) {
                try {
                  await fetch("/api/profile", { method: "DELETE" });
                  await logout();
                } catch (e) {
                  alert("Failed to delete account");
                }
              }
            }}
            className="text-red-500/50 hover:text-red-400 text-xs underline transition-colors"
          >
            Permanently Delete Account
          </button>
        </div>\;

const newUpload = \        <div className="mt-8 text-center flex flex-col gap-4 w-full">
          <button onClick={logout} className="w-full py-4 bg-[#111] border border-brand-taupe/10 rounded-xl text-brand-taupe hover:text-brand-blush transition-colors font-medium">
            Log out / Switch Account
          </button>
          <button
            onClick={async () => {
              if (prompt("Type 'delete' to permanently delete your account:") === 'delete') {
                try {
                  await fetch("/api/profile", { method: "DELETE" });
                  await logout();
                } catch (e) {
                  alert("Failed to delete account");
                }
              }
            }}
            className="w-full py-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-500 hover:bg-red-900/50 hover:text-red-300 transition-colors font-medium"
          >
            Permanently Delete Account
          </button>
        </div>\;

content = content.replace(oldUpload, newUpload);

fs.writeFileSync('src/app/verify-id/page.tsx', content);
