const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html, { decodeEntities: false });

console.log('=== HEADER WRAPPER CHILDREN ===');
$('.header-wrapper > *').each((i, el) => {
  console.log(el.tagName, $(el).attr('id') || '', $(el).attr('class') || '');
});

console.log('\n=== HEADER TOP ===');
console.log($('.header-top').html().slice(0, 600));

console.log('\n=== SECTION 380594517 STAT BLOCKS ===');
$('#section_380594517 .row').each((i, r) => {
  console.log(`Row ${i} id=${$(r).attr('id')} cols=${$(r).children('.col').length}`);
  $(r).find('.text, .icon-box, h2, h3, p, span').slice(0, 8).each((j, t) => {
    const txt = $(t).text().replace(/\s+/g, ' ').trim();
    if (txt) console.log('  ', t.tagName, $(t).attr('id') || '', $(t).attr('class') || '', '->', txt.slice(0, 80));
  });
});

console.log('\n=== SECTION 1638842805 (NEWS) ===');
console.log($('#section_1638842805').html().slice(0, 1200));
