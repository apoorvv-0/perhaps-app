const fs = require('fs');

// 1. Fix src/app/api/directory/route.ts
let dir = fs.readFileSync('src/app/api/directory/route.ts', 'utf8');
dir = dir.replace('return NextResponse.json({ eventPhase: event.status, error: "Unauthorized" }, { status: 401 });', 'return NextResponse.json({ error: "Unauthorized" }, { status: 401 });');
// Try regex again just in case
dir = dir.replace(/return NextResponse\.json\(\{[\s\n]*eventPhase:\s*event\.status,[\s\n]*error:\s*"Unauthorized"[\s\n]*\},[\s\n]*\{\s*status:\s*401\s*\}\);/m, 'return NextResponse.json({ error: "Unauthorized" }, { status: 401 });');
fs.writeFileSync('src/app/api/directory/route.ts', dir);

// 2. Fix src/app/api/profile/route.ts
let apiProfile = fs.readFileSync('src/app/api/profile/route.ts', 'utf8');
apiProfile = apiProfile.replace(/const cookieStore = cookies\(\);/g, 'const cookieStore = await cookies();');
fs.writeFileSync('src/app/api/profile/route.ts', apiProfile);

// 3. Fix src/app/profile/page.tsx
let profile = fs.readFileSync('src/app/profile/page.tsx', 'utf8');
if (!profile.includes('useRef')) {
    profile = profile.replace(/import\s*\{\s*useState,\s*useEffect\s*\}\s*from\s*["']react["'];/, 'import { useState, useEffect, useRef } from "react";');
    // If they were separate:
    profile = profile.replace(/import\s*React\s*,\s*\{\s*useState,\s*useEffect\s*\}\s*from\s*["']react["'];/, 'import React, { useState, useEffect, useRef } from "react";');
} else {
    // maybe useRef is in the file but not imported?
    if (!profile.includes('useRef }')) {
        profile = profile.replace(/import\s*\{\s*useState,\s*useEffect\s*\}\s*from\s*["']react["'];/, 'import { useState, useEffect, useRef } from "react";');
    }
}
fs.writeFileSync('src/app/profile/page.tsx', profile);

console.log('Fixed final final');
