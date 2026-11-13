const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== HERO SLIDER BANNERS ===');
$('.khung-slider-chinh .banner').each((i, el) => {
  console.log(`Banner ${i}:`, $(el).find('img').attr('src'), '| Text:', $(el).find('.banner-layers, .text').text().replace(/\s+/g, ' ').trim());
});

console.log('\n=== INTRO SECTION (ABOUT) ===');
$('section:has(h2:contains("VỀ")), section:has(h2:contains("GIỚI THIỆU")), #section_1270220689, section:has(.icon-box)').slice(0, 3).each((i, el) => {
  console.log(`Intro section ${i} id=${$(el).attr('id')}:`, $(el).text().replace(/\s+/g, ' ').slice(0, 300));
});

console.log('\n=== STATS / NUMBERS SECTION ===');
$('[class*="count"], [class*="stat"], [class*="number"]').each((i, el) => {
  console.log('Stat:', $(el).text().replace(/\s+/g, ' ').trim());
});
