const cheerio = require('cheerio');

const pages = ['/gioi-thieu/', '/dich-vu-cua-chung-toi/', '/tin-tuc-su-kien/', '/lien-he/'];

async function run() {
  for (const p of pages) {
    const res = await fetch('http://localhost:3000' + p);
    const html = await res.text();
    const $ = cheerio.load(html);
    const animCount = $('[data-animate]').length;
    const h1Count = $('h1').length;
    const title = $('title').text();
    console.log(`Page: ${p} | title: "${title}" | [data-animate]: ${animCount} | h1: ${h1Count}`);
  }
}
run();
