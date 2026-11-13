const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== COL-1083676306 (RIGHT SIDE OF SECTION 10) ===');
console.log($('#col-1083676306').html());
