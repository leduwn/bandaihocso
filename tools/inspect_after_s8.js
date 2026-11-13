const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('data/clean_pages/index.html', 'utf8'));

const s8 = $('#section_1638842805');
console.log('Next sibling after s8:');
let next = s8.next();
while (next.length) {
  console.log(next.prop('tagName'), next.attr('id'), next.attr('class'));
  next = next.next();
}
