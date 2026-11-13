const fs = require('fs');
if (fs.existsSync('public/releases/v7.1.0/css/all.css')) {
  const css = fs.readFileSync('public/releases/v7.1.0/css/all.css', 'utf8');
  const urls = new Set();
  const mRegex = /url\(([^)]+)\)/gi;
  let m;
  while ((m = mRegex.exec(css)) !== null) {
    urls.add(m[1].replace(/["']/g, ''));
  }
  console.log('FA webfonts referenced:', Array.from(urls));
} else {
  console.log('FA css not found');
}
