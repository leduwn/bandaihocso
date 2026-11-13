const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

const ids = [
  'section_1006456508',
  'section_865356580',
  'section_156873414',
  'section_1415813573',
  'section_380594517',
  'section_1638842805'
];

ids.forEach(id => {
  console.log(`\n================ #${id} ================`);
  const $sec = $(`#${id}`);
  $sec.find('h1, h2, h3, h4, p, a.button, span, img').each((i, el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'img') {
      console.log(`  [IMG] src=${$(el).attr('src')} alt=${$(el).attr('alt') || ''}`);
    } else {
      const txt = $(el).text().replace(/\s+/g, ' ').trim();
      if (txt && $(el).children().length === 0) {
        console.log(`  [${tag.toUpperCase()}] ${txt}`);
      } else if (tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
        if (txt) console.log(`  [${tag.toUpperCase()}] ${txt}`);
      }
    }
  });
});
