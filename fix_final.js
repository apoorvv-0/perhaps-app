const fs = require('fs');

// Fix api/directory/route.ts
let dir = fs.readFileSync('src/app/api/directory/route.ts', 'utf8');
dir = dir.replace(/return NextResponse\.json\(\{\s*eventPhase:\s*event\.status,\s*error:\s*"Unauthorized"\s*\}\s*,\s*\{\s*status:\s*401\s*\}\);/, 'return NextResponse.json({ error: "Unauthorized" }, { status: 401 });');
dir = dir.replace(/event\.status !== "CHOOSING_OPEN"/g, 'event.status !== "CHOOSING_OPEN" && event.status !== "CHOOSING_CLOSED"');
dir = dir.replace(/return NextResponse\.json\(\{/, 'return NextResponse.json({ eventPhase: event.status,');
fs.writeFileSync('src/app/api/directory/route.ts', dir);

// Fix profile/page.tsx
let profile = fs.readFileSync('src/app/profile/page.tsx', 'utf8');
if (!profile.includes('useRef')) {
  profile = profile.replace('import { useState, useEffect }', 'import { useState, useEffect, useRef }');
}
profile = profile.replace(/initialFetchDone\b/g, 'initialFetchDoneRef.current');
profile = profile.replace(/setInitialFetchDone\(true\);?/g, 'initialFetchDoneRef.current = true;');
profile = profile.replace(/initialFetchDoneRef\.currentRef\.current/g, 'initialFetchDoneRef.current');
fs.writeFileSync('src/app/profile/page.tsx', profile);

// Fix api/profile/route.ts imports
let apiProf = fs.readFileSync('src/app/api/profile/route.ts', 'utf8');
if (!apiProf.includes('import { cookies }')) {
  apiProf = apiProf.replace('import { NextRequest, NextResponse } from "next/server";', 'import { NextRequest, NextResponse } from "next/server";\nimport { cookies } from "next/headers";\nimport { verifyToken } from "@/lib/auth/session-core";');
}
fs.writeFileSync('src/app/api/profile/route.ts', apiProf);

console.log('Fixed final');
