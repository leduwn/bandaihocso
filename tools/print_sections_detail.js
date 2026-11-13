const fs = require('fs');
const html = fs.readFileSync('_raw_site/pages/index.html', 'utf8');

const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
const main = mainMatch[1];

// Split sections
const sections = main.split(/(?=<section)/i).filter(s => s.trim().startsWith('<section'));

sections.forEach((sec, idx) => {
  const openTag = sec.match(/<section[^>]*>/i)[0];
  const text = sec.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const imgs = [];
  const imgRegex = /(?:src|data-src)=["']([^"']+)["']/gi;
  let m;
  while ((m = imgRegex.exec(sec)) !== null) {
    if (!m[1].startsWith('data:')) imgs.push(m[1]);
  }
  console.log(`\n================ SECTION #${idx + 1} ================`);
  console.log('TAG:', openTag);
  console.log('IMGS:', imgs);
  console.log('TEXT PREVIEW (250 chars):', text.slice(0, 250));
});
