const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('Total elements with data-animate:', $('[data-animate]').length);
$('[data-animate]').removeAttr('data-animate');
console.log('After removal, elements with data-animate:', $('[data-animate]').length);
