const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

$('style').each((i, el) => {
  const txt = $(el).html() || '';
  if (txt.includes('contact-button-container') || txt.includes('contactButtons')) {
    console.log(`Style tag ${i}:`, txt);
  }
});
