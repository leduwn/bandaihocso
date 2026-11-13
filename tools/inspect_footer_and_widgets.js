const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== HEAD TAGS ===');
$('head link').each((i, el) => {
  console.log('link:', $(el).attr('rel'), $(el).attr('href'));
});

console.log('\n=== ALL SCRIPTS WITH "chat" OR WIDGET ===');
$('script').each((i, el) => {
  const src = $(el).attr('src') || '';
  const text = $(el).html() || '';
  if (src.includes('chat') || text.includes('chat') || src.includes('widget') || text.includes('widget')) {
    console.log('Script:', src, text.slice(0, 200));
  }
});

console.log('\n=== BODY CHILDREN AT END (FLOATING WIDGETS) ===');
$('body > *:not(#wrapper):not(script):not(style)').each((i, el) => {
  console.log($(el).prop('tagName'), $(el).attr('id'), $(el).attr('class'));
});
$('body #wrapper > *:not(#header):not(#main):not(#footer):not(script):not(style)').each((i, el) => {
  console.log('In wrapper:', $(el).prop('tagName'), $(el).attr('id'), $(el).attr('class'));
});

console.log('\n=== FOOTER FULL HTML ===');
console.log($('footer').html());
