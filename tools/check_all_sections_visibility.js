const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== CHECKING ALL SECTIONS AND THEIR VISIBILITY ===');
$('section').each((i, el) => {
  const id = $(el).attr('id') || 'no-id';
  const cls = $(el).attr('class') || '';
  const style = $(el).attr('style') || '';
  console.log(`[Section ${i}] #${id} .${cls}`);
  $(el).find('.col').each((ci, c) => {
    const cId = $(c).attr('id') || 'no-id';
    const cCls = $(c).attr('class') || '';
    const anim = $(c).attr('data-animate') || '';
    const text = $(c).text().replace(/\s+/g, ' ').trim().slice(0, 40);
    console.log(`   Col ${ci}: #${cId} .${cCls} [anim=${anim}] text="${text}"`);
  });
});
