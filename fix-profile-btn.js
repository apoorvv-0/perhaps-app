const fs = require('fs');
let c = fs.readFileSync('src/app/profile/page.tsx', 'utf8');

c = c.replace('const [instagram, setInstagram] = useState("");', 
  'const [instagram, setInstagram] = useState("");\n  const [phase, setPhase] = useState("REGISTRATION");');

c = c.replace('fetch("/api/profile").then(r => r.json())',
  'fetch("/api/event/status").then(r=>r.json()).then(d=>setPhase(d.phase));\n      fetch("/api/profile").then(r => r.json())');

c = c.replace('<div className="mt-20 pt-10 border-t border-brand-burgundy/30">', 
  `{phase === "REGISTRATION" && (
          <div className="mt-20 pt-10 border-t border-brand-burgundy/30">`);

c = c.replace('Permanently Delete Account\n            </button>\n          </div>\n\n        </div>',
  'Permanently Delete Account\n            </button>\n          </div>\n        )}\n\n        </div>');

fs.writeFileSync('src/app/profile/page.tsx', c);
