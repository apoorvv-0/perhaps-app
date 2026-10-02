const fs = require('fs');

let profile = fs.readFileSync('src/app/profile/page.tsx', 'utf8');

// Fix catch block
profile = profile.replace(/\.catch\(\(\) => initialFetchDoneRef\.current = true;\);/g, '.catch(() => { initialFetchDoneRef.current = true; });');

// Fix dependency array if needed (though syntax-wise it shouldn't be the issue)
// Wait, the TS errors were:
// src/app/profile/page.tsx(83,58): error TS1005: ')' expected. -> This is the catch block! 
//   () => initialFetchDoneRef.current = true;
// is invalid if the semicolon is there. It expects a closing parenthesis before the semicolon.

fs.writeFileSync('src/app/profile/page.tsx', profile);
console.log('Fixed syntax in profile/page.tsx');
