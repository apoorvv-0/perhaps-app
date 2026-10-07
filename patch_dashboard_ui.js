const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

code = code.replace(
  `{ title: "Lock Choices", sub: "Pick the people you'd want to date.", color: "#F6D7CF", label: "Active" },`,
  `{ title: "Lock Choices", sub: "Pick the people you'd want to date. You will be matched with your strongest mutual connection.", color: "#F6D7CF", label: "Active" },`
);

fs.writeFileSync('src/app/dashboard/page.tsx', code);
