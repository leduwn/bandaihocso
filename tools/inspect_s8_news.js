const fs = require('fs');
const cheerio = require('cheerio');

fetch('http://localhost:3000/').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const s8 = $('#section_1638842805');
  console.log('=== SECTION 8 (NEWS & EVENTS) ===');
  console.log('Headings:', s8.find('h1, h2, h3, h4').map((_, h) => $(h).text().trim()).get());
  console.log('Articles/Cards count:', s8.find('.post-item, .col, article').length);
  s8.find('.post-item, article, .box-text').each((i, el) => {
    console.log(`Item ${i}:`, $(el).text().replace(/\s+/g, ' ').slice(0, 120));
  });
});
