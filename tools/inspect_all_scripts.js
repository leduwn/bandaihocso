const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== ALL INLINE SCRIPTS ===');
$('script').each((i, el) => {
  const src = $(el).attr('src');
  const type = $(el).attr('type');
  const txt = $(el).html() || '';
  if (!src) {
    console.log(`\n[Inline ${i}] type=${type} len=${txt.length}`);
    console.log(txt.slice(0, 300));
  } else {
    console.log(`\n[External ${i}] src=${src} type=${type} defer=${$(el).attr('defer') || ''} async=${$(el).attr('async') || ''}`);
  }
});
