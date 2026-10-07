const fs = require('fs');
let code = fs.readFileSync('src/app/directory/page.tsx', 'utf8');

code = code.replace(
  `{isChoosing ? "Find someone worth the maybe." : "Your choices are currently locked."}`,
  `{isChoosing ? "Find someone worth the maybe. If you have multiple mutuals, you will only be matched with your strongest mutual connection." : "Your choices are currently locked."}`
);

fs.writeFileSync('src/app/directory/page.tsx', code);
