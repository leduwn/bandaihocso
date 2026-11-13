const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== SECTION 466373946 ROWS & COLS STRUCTURE ===');
$('#section_466373946 .row').each((ri, r) => {
  console.log(`\nRow ${ri} id=${$(r).attr('id')} class="${$(r).attr('class')}"`);
  $(r).children().each((ci, c) => {
    console.log(`  Child ${ci}: tag=${c.tagName} id=${$(c).attr('id')} class="${$(c).attr('class')}"`);
    const card = $(c).find('.imgbox-dv');
    if (card.length) {
      console.log(`     -> Has .imgbox-dv: "${card.find('h4').text()}"`);
    }
  });
});
