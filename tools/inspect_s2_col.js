const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('data/clean_pages/index.html', 'utf8'));

console.log('HTML in col-1087952288:');
console.log($('#col-1087952288').html());
