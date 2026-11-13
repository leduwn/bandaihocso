const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== SECTION 4 (PARTNERS) HTML ===');
console.log($('#section_156873414').html().slice(0, 1000));
