const fs = require('fs');
const cheerio = require('cheerio');

fetch('http://localhost:3000/').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const s8 = $('#section_1638842805');
  console.log(s8.html().slice(0, 1500));
});
