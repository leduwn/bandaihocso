const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html, { decodeEntities: false });

console.log($('.header-main').html());
console.log('\n=== HEADER BOTTOM FULL ===');
console.log($('.header-bottom').html());
