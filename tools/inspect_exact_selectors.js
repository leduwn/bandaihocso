const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html, { decodeEntities: false });

console.log('=== TOP BAR ===');
console.log($('#top-bar').html().slice(0, 600));

console.log('\n=== SLIDER BANNER 0 ===');
console.log($('.khung-slider-chinh .banner').eq(0).html().slice(0, 1000));

console.log('\n=== SECTION 865356580 (INTRO) TEXT BLOCKS ===');
$('#section_865356580 .text, #section_865356580 p, #section_865356580 h1, #section_865356580 h4').each((i, el) => {
  console.log(i, el.tagName, $(el).attr('id') || $(el).attr('class') || '', '->', $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100));
});

console.log('\n=== SECTION 380594517 (STATS) ===');
console.log($('#section_380594517').html().slice(0, 1500));
