const fs = require('fs');
const http = require('http');
const cheerio = require('cheerio');

function checkUrl(path) {
  return new Promise((resolve) => {
    http.get({ hostname: 'localhost', port: 3000, path }, (res) => {
      res.resume();
      resolve({ path, status: res.statusCode });
    }).on('error', () => resolve({ path, status: 0 }));
  });
}

async function run() {
  const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
  const $ = cheerio.load(html);
  const paths = new Set();

  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src && src.startsWith('/')) paths.add(src);
  });
  $('link[rel="stylesheet"][href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.startsWith('/')) paths.add(href);
  });
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src && src.startsWith('/')) paths.add(src);
  });

  console.log(`Checking ${paths.size} local assets on Homepage...`);
  let broken = [];
  for (const p of paths) {
    const res = await checkUrl(p);
    if (res.status !== 200) {
      broken.push(res);
    }
  }
  console.log(`Broken assets count: ${broken.length}`);
  if (broken.length > 0) {
    console.log(broken);
  } else {
    console.log('100% of homepage local CSS, JS, and Images returned HTTP 200 OK!');
  }
}

run();
