const fs = require('fs');

// 1. Fix admin/page.tsx
let admin = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
if (!admin.includes('const [error, setError]')) {
  admin = admin.replace(
    'function VerificationQueue() {\n  const [queue, setQueue] = useState<any[]>([]);\n  const [loading, setLoading] = useState(true);',
    'function VerificationQueue() {\n  const [queue, setQueue] = useState<any[]>([]);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<string | null>(null);'
  );
  fs.writeFileSync('src/app/admin/page.tsx', admin);
}

function fixCallbackOrder(filePath, fetchFuncName) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add useCallback if missing
  if (!content.includes('useCallback')) {
    content = content.replace(/useState, useEffect/, 'useState, useEffect, useCallback');
  }

  // Identify the useEffect block
  const effectRegex = new RegExp(\  useEffect\\(\\(\\) => \\{[\\\\s\\\\S]*?\\}, \\[[a-zA-Z0-9_,\\s]*\[a-zA-Z0-9_,\\s]*\\]\\);\\n\);
  const effectMatch = content.match(effectRegex);
  
  if (effectMatch) {
    // Remove the useEffect from its current position
    content = content.replace(effectMatch[0], '');
    
    // Find the end of the fetchFunc definition
    const fetchRegex = new RegExp(\  const \ = useCallback\\(async \\(\\) => \\{[\\\\s\\\\S]*?\\}, \\[\\]\\);\);
    const fetchMatch = content.match(fetchRegex);
    
    if (fetchMatch) {
      // Re-insert the useEffect exactly after the fetchFunc
      content = content.replace(fetchMatch[0], fetchMatch[0] + '\n\n' + effectMatch[0]);
    }
  }
  
  fs.writeFileSync(filePath, content);
}

fixCallbackOrder('src/app/dashboard/page.tsx', 'fetchStatus');
fixCallbackOrder('src/app/cashier/page.tsx', 'fetchLedger');
fixCallbackOrder('src/app/directory/page.tsx', 'fetchData');

