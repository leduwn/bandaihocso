const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== CHECKING section_466373946 COLS ===');
$('#section_466373946 .row').each((ri, r) => {
  console.log(`Row ${ri} id=${$(r).attr('id')} class="${$(r).attr('class')}"`);
  $(r).children('.col').each((ci, c) => {
    console.log(`  Col ${ci}: id=${$(c).attr('id')} class="${$(c).attr('class')}" animate="${$(c).attr('data-animate') || ''}"`);
  });
});

console.log('\n=== CHECKING ALL data-animate ELEMENTS ===');
$('[data-animate]').each((i, el) => {
  console.log(el.tagName, $(el).attr('id') || $(el).attr('class'), 'animate=', $(el).attr('data-animate'));
});
