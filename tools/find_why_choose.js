const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('All elements with class or id why-choose:');
$('[class*="why-choose"], [id*="why-choose"]').each((i, el) => {
  console.log(i, el.tagName, $(el).attr('id') || '', $(el).attr('class') || '', 'parent:', $(el).parent().prop('tagName'), $(el).parent().attr('id') || $(el).parent().attr('class'));
});
