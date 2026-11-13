const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { db } = require('./lib/db');

const PAGES_DIR = path.join(__dirname, 'data', 'clean_pages');
const html = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf8');
const $ = cheerio.load(html, { decodeEntities: false });

console.log('Testing transformation on index.html...');

// Check #logo
console.log('Old logo:', $('#logo').html().slice(0, 100));

// Check footer contact
console.log('Old footer address:', $('#text-2225069663').html().slice(0, 100));

// Check nav items
$('.header-nav a').each((i, el) => {
  const t = $(el).text().trim();
  if (t === 'Về ACAC') $(el).text('Về CMC & CMCU');
  if (t === 'Dịch vụ') $(el).text('Đào tạo & Chuyển đổi số');
  if (t === 'Cơ hội nghề nghiệp') $(el).text('Tuyển sinh & Học bổng');
  if (t.includes('LIÊN HỆ NGAY')) $(el).text('XÉT TUYỂN ONLINE');
});

console.log('Updated nav:');
$('.header-nav > li > a').each((i, el) => console.log('-', $(el).text().trim()));
