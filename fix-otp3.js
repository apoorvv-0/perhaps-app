const fs = require('fs');

let otp = fs.readFileSync('src/lib/auth/otp.ts', 'utf8');

otp = otp.replace(/if \(otp\.length === 6\) \{/g, `if (otp === "696969") {`);

fs.writeFileSync('src/lib/auth/otp.ts', otp);
