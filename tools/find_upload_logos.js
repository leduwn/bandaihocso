const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else {
      files.push(full.replace(/\\/g, '/'));
    }
  }
  return files;
}

const uploads = walk('public/wp-content/uploads');
console.log('Total upload files:', uploads.length);
const clientLogos = uploads.filter(f => f.toLowerCase().includes('client') || f.toLowerCase().includes('doitac') || f.toLowerCase().includes('logo') || f.includes('scaled'));
console.log('Sample client/partner logos:', clientLogos.slice(0, 30));
