const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('data/clean_pages/index.html', 'utf8'));

console.log('=== SECTION 2 (HỢP TÁC CHIẾN LƯỢC) ===');
const s2 = $('#section_156873414');
s2.find('.row').each((i, row) => {
  console.log(`Row ${i} id=${$(row).attr('id')} class=${$(row).attr('class')}`);
  $(row).find('> .col').each((j, col) => {
    console.log(`  Col ${j} id=${$(col).attr('id')} class=${$(col).attr('class')}`);
    console.log(`    h3/h4/h5:`, $(col).find('h3, h4, h5').map((_, h) => $(h).text().trim()).get());
    console.log(`    img:`, $(col).find('img').map((_, im) => $(im).attr('src')).get());
  });
});
