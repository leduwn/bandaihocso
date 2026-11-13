const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== SECTION 1 (VỀ ACAC) HTML ===');
console.log($('#section_865356580').html());
