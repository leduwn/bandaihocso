const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('--- HEADER LOGO ---');
console.log($('#logo img').map((i, el) => $(el).attr('src')).get());

console.log('\n--- FOOTER INFO ---');
console.log($('footer').text().replace(/\s+/g, ' ').trim().slice(0, 800));

console.log('\n--- SLIDES ---');
$('.khung-slider-chinh .banner').each((i, el) => {
  const img = $(el).find('img').attr('src');
  const bg = $(el).find('.banner-bg').attr('style');
  console.log(`Slide #${i + 1}: img=${img}, bg=${bg}`);
});

console.log('\n--- NEWS SECTION ---');
$('#section_1638842805 .post-item, #section_1638842805 .box').each((i, el) => {
  const title = $(el).find('.post-title, h5, h4').text().trim();
  const img = $(el).find('img').attr('src');
  const link = $(el).find('a').attr('href');
  if (title || img) console.log(`News #${i + 1}: ${title} | ${img} | ${link}`);
});
