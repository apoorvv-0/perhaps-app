const fs = require('fs');
const lines = fs.readFileSync('src/app/directory/page.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('text-center h-4 mt-2')) {
    lines.splice(i, 0, '              <div className="h-48 w-full shrink-0 pointer-events-none" />');
    break;
  }
}

fs.writeFileSync('src/app/directory/page.tsx', lines.join('\n'));
console.log('Added padding');
