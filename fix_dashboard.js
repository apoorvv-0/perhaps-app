const fs = require('fs');

let dashboard = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
dashboard = dashboard.replace(/const cardStyle = \{\s*,\s*\/\/\s*To bypass ts error\s*,\s*\/\/\s*To bypass ts error\s*padding: "24px",/, "const cardStyle = {\n    padding: \"24px\",");
// In case it's slightly different:
dashboard = dashboard.replace(/const cardStyle = \{\s*,\s*\/\/.*?\s*,\s*\/\/.*?\s*padding: "24px",/g, "const cardStyle = {\n    padding: \"24px\",");
// If there's any stray commas:
dashboard = dashboard.replace(/const cardStyle = \{\s*,?\s*\/\/[^\n]*\s*,?\s*\/\/[^\n]*\s*padding:/, "const cardStyle = {\n    padding:");

fs.writeFileSync('src/app/dashboard/page.tsx', dashboard);
console.log('Fixed dashboard');
