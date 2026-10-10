const fs = require('fs');
let content = fs.readFileSync('src/app/api/admin/verification-queue/route.ts', 'utf8');
if (!content.includes('import { getActiveEvent }')) {
  content = content.replace('import { prisma } from "@/lib/db/prisma";', 'import { prisma } from "@/lib/db/prisma";\nimport { getActiveEvent } from "@/lib/event-service";');
  fs.writeFileSync('src/app/api/admin/verification-queue/route.ts', content);
  console.log('Import added!');
} else {
  console.log('Already imported.');
}
