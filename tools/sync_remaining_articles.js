const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://acacvn.com';

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 25000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith('/')) loc = BASE_URL + loc;
        return resolve(fetchBuffer(loc));
      }
      if (res.statusCode !== 200) return reject(new Error(`Status ${res.statusCode}`));
      const c = [];
      res.on('data', d => c.push(d));
      res.on('end', () => resolve(Buffer.concat(c)));
    }).on('error', reject);
  });
}

async function main() {
  const sourcePages = [
    '_raw_site/pages/tin-tuc-su-kien.html',
    '_raw_site/pages/co-hoi-nghe-nghiep.html',
    '_raw_site/pages/cac-phan-tich-chuyen-sau__toan-canh-thi-truong.html',
    '_raw_site/pages/index.html'
  ];

  const links = new Set();
  for (const sp of sourcePages) {
    const html = fs.readFileSync(sp, 'utf8');
    const reg = /href=["'](https:\/\/acacvn\.com\/[^"'#?\s]+)["']/gi;
    let m;
    while ((m = reg.exec(html)) !== null) {
      const u = m[1];
      if (!u.includes('/wp-') && !u.includes('/feed')) {
        links.add(u);
      }
    }
  }

  let newPages = [];
  for (const url of links) {
    const sub = url.replace(BASE_URL, '').replace(/^\/+|\/+$/g, '').replace(/\//g, '__') || 'index';
    const dest = `_raw_site/pages/${sub}.html`;
    if (!fs.existsSync(dest)) {
      console.log('Downloading missing page:', sub);
      try {
        const buf = await fetchBuffer(url);
        const html = buf.toString('utf8');
        fs.writeFileSync(dest, html, 'utf8');
        newPages.push(html);
      } catch (e) {
        console.log('Skip:', url, e.message);
      }
    }
  }

  // Also download any new assets from those pages
  const assets = new Set();
  for (const html of newPages) {
    const reg = /(?:src|data-src|href)=["']([^"'\s]+\.(?:png|jpe?g|webp|svg|gif|css|js)(?:\?[^"']*)?)["']/gi;
    let m;
    while ((m = reg.exec(html)) !== null) {
      let u = m[1];
      if (u.startsWith('data:')) continue;
      if (u.startsWith('//')) u = 'https:' + u;
      else if (u.startsWith('/')) u = BASE_URL + u;
      if (u.startsWith('http')) assets.add(u);
    }
  }

  for (const a of assets) {
    try {
      const u = new URL(a);
      const dest = path.join('public', u.pathname).replace(/\\/g, '/');
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        console.log('Downloading missing asset:', u.pathname);
        const buf = await fetchBuffer(a);
        fs.writeFileSync(dest, buf);
      }
    } catch (e) {}
  }
  console.log('Done syncing remaining articles!');
}

main();
