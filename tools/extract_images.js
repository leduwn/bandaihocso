const fs = require('fs');
const html = fs.readFileSync('_raw_site/index.html', 'utf8');
const imgRegex = /<img[^>]+>/gi;
let m;
const images = [];
while ((m = imgRegex.exec(html)) !== null) {
  const tag = m[0];
  const dSrc = (tag.match(/data-src=["']([^"']+)["']/i) || [])[1];
  const src = (tag.match(/src=["']([^"']+)["']/i) || [])[1];
  const srcset = (tag.match(/data-srcset=["']([^"']+)["']/i) || [])[1];
  const real = dSrc || (srcset ? srcset.split(' ')[0] : (src && !src.startsWith('data:') ? src : null));
  if (real) {
    images.push(real);
  }
}

// Background images in style attributes or inline styles
const bgRegex = /url\(["']?(https?:\/\/[^"')]+|\/wp-content\/[^"')]+)["']?\)/gi;
while ((m = bgRegex.exec(html)) !== null) {
  images.push(m[1]);
}

const unique = Array.from(new Set(images));
console.log('Total images found on homepage:', unique.length);
unique.forEach(u => console.log(u));
