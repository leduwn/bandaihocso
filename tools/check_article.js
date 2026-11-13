const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('data/clean_pages/ban-tin-thang-12.html', 'utf8');
const $ = cheerio.load(html);
console.log('Title:', $('title').text());
console.log('Entry header:', $('.entry-header').text().trim());
console.log('Content selector:', $('.entry-content').length);
