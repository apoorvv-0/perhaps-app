const fs = require('fs');

const pages = ['src/app/verify-phone/page.tsx', 'src/app/profile/page.tsx'];

for (const p of pages) {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/bg-gray-50/g, 'bg-[#0d0d0d] text-[#f5f0ee]');
  c = c.replace(/bg-white/g, 'bg-[#151515] border border-[#2a2a2a]');
  c = c.replace(/text-gray-900/g, 'text-white');
  c = c.replace(/text-gray-700/g, 'text-[#7a6b6b]');
  c = c.replace(/text-gray-500/g, 'text-[#7a6b6b]');
  c = c.replace(/bg-brand-primary/g, 'bg-[#8b1a1a]');
  c = c.replace(/hover:bg-brand-dark/g, 'hover:bg-[#6e1515]');
  fs.writeFileSync(p, c);
}
