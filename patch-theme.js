const fs = require('fs');

function patchFile(filepath, hasTabBar) {
  if (!fs.existsSync(filepath)) return;
  let code = fs.readFileSync(filepath, 'utf8');

  // Colors replacement mapping
  code = code.replace(/#faf7f5/g, '#0d0d0d'); // main bg
  code = code.replace(/#ffffff|white/g, '#151515'); // cards bg
  code = code.replace(/#f0e8e8|#f5f0f0|#e5d8d8|#f0ece8/g, '#2a2a2a'); // borders
  code = code.replace(/#1a1a1a|#111827/g, '#f5f0ee'); // main text
  code = code.replace(/#374151/g, '#e0d6d6');
  code = code.replace(/#6b7280|#9ca3af|#4b5563/g, '#7a6b6b'); // muted text
  code = code.replace(/#9e092e/g, '#8b1a1a'); // primary red
  code = code.replace(/#fdf4f5/g, '#1a1010'); // selected row bg
  code = code.replace(/#faf9f8|#fdf9f8/g, '#1e1e1e'); // idle row bg
  code = code.replace(/rgba\(0,0,0,0.06\)/g, 'rgba(0,0,0,0.5)'); // shadows
  code = code.replace(/bg-gray-50/g, 'bg-[#0d0d0d]');
  code = code.replace(/bg-white/g, 'bg-[#151515]');
  code = code.replace(/text-gray-900/g, 'text-[#f5f0ee]');
  code = code.replace(/text-gray-800/g, 'text-[#e0d6d6]');
  code = code.replace(/text-gray-600/g, 'text-[#7a6b6b]');
  code = code.replace(/text-gray-500/g, 'text-[#7a6b6b]');
  code = code.replace(/border-gray-200/g, 'border-[#2a2a2a]');
  code = code.replace(/border-gray-300/g, 'border-[#2a2a2a]');

  // For inline styles replacing bg="#faf7f5"
  code = code.replace(/background:\s*['"]#0d0d0d['"]/g, "background: '#0d0d0d'");

  // Add BottomTabBar import
  if (hasTabBar) {
    if (!code.includes('import BottomTabBar')) {
      code = code.replace('import { useAuth } from "@/components/AuthProvider";', 'import { useAuth } from "@/components/AuthProvider";\nimport BottomTabBar from "@/components/BottomTabBar";');
    }
    // Try appending to main wrapper if possible
    if (code.includes('minHeight: "100vh"')) {
       code = code.replace(/minHeight:\s*["']100vh["']([^}]*)}/g, 'minHeight: "100vh", paddingBottom: "80px"$1}');
       // simplistic append before last closing div
       if (!code.includes('<BottomTabBar />')) {
           code = code.replace(/(<\/div>\s*)$/m, '      <BottomTabBar />\n$1');
       }
    }
  }

  fs.writeFileSync(filepath, code);
  console.log('Patched ' + filepath);
}

patchFile('src/app/profile/page.tsx', true);
patchFile('src/app/results/page.tsx', true);
patchFile('src/app/admin/page.tsx', false);
patchFile('src/app/cashier/page.tsx', false);
