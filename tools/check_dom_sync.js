const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('--- LOGO ---');
$('#logo img').each((i, el) => console.log(i, $(el).attr('src')));

console.log('\n--- FOOTER ADDRESSES ---');
$('footer .contact-info .contact-item p').each((i, el) => {
  const txt = $(el).text().trim();
  if (txt) console.log(i, txt);
});

console.log('\n--- FOOTER PHONES ---');
$('footer .contact-phones a').each((i, el) => {
  console.log(i, $(el).attr('href'), $(el).text().trim());
});

console.log('\n--- FOOTER SOCIALS ---');
$('footer .social-links a').each((i, el) => {
  console.log(i, $(el).attr('href'));
});
