const fs = require('fs');

const html = fs.readFileSync('_raw_site/index.html', 'utf8');

// Extract inline CSS variables & main colors/fonts
const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
console.log('Inline <style> blocks:', styleMatches.length);
styleMatches.forEach((s, idx) => {
  const idMatch = s.match(/id=["']([^"']+)["']/i);
  console.log(`Style #${idx}: id=${idMatch ? idMatch[1] : 'none'}, len=${s.length}`);
});

// Extract custom CSS / root vars
const rootVars = html.match(/:root\s*\{[^}]+\}/gi) || [];
console.log('\n:root blocks found:', rootVars.length);
rootVars.slice(0, 5).forEach(r => console.log(r.slice(0, 600)));

// Extract all images on homepage
const imgs = [];
const imgRegex = /<img[^>]+>/gi;
let m;
while ((m = imgRegex.exec(html)) !== null) {
  const tag = m[0];
  const src = (tag.match(/src=["']([^"']+)["']/i) || [])[1] || '';
  const alt = (tag.match(/alt=["']([^"']*)["']/i) || [])[1] || '';
  imgs.push({ src, alt });
}
console.log('\nHomepage <img> tags:', imgs.length);
imgs.forEach((i, idx) => console.log(`${idx + 1}. ${i.src} | alt="${i.alt}"`));

// Extract header/menu structure
const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
if (headerMatch) {
  console.log('\nHeader length:', headerMatch[1].length);
  const navLinks = [];
  const aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = aRegex.exec(headerMatch[1])) !== null) {
    const text = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text) navLinks.push({ text, href: m[1] });
  }
  console.log('Header links:', JSON.stringify(navLinks, null, 2));
}

// Extract section structure inside #main
const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
if (mainMatch) {
  const mainHtml = mainMatch[1];
  console.log('\nMain content length:', mainHtml.length);
  const sections = mainHtml.match(/<section[^>]*class=["']([^"']*)["'][^>]*id=["']([^"']*)["']|<section[^>]*id=["']([^"']*)["']|<section[^>]*class=["']([^"']*)["']/gi) || [];
  console.log('Sections in main:', sections);
}
