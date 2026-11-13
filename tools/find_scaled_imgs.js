const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('data/clean_pages/index.html', 'utf8'));

console.log('Images matching 2025/10 or scaled:');
$('img').each((i, el) => {
  const src = $(el).attr('src') || '';
  if (src.includes('2025/10') || src.includes('scaled')) {
    console.log(i, src, 'parent section:', $(el).closest('section').attr('id'));
  }
});
