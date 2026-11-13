const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BASE_URL = 'https://acacvn.com';

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    let client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      timeout: 30000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const u = new URL(url);
          redirectUrl = `${u.protocol}//${u.host}${redirectUrl}`;
        }
        return resolve(fetchBuffer(redirectUrl));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout for ${url}`));
    });
  });
}

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
    return; // Already downloaded
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  try {
    const buf = await fetchBuffer(url);
    fs.writeFileSync(destPath, buf);
  } catch (err) {
    console.error(`[Error downloading] ${url}: ${err.message}`);
  }
}

const SEED_PAGES = [
  '/',
  '/gioi-thieu/',
  '/dich-vu-cua-chung-toi/',
  '/dich-vu-cua-chung-toi/dich-vu-tu-van-thue-va-dai-ly-thue/',
  '/dich-vu-cua-chung-toi/dich-vu-kiem-toan/',
  '/dich-vu-cua-chung-toi/dich-vu-ke-toan/',
  '/dich-vu-cua-chung-toi/tu-van-tai-chinh-doanh-nghiep/',
  '/dich-vu-cua-chung-toi/tu-van-giai-phap-quan-ly/',
  '/dich-vu-cua-chung-toi/tu-van-va-dai-ly-hai-quan/',
  '/dich-vu-cua-chung-toi/tu-van-phap-luat-va-kinh-doanh/',
  '/dich-vu-cua-chung-toi/dich-vu-tu-van-esg/',
  '/dich-vu-cua-chung-toi/dich-vu-dao-tao/',
  '/cac-phan-tich-chuyen-sau/',
  '/cac-phan-tich-chuyen-sau/ban-tin-thue-va-tai-chinh/',
  '/cac-phan-tich-chuyen-sau/toan-canh-thi-truong/',
  '/co-hoi-nghe-nghiep/',
  '/tin-tuc-su-kien/',
  '/lien-he/'
];

async function main() {
  console.log('=== Step 1: Downloading core pages ===');
  fs.mkdirSync('_raw_site/pages', { recursive: true });
  const allHtmls = [];
  const articleUrls = new Set();

  for (const pagePath of SEED_PAGES) {
    const fullUrl = `${BASE_URL}${pagePath}`;
    console.log(`Fetching page: ${pagePath}`);
    let slug = pagePath.replace(/^\/+|\/+$/g, '').replace(/\//g, '__') || 'index';
    const filePath = `_raw_site/pages/${slug}.html`;

    try {
      const buf = await fetchBuffer(fullUrl);
      const html = buf.toString('utf8');
      fs.writeFileSync(filePath, html, 'utf8');
      allHtmls.push(html);

      // Find article links
      const linkRegex = /href=["'](https:\/\/acacvn\.com\/[^"'#\s?]+|\/[^"'#\s?]+)["']/gi;
      let m;
      while ((m = linkRegex.exec(html)) !== null) {
        let u = m[1];
        if (u.startsWith('/')) u = BASE_URL + u;
        if (u.startsWith(BASE_URL) && !u.includes('/wp-') && !u.includes('/feed') && !SEED_PAGES.some(sp => (BASE_URL + sp) === u || (BASE_URL + sp + '/') === u)) {
          articleUrls.add(u);
        }
      }
    } catch (err) {
      console.error(`Error fetching ${pagePath}: ${err.message}`);
    }
  }

  console.log(`\nFound ${articleUrls.size} article / subpage links.`);
  // Download top 30 important articles/posts (tax news, market insights, recruitment, news)
  const articlesToFetch = Array.from(articleUrls).slice(0, 35);
  for (const artUrl of articlesToFetch) {
    const subPath = artUrl.replace(BASE_URL, '');
    let slug = subPath.replace(/^\/+|\/+$/g, '').replace(/\//g, '__') || 'subpage';
    console.log(`Fetching article/subpage: ${subPath}`);
    try {
      const buf = await fetchBuffer(artUrl);
      const html = buf.toString('utf8');
      fs.writeFileSync(`_raw_site/pages/${slug}.html`, html, 'utf8');
      allHtmls.push(html);
    } catch (e) {
      console.error(`Error fetching article ${artUrl}: ${e.message}`);
    }
  }

  console.log('\n=== Step 2: Extracting all assets (images, css, js, fonts) ===');
  const allAssets = new Set();

  for (const html of allHtmls) {
    // Images in src, data-src, srcset, data-srcset
    const imgRegex = /(?:src|data-src|srcset|data-srcset)=["']([^"'\s]+)[^"']*["']/gi;
    let m;
    while ((m = imgRegex.exec(html)) !== null) {
      let u = m[1];
      if (u.startsWith('data:')) continue;
      if (u.startsWith('//')) u = 'https:' + u;
      else if (u.startsWith('/')) u = BASE_URL + u;
      if (u.match(/\.(png|jpe?g|gif|svg|webp|ico)(\?.*)?$/i)) {
        allAssets.add(u);
      }
    }

    // CSS files
    const cssRegex = /href=["']([^"']+\.css[^"']*)["']/gi;
    while ((m = cssRegex.exec(html)) !== null) {
      let u = m[1];
      if (u.startsWith('//')) u = 'https:' + u;
      else if (u.startsWith('/')) u = BASE_URL + u;
      allAssets.add(u);
    }

    // JS files
    const jsRegex = /src=["']([^"']+\.js[^"']*)["']/gi;
    while ((m = jsRegex.exec(html)) !== null) {
      let u = m[1];
      if (u.startsWith('//')) u = 'https:' + u;
      else if (u.startsWith('/')) u = BASE_URL + u;
      allAssets.add(u);
    }

    // Inline url(...)
    const urlRegex = /url\(["']?([^"')]+)["']?\)/gi;
    while ((m = urlRegex.exec(html)) !== null) {
      let u = m[1].trim();
      if (u.startsWith('data:')) continue;
      if (u.startsWith('//')) u = 'https:' + u;
      else if (u.startsWith('/')) u = BASE_URL + u;
      allAssets.add(u);
    }
  }

  console.log(`Total unique assets discovered: ${allAssets.size}`);

  console.log('\n=== Step 3: Downloading assets into public/ directory ===');
  let count = 0;
  for (const assetUrl of allAssets) {
    count++;
    try {
      const u = new URL(assetUrl);
      let localPath = path.join('public', u.pathname);
      // Clean up path
      localPath = localPath.replace(/\\/g, '/');
      console.log(`[${count}/${allAssets.size}] Downloading: ${u.pathname}`);
      await downloadFile(assetUrl, localPath);
    } catch (e) {
      console.error(`Invalid asset URL ${assetUrl}: ${e.message}`);
    }
  }

  // Also download the Flatsome icon fonts specifically
  const fontUrls = [
    'https://acacvn.com/wp-content/themes/flatsome/assets/css/icons/fl-icons.woff2?v=3.19.7',
    'https://acacvn.com/wp-content/themes/flatsome/assets/css/icons/fl-icons.woff?v=3.19.7',
    'https://acacvn.com/wp-content/themes/flatsome/assets/css/icons/fl-icons.ttf?v=3.19.7',
    'https://use.fontawesome.com/releases/v7.1.0/css/all.css',
    'https://use.fontawesome.com/releases/v7.1.0/css/v4-shims.css'
  ];
  for (const fu of fontUrls) {
    try {
      const u = new URL(fu);
      const localPath = path.join('public', u.pathname).replace(/\\/g, '/');
      console.log(`Downloading font/icon: ${u.pathname}`);
      await downloadFile(fu, localPath);
    } catch (e) {
      console.error(e.message);
    }
  }

  console.log('\n=== Complete! All pages and assets synced. ===');
}

main().catch(console.error);
