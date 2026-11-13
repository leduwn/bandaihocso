const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
      },
      timeout: 30000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const u = new URL(url);
          redirectUrl = `${u.protocol}//${u.host}${redirectUrl}`;
        }
        return resolve(fetchUrl(redirectUrl));
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

async function main() {
  const visited = new Set();
  const queue = ['https://acacvn.com/'];
  const allPages = new Map();
  const allAssets = new Set();

  console.log('Discovering pages and assets...');

  while (queue.length > 0) {
    const currentUrl = queue.shift();
    const cleanUrl = currentUrl.replace(/#.*$/, '').replace(/\/$/, '') + '/';
    if (visited.has(cleanUrl)) continue;
    visited.add(cleanUrl);

    console.log(`[Crawling page] ${cleanUrl}`);
    try {
      const buffer = await fetchUrl(cleanUrl);
      const html = buffer.toString('utf8');
      allPages.set(cleanUrl, html);

      // Extract links
      const linkRegex = /href=["']([^"'#\s]+)["']/gi;
      let m;
      while ((m = linkRegex.exec(html)) !== null) {
        let target = m[1];
        if (target.startsWith('/')) {
          target = 'https://acacvn.com' + target;
        }
        if (target.startsWith('https://acacvn.com') || target.startsWith('http://acacvn.com')) {
          // Check if asset
          if (target.match(/\.(css|js|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot)(\?.*)?$/i)) {
            allAssets.add(target);
          } else if (!target.includes('/feed') && !target.includes('wp-json') && !target.includes('wp-admin') && !target.includes('wp-login')) {
            const cleanTarget = target.replace(/#.*$/, '').replace(/\/$/, '') + '/';
            if (!visited.has(cleanTarget) && !queue.includes(cleanTarget)) {
              queue.push(cleanTarget);
            }
          }
        } else if (target.startsWith('http')) {
          // external link
        }
      }

      // Extract script src, img src, link href, background-image
      const srcRegex = /(?:src|href|data-src|srcset)=["']([^"'\s,]+)["']/gi;
      while ((m = srcRegex.exec(html)) !== null) {
        let assetUrl = m[1];
        if (assetUrl.startsWith('//')) {
          assetUrl = 'https:' + assetUrl;
        } else if (assetUrl.startsWith('/')) {
          assetUrl = 'https://acacvn.com' + assetUrl;
        }
        if (assetUrl.match(/\.(css|js|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot)(\?.*)?$/i)) {
          allAssets.add(assetUrl);
        }
      }

      // Extract css url(...)
      const cssUrlRegex = /url\(["']?([^"')]+)["']?\)/gi;
      while ((m = cssUrlRegex.exec(html)) !== null) {
        let u = m[1];
        if (u.startsWith('data:')) continue;
        if (u.startsWith('//')) u = 'https:' + u;
        else if (u.startsWith('/')) u = 'https://acacvn.com' + u;
        if (u.match(/\.(css|js|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot)(\?.*)?$/i)) {
          allAssets.add(u);
        }
      }
    } catch (err) {
      console.error(`Failed ${cleanUrl}: ${err.message}`);
    }
  }

  console.log(`\nFound ${allPages.size} pages, ${allAssets.size} assets.`);

  // Save pages index
  const pagesList = Array.from(allPages.keys());
  fs.writeFileSync('_raw_site/pages.json', JSON.stringify(pagesList, null, 2));

  // Save each page raw
  fs.mkdirSync('_raw_site/pages', { recursive: true });
  for (const [url, html] of allPages.entries()) {
    let slug = url.replace('https://acacvn.com', '').replace(/^\/+|\/+$/g, '').replace(/\//g, '__');
    if (!slug) slug = 'index';
    fs.writeFileSync(`_raw_site/pages/${slug}.html`, html, 'utf8');
  }

  // Also crawl CSS files to find additional fonts/images referenced inside CSS
  console.log('\nScanning CSS files for embedded fonts/images...');
  const cssAssets = Array.from(allAssets).filter(a => a.match(/\.css(\?.*)?$/i));
  for (const cssUrl of cssAssets) {
    try {
      const buf = await fetchUrl(cssUrl);
      const cssText = buf.toString('utf8');
      const cssUrlRegex = /url\(["']?([^"')]+)["']?\)/gi;
      let m;
      while ((m = cssUrlRegex.exec(cssText)) !== null) {
        let u = m[1].trim();
        if (u.startsWith('data:') || !u) continue;
        let resolved = u;
        if (resolved.startsWith('//')) {
          resolved = 'https:' + resolved;
        } else if (resolved.startsWith('/')) {
          resolved = 'https://acacvn.com' + resolved;
        } else if (!resolved.startsWith('http')) {
          const base = cssUrl.split('?')[0].substring(0, cssUrl.split('?')[0].lastIndexOf('/') + 1);
          resolved = new URL(resolved, base).toString();
        }
        allAssets.add(resolved);
      }
    } catch (e) {
      // ignore
    }
  }

  fs.writeFileSync('_raw_site/assets.json', JSON.stringify(Array.from(allAssets), null, 2));
  console.log(`Final total assets to download: ${allAssets.size}`);
}

main().catch(console.error);
