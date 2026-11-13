const fs = require('fs');
const path = require('path');
const https = require('https');

const fonts = [
  'https://use.fontawesome.com/releases/v7.1.0/webfonts/fa-brands-400.woff2',
  'https://use.fontawesome.com/releases/v7.1.0/webfonts/fa-regular-400.woff2',
  'https://use.fontawesome.com/releases/v7.1.0/webfonts/fa-solid-900.woff2',
  'https://use.fontawesome.com/releases/v7.1.0/webfonts/fa-v4compatibility.woff2'
];

async function run() {
  fs.mkdirSync('public/releases/v7.1.0/webfonts', { recursive: true });
  for (const f of fonts) {
    const fn = path.basename(f);
    const dest = path.join('public/releases/v7.1.0/webfonts', fn);
    console.log('Downloading:', fn);
    await new Promise((resolve) => {
      https.get(f, (res) => {
        const c = [];
        res.on('data', d => c.push(d));
        res.on('end', () => {
          fs.writeFileSync(dest, Buffer.concat(c));
          console.log('Saved:', fn, 'size:', fs.statSync(dest).size);
          resolve();
        });
      });
    });
  }
}
run();
