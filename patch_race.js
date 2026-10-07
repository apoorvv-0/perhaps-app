const fs = require('fs');
let code = fs.readFileSync('src/app/api/choices/route.ts', 'utf8');

code = code.replace(
  /} catch \(err: any\) {\s*return NextResponse\.json\(\{ error: err\.message \}, \{ status: 500 \}\);\s*}/,
  `} catch (err: any) {
    if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
      return NextResponse.json({ error: "Your choices were just updated. Please refresh the page." }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }`
);

fs.writeFileSync('src/app/api/choices/route.ts', code);
