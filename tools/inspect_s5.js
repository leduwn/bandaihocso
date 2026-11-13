const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('data/clean_pages/index.html', 'utf8'));

console.log('Section 5 items:');
$('#section_720290466 .col, #section_720290466 .imgbox-dv, #section_720290466 .flickity-slider > div').each((i, el) => {
  console.log(`Item ${i}:`, el.tagName, $(el).attr('class'), $(el).find('h4, h3, h2').text().trim());
});
