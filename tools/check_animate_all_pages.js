const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const pagesDir = path.join(__dirname, '..', 'data', 'clean_pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

let totalAnimate = 0;
files.forEach(f => {
  const html = fs.readFileSync(path.join(pagesDir, f), 'utf8');
  const count = (html.match(/data-animate=/g) || []).length;
  if (count > 0) {
    totalAnimate += count;
  }
});
console.log(`Found ${totalAnimate} occurrences of data-animate across ${files.length} pages.`);
