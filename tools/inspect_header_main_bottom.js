const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html, { decodeEntities: false });

console.log('=== HEADER MAIN ===');
console.log($('.header-main').html().slice(0, 1000));

console.log('\n=== HEADER BOTTOM ===');
console.log($('.header-bottom').html().slice(0, 1000));
