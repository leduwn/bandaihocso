const fs = require('fs');

const html = fs.readFileSync('_raw_site/index.html', 'utf8');

const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
console.log('Title:', titleMatch ? titleMatch[1] : 'None');

// Detect generator/meta
const genMatch = html.match(/<meta name="generator" content="([^"]*)"/i);
console.log('Generator:', genMatch ? genMatch[1] : 'None');

// Check stylesheets
const css = [];
const cssRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;
let m;
while ((m = cssRegex.exec(html)) !== null) {
  css.push(m[1]);
}
console.log('\nStylesheets count:', css.length);
css.slice(0, 10).forEach(c => console.log('CSS:', c));

// Check scripts
const scripts = [];
const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
while ((m = scriptRegex.exec(html)) !== null) {
  scripts.push(m[1]);
}
console.log('\nScripts count:', scripts.length);
scripts.slice(0, 10).forEach(s => console.log('Script:', s));

// Check navigation links
const navLinks = new Set();
const linkRegex = /href=["']([^"'#]+)["']/gi;
while ((m = linkRegex.exec(html)) !== null) {
  const href = m[1];
  if (href.startsWith('https://acacvn.com') || href.startsWith('http://acacvn.com') || href.startsWith('/')) {
    navLinks.add(href);
  }
}
console.log('\nInternal links count:', navLinks.size);
Array.from(navLinks).sort().forEach(l => console.log('Link:', l));
