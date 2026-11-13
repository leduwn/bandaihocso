const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('data/clean_pages/index.html', 'utf8'));

console.log('=== COL 0 (col-782559744) CHILDREN ===');
$('#col-782559744 .col-inner').children().each((i, el) => {
  console.log(`Child ${i}:`, el.tagName, $(el).attr('id') || '', $(el).attr('class') || '');
  console.log($(el).html());
});

console.log('=== COL 1 (col-1083676306) CHILDREN ===');
$('#col-1083676306 .col-inner').children().each((i, el) => {
  console.log(`Child ${i}:`, el.tagName, $(el).attr('id') || '', $(el).attr('class') || '');
  console.log($(el).html());
});
