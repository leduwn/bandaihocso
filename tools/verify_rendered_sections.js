const http = require('http');
const cheerio = require('cheerio');

http.get('http://localhost:3000/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const $ = cheerio.load(data);
    console.log('Homepage HTTP status:', res.statusCode);
    console.log('Remaining data-animate elements:', $('[data-animate]').length);

    console.log('\n--- Section 3 (Về CMCU) ---');
    console.log('Heading:', $('#text-1746365312 h1').text());
    console.log('Intro text:', $('#text-428433913 p').text().slice(0, 100));
    console.log('Image src:', $('#section_865356580 img').attr('src'));

    console.log('\n--- Section 6 (Dịch vụ / Trụ cột) ---');
    console.log('Section title:', $('#section_466373946 h2').first().text());
    const cards = $('#section_466373946 .imgbox-dv');
    console.log('Total desktop cards count:', cards.length);
    cards.each((i, c) => {
      console.log(`  Card ${i}: "${$(c).find('h4').text()}" (link: ${$(c).find('a').attr('href')})`);
    });

    console.log('\n--- Section 10 (Điều khác biệt) ---');
    console.log('Heading:', $('#section_380594517 h2').text());

    console.log('\n--- Section 13 (Tin tức) ---');
    console.log('Heading:', $('#section_1638842805 h4').text());
  });
});
