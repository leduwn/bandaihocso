const fs = require('fs');
const html = fs.readFileSync('_raw_site/pages/index.html', 'utf8');

const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
if (!mainMatch) {
  console.log('No main found');
  process.exit(1);
}

const main = mainMatch[1];

// Find all top-level sections or div blocks inside main
const sectionRegex = /<(section|div)[^>]*(?:class|id)=["']([^"']*)["'][^>]*>/gi;
let m;
console.log('--- SECTIONS & DIVS IN MAIN ---');
const found = [];
while ((m = sectionRegex.exec(main)) !== null) {
  if (m[0].startsWith('<section')) {
    found.push({ tag: m[0] });
  }
}

found.forEach((f, idx) => console.log(`${idx + 1}: ${f.tag}`));
