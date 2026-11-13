const fs = require('fs');
const path = require('path');
const https = require('https');
const cheerio = require('cheerio');

const html = fs.readFileSync('_raw_site/cmcu_home.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== CMCU SECTIONS & CONTENT ===');
const imgs = new Set();
$('img').each((i, el) => {
  const src = $(el).attr('src') || $(el).attr('data-src') || '';
  if (src && !src.startsWith('data:') && (src.includes('wp-content/uploads') || src.includes('cmcu'))) {
    imgs.add(src);
  }
});

console.log('Total unique CMCU images on homepage:', imgs.size);
Array.from(imgs).slice(0, 35).forEach((u, i) => console.log(`${i + 1}. ${u}`));

console.log('\n=== CMCU TEXT HIGHLIGHTS ===');
$('h1, h2, h3, .elementor-heading-title').each((i, el) => {
  const t = $(el).text().replace(/\s+/g, ' ').trim();
  if (t.length > 5 && t.length < 180) {
    console.log('-', t);
  }
});

console.log('\n=== CMCU PARAGRAPHS ===');
$('p').each((i, el) => {
  const t = $(el).text().replace(/\s+/g, ' ').trim();
  if (t.length > 40 && t.length < 400) {
    console.log(`P${i}:`, t);
  }
});
