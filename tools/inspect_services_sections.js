const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

// Find all rows or sections containing .imgbox-dv
const sections = new Set();
$('.imgbox-dv').each((i, el) => {
  const sec = $(el).closest('section, .section');
  sections.add(sec.attr('id') || sec.attr('class') || 'unnamed');
});

console.log('Sections with .imgbox-dv:', Array.from(sections));

Array.from(sections).forEach(s => {
  const el = $(`#${s}, .${s}`).first();
  console.log(`\n=== SECTION ${s} ===`);
  console.log('Classes:', el.attr('class'));
  console.log('Rows count:', el.find('.row').length);
  el.find('.row').each((ri, r) => {
    console.log(`  Row ${ri} id=${$(r).attr('id')} cols=${$(r).children('.col').length} class="${$(r).attr('class')}"`);
  });
});
