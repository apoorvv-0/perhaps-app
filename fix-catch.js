const fs = require('fs');
let c = fs.readFileSync('src/app/results/page.tsx', 'utf8');
c = c.replace(/catch \(err: any\) \{\s*console\.error\(err\);\s*setMatchStatus\(\{ state: "no_match" \}\);\s*\}/, 
  'catch (err: any) {\n        console.error(err);\n        setMatchStatus({ state: "error" });\n      }');
fs.writeFileSync('src/app/results/page.tsx', c);
