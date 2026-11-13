const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/lien-he.html', 'utf8');
const $ = cheerio.load(html);

console.log('Contact page title:', $('title').text());
console.log('Forms count:', $('form').length);
$('form').each((i, el) => {
  console.log(`\nForm #${i + 1}: action=${$(el).attr('action')} class=${$(el).attr('class')}`);
  $(el).find('input, textarea, select, button').each((j, inp) => {
    console.log(` - ${inp.tagName} name="${$(inp).attr('name')}" type="${$(inp).attr('type')}" placeholder="${$(inp).attr('placeholder')}"`);
  });
});
