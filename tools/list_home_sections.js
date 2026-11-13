const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

$('#main section.section, #main > div > section').each((i, el) => {
  const id = $(el).attr('id') || 'no-id';
  const cls = $(el).attr('class') || '';
  const headings = $(el).find('h1,h2,h3,h4').map((j, h) => $(h).text().replace(/\s+/g, ' ').trim()).get().slice(0, 3);
  const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 150);
  console.log(`\n[${i}] #${id} (${cls})`);
  console.log('   Headings:', headings);
  console.log('   Preview:', text);
});
