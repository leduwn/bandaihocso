const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== CHECKING INLINE STYLES FOR OPACITY OR DISPLAY ===');
$('[style]').each((i, el) => {
  const style = $(el).attr('style') || '';
  if (style.includes('opacity') || style.includes('display: none') || style.includes('display:none') || style.includes('visibility')) {
    console.log(el.tagName, $(el).attr('id') || $(el).attr('class'), 'style=', style);
  }
});

console.log('\n=== CHECKING ALL <style> TAGS ===');
$('style').each((i, el) => {
  const txt = $(el).html() || '';
  if (txt.includes('opacity: 0') || txt.includes('opacity:0') || txt.includes('display: none') || txt.includes('display:none')) {
    console.log(`Style tag ${i}:`, txt.slice(0, 200));
  }
});
