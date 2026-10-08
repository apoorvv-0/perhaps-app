const fs = require('fs'); 
const path = require('path'); 

function walk(dir) { 
  let results = []; 
  const list = fs.readdirSync(dir); 
  list.forEach(file => { 
    file = path.join(dir, file); 
    const stat = fs.statSync(file); 
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) { 
      results = results.concat(walk(file)); 
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) { 
      results.push(file); 
    } 
  }); 
  return results; 
} 

const files = walk('./src'); 
files.forEach(file => { 
  let content = fs.readFileSync(file, 'utf8'); 
  let modified = false; 
  if (content.includes('!session?.idVerificationStatus === "APPROVED"')) { 
    content = content.replace(/!session\?\.idVerificationStatus === "APPROVED"/g, 'session?.idVerificationStatus !== "APPROVED"'); 
    modified = true; 
  } 
  if (content.includes('!session.idVerificationStatus === "APPROVED"')) { 
    content = content.replace(/!session\.idVerificationStatus === "APPROVED"/g, 'session.idVerificationStatus !== "APPROVED"'); 
    modified = true; 
  } 
  if (modified) { 
    fs.writeFileSync(file, content, 'utf8'); 
    console.log('Updated ' + file); 
  } 
});
