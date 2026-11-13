const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== CARD INNER HTML (Card 0 & 1 in desktop section) ===');
$('#section_466373946 .imgbox-dv').slice(0, 2).each((i, el) => {
  console.log(`\n--- Card ${i} ---`);
  console.log($(el).html());
});

// Check styles inside #section_466373946
console.log('\n=== INLINE STYLES in section_466373946 ===');
$('#section_466373946 style').each((i, el) => console.log($(el).html()));
