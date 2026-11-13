const http = require('http');
const cheerio = require('cheerio');

http.get('http://localhost:3000/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const $ = cheerio.load(data);
    console.log('Total HTML length:', data.length);
    console.log('Main children count:', $('#main > *').length);
    $('#main > *').each((i, el) => {
      console.log(`Child ${i}:`, el.tagName, $(el).attr('id') || '', $(el).attr('class') || '');
    });
    console.log('\nSections in main:');
    $('section').each((i, el) => {
      console.log(`Section ${i}: id=${$(el).attr('id')} class="${$(el).attr('class')}" style="${$(el).attr('style') || ''}"`);
    });
  });
});
