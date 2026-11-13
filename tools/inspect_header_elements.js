const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html, { decodeEntities: false });

console.log('=== HEADER STRUCTURE ===');
$('#header > *').each((i, el) => {
  console.log(el.tagName, $(el).attr('id') || '', $(el).attr('class') || '');
});

console.log('\n=== SECTION 865356580 (INTRO) ===');
$('#section_865356580 [id^="text-"]').each((i, el) => {
  console.log($(el).attr('id'), '->', $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100));
});

console.log('\n=== SECTION 380594517 (STATS) ===');
$('#section_380594517 [id^="text-"]').each((i, el) => {
  console.log($(el).attr('id'), '->', $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100));
});

console.log('\n=== SECTION 1415813573 (CTA) ===');
$('#section_1415813573 [id^="text-"]').each((i, el) => {
  console.log($(el).attr('id'), '->', $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100));
});
