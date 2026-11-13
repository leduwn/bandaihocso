const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

// Find the section containing "Dịch vụ"
console.log('=== SERVICE CARDS INSPECTION ===');
$('.imgbox-dv').each((i, el) => {
  const box = $(el);
  const title = box.find('.box-text h5, .box-text h4, .box-text h3, .box-text p, .box-text a').first().text().trim();
  const parentCol = box.closest('.col');
  console.log(`Card ${i}: "${title}" | Col class: "${parentCol.attr('class')}" | Col style: "${parentCol.attr('style') || ''}"`);
});

// Look at row containing .imgbox-dv
const row = $('.imgbox-dv').first().closest('.row');
console.log('\nRow class:', row.attr('class'), 'id:', row.attr('id'));
console.log('Row cols count:', row.children('.col').length);
row.children('.col').slice(0, 6).each((i, el) => {
  console.log(`Col ${i}:`, $(el).attr('class'), '| style:', $(el).attr('style') || 'none');
});
