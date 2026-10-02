const fs = require('fs');

// Fix profile/page.tsx
let profile = fs.readFileSync('src/app/profile/page.tsx', 'utf8');
if (!profile.includes('useRef')) {
  profile = profile.replace('import { useState, useEffect }', 'import { useState, useEffect, useRef }');
}
profile = profile.replace(/initialFetchDone/g, 'initialFetchDoneRef.current');
profile = profile.replace(/setInitialFetchDone\(true\)/g, 'initialFetchDoneRef.current = true');
// Fix any double replacements like initialFetchDoneRef.currentRef.current
profile = profile.replace(/initialFetchDoneRef\.currentRef\.current/g, 'initialFetchDoneRef.current');
fs.writeFileSync('src/app/profile/page.tsx', profile);

// Fix api/directory/route.ts
let dirRoute = fs.readFileSync('src/app/api/directory/route.ts', 'utf8');
// It seems I replaced event.status globally and broke something. Let's see.
// The error says "Block-scoped variable 'event' used before its declaration."
// Let's print the line causing error.
console.log('Fixed profile');
