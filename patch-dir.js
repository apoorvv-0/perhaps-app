const fs = require('fs');
let code = fs.readFileSync('src/app/directory/page.tsx', 'utf8');

// Colors replacement mapping
code = code.replace(/#faf7f5/g, '#0d0d0d'); // main bg
code = code.replace(/#ffffff|white/g, '#151515'); // cards bg
code = code.replace(/#f0e8e8|#f5f0f0|#e5d8d8|#f0ece8/g, '#2a2a2a'); // borders
code = code.replace(/#1a1a1a/g, '#f5f0ee'); // main text
code = code.replace(/#6b7280|#9ca3af/g, '#7a6b6b'); // muted text
code = code.replace(/#9e092e/g, '#8b1a1a'); // primary red
code = code.replace(/#fdf4f5/g, '#1a1010'); // selected row bg
code = code.replace(/#faf9f8|#fdf9f8/g, '#1e1e1e'); // idle row bg
code = code.replace(/rgba\(0,0,0,0.06\)/g, 'rgba(0,0,0,0.5)'); // shadows

// Add BottomTabBar import
if (!code.includes('import BottomTabBar')) {
  code = code.replace('import { useAuth } from "@/components/AuthProvider";', 'import { useAuth } from "@/components/AuthProvider";\nimport BottomTabBar from "@/components/BottomTabBar";');
}

// Add BottomTabBar usage before final closing div
code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '</div>\n        </div>\n      </div>\n      <BottomTabBar />\n    </div>');

// Remove original fixed top navbar to rely on tab bar + back button
code = code.replace(/<nav.*?<\/nav>/s, '');

// Also pad bottom
code = code.replace(/minHeight: "100vh", background: "#0d0d0d"/, 'minHeight: "100vh", background: "#0d0d0d", paddingBottom: "80px"');

fs.writeFileSync('src/app/directory/page.tsx', code);
console.log('Directory patched');
