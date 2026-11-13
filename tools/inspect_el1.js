const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

const el1 = $('section.why-choose-us').eq(1);
console.log('Element 1 parent tree:');
let curr = el1;
for (let i = 0; i < 5; i++) {
  curr = curr.parent();
  console.log(`Level ${i + 1}:`, curr.prop('tagName'), curr.attr('id') || '', curr.attr('class') || '');
}
console.log('\nElement 1 HTML preview:');
console.log(el1.html().slice(0, 500));
