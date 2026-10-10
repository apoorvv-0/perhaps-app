const fs = require('fs');
let content = fs.readFileSync('src/app/directory/page.tsx', 'utf8');

// 1. Remove the "Pro tip" section completely
const tipStart = content.indexOf('{!isValidCount && isChoosing && (');
if (tipStart !== -1) {
    const tipEnd = content.indexOf(')}', tipStart) + 2; // match the closing brace of the condition
    content = content.substring(0, tipStart) + content.substring(tipEnd);
}

// 2. Change isValidCount definition
content = content.replace(
    'const isValidCount = picks.length === 0 || picks.length >= 3;',
    'const isValidCount = true;'
);

// 3. Add bottom spacer for the main directory list
// It currently ends like this:
//   )}
// </div>
// {filtered.length === 0 && (
const dirListEnd = content.indexOf('{filtered.length === 0 && (');
if (dirListEnd !== -1) {
    // Inject a spacer right before it, inside the container, or just outside the container
    content = content.substring(0, dirListEnd) + '<div className="h-48 w-full pointer-events-none" />\n' + content.substring(dirListEnd);
}

// 4. Add bottom spacer inside the modal's overflow-y-auto list
// The modal mapping ends around:
//               </motion.div>
//             );
//           })}
//         </div>
//
//         <div className="text-center h-4 mt-2">
const modalListEnd = content.indexOf('</div>\n\n              <div className="text-center h-4 mt-2">');
if (modalListEnd !== -1) {
    // Inject spacer
    content = content.substring(0, modalListEnd) + '  <div className="h-32 w-full shrink-0" />\n              ' + content.substring(modalListEnd);
} else {
    // Fallback if formatting differs
    console.log("Could not find modalListEnd exactly");
}

fs.writeFileSync('src/app/directory/page.tsx', content);
console.log('Modifications complete');
