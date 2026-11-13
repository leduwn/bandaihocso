const fs = require('fs');
const html = fs.readFileSync('_raw_site/pages/index.html', 'utf8');

const sRegex = /<script[^>]*>/gi;
let m;
while ((m = sRegex.exec(html)) !== null) {
  console.log(m[0]);
}
