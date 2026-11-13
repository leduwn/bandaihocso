const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== CONTACT-BUTTON-CONTAINER ===');
console.log($('.contact-button-container').html());

console.log('\n=== CHATBOT SCRIPTS & HTML ===');
$('*').filter(function() {
  const c = $(this).attr('class') || '';
  const id = $(this).attr('id') || '';
  return c.includes('chat') || id.includes('chat') || c.includes('bot') || id.includes('bot');
}).each((i, el) => {
  console.log(el.tagName, $(el).attr('id'), $(el).attr('class'), $(el).text().slice(0, 100));
});

console.log('\n=== ALL SCRIPT TAGS AT BOTTOM ===');
$('body script').each((i, el) => {
  const src = $(el).attr('src');
  if (src) console.log('Script src:', src);
  else console.log('Inline script:', $(el).html().slice(0, 120));
});
