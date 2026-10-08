const fs = require('fs');

// 1. Fix admin/page.tsx (error variable)
let admin = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
if (admin.includes('const [error, setError] = useState<string | null>(null);')) {
  // Wait, I put it inside VerificationQueue! But VerificationQueue is a component.
  // Oh, there is an existing 'error' state in the parent AdminDashboard component!
  // And it replaced if (loading) return <div ...> which is inside VerificationQueue.
  // Wait, error is used by VerificationQueue. Why does it say Cannot find name 'error'?
  // Let's check admin/page.tsx
}

// 2. Fix dashboard/page.tsx
let dashboard = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
dashboard = dashboard.replace(/import \{.*useState,\s*useEffect.*\} from "react";/g, 'import { useState, useEffect, useCallback } from "react";');
// Move useEffect after fetchStatus
const dashEffectRegex = /useEffect\(\(\) => \{[\s\S]*?\}, \[session, isLoading, router, fetchStatus\]\);/;
const dashEffectMatch = dashboard.match(dashEffectRegex);
if (dashEffectMatch) {
  dashboard = dashboard.replace(dashEffectMatch[0], '');
  const dashFetchRegex = /const fetchStatus = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);/;
  dashboard = dashboard.replace(dashFetchRegex, (match) => match + '\n\n  ' + dashEffectMatch[0]);
}
fs.writeFileSync('src/app/dashboard/page.tsx', dashboard);

// 3. Fix cashier/page.tsx
let cashier = fs.readFileSync('src/app/cashier/page.tsx', 'utf8');
cashier = cashier.replace(/import \{.*useState,\s*useEffect.*\} from "react";/g, 'import { useState, useEffect, useCallback } from "react";');
const cashEffectRegex = /useEffect\(\(\) => \{[\s\S]*?\}, \[session, isLoading, router, activeTab, fetchLedger\]\);/;
const cashEffectMatch = cashier.match(cashEffectRegex);
if (cashEffectMatch) {
  cashier = cashier.replace(cashEffectMatch[0], '');
  const cashFetchRegex = /const fetchLedger = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);/;
  cashier = cashier.replace(cashFetchRegex, (match) => match + '\n\n  ' + cashEffectMatch[0]);
}
fs.writeFileSync('src/app/cashier/page.tsx', cashier);

// 4. Fix directory/page.tsx
let dir = fs.readFileSync('src/app/directory/page.tsx', 'utf8');
dir = dir.replace(/import \{.*useState,\s*useEffect.*\} from "react";/g, 'import { useState, useEffect, useCallback } from "react";');
const dirEffectRegex = /useEffect\(\(\) => \{[\s\S]*?\}, \[session, isLoading, router, fetchData\]\);/;
const dirEffectMatch = dir.match(dirEffectRegex);
if (dirEffectMatch) {
  dir = dir.replace(dirEffectMatch[0], '');
  const dirFetchRegex = /const fetchData = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);/;
  dir = dir.replace(dirFetchRegex, (match) => match + '\n\n  ' + dirEffectMatch[0]);
}
fs.writeFileSync('src/app/directory/page.tsx', dir);

