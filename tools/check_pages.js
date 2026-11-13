const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('_raw_site/pages').sort();
console.log(`Total crawled pages: ${files.length}`);
files.forEach(f => {
  const full = path.join('_raw_site/pages', f);
  const content = fs.readFileSync(full, 'utf8');
  const title = (content.match(/<title>([^<]*)<\/title>/i) || [])[1] || 'No title';
  console.log(`- ${f} (${(content.length / 1024).toFixed(1)} KB): ${title}`);
});
