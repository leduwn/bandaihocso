const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== SECTION 6 (SERVICES) HEADING TAGS ===');
$('#section_466373946 .row').first().each((i, r) => {
  console.log($(r).html());
});

console.log('\n=== SECTION 3 (ABOUT) #text-428433913 INNER HTML ===');
console.log($('#text-428433913').html());
