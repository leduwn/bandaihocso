const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const targetImages = [
  {
    url: 'https://cmcu.edu.vn/wp-content/uploads/2026/11/Sinh-vien-CMCU-san-sang-cho-Hoc-ky-On-job-Training-2-e1794388548366-1024x577.jpg',
    dest: 'public/uploads/cmcu-hero-ojt.jpg'
  },
  {
    url: 'https://cmcu.edu.vn/wp-content/uploads/2026/11/Toa-dam-He-sinh-thai-hoc-tap-AI-Native-Kham-pha-cach-hoc-moi-thumb-1024x576.jpg',
    dest: 'public/uploads/cmcu-ai-native.jpg'
  },
  {
    url: 'https://cmcu.edu.vn/wp-content/uploads/2026/08/cam-nang-nhap-hoc-cmc.jpg',
    dest: 'public/uploads/cmcu-campus-life.jpg'
  },
  {
    url: 'https://cmcu.edu.vn/wp-content/uploads/2026/11/Talkshow-Navigating-the-AI-Era-Understanding-Consumers-Mastering-Communication-Shaping-Careers-truong-dai-hoc-cmc-11-1024x576.jpg',
    dest: 'public/uploads/cmcu-ai-era.jpg'
  },
  {
    url: 'https://cmcu.edu.vn/wp-content/uploads/2026/11/Truong-Dai-hoc-CMC-lam-viec-voi-Dai-hoc-Southern-Queensland-2-e1794277594751-1024x577.jpg',
    dest: 'public/uploads/cmcu-intl-collab.jpg'
  },
  {
    url: 'https://cmcu.edu.vn/wp-content/uploads/2025/02/phuong-thuc-tuyen-sinh-nam-2025-truong-dai-hoc-cmc.webp',
    dest: 'public/uploads/cmcu-admissions.webp'
  },
  {
    url: 'https://cmcu.edu.vn/wp-content/uploads/2024/03/logo-CMC-Uni-xanh-ngang-400x71.png',
    dest: 'public/uploads/cmcu-brand-horizontal.png'
  }
];

function download(url, dest) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000, rejectUnauthorized: false }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        return download(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('Downloaded:', dest, `(${fs.statSync(dest).size} bytes)`);
          resolve(true);
        });
      } else {
        file.close();
        try { fs.unlinkSync(dest); } catch(e){}
        console.log('Failed:', url, res.statusCode);
        resolve(false);
      }
    }).on('error', (err) => {
      file.close();
      try { fs.unlinkSync(dest); } catch(e){}
      console.log('Error downloading:', url, err.message);
      resolve(false);
    });
  });
}

async function run() {
  for (const item of targetImages) {
    await download(item.url, item.dest);
  }
  console.log('Done downloading CMCU assets.');
}

run();
