const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== SECTION 10 (DIFFERENCE & STATS) HTML ===');
console.log($('#section_380594517').html().slice(0, 1500));
