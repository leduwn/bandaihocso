const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('_raw_site/cmcu_home.html', 'utf8');
const $ = cheerio.load(html);

console.log('Title:', $('title').text());

// Logos
const logos = [];
$('img[src*="logo"], img[alt*="logo" i], .logo img, header img').each((i, el) => {
  logos.push({ src: $(el).attr('src'), alt: $(el).attr('alt') });
});
console.log('\nLogos found on CMCU:', logos.slice(0, 10));

// Search for colors in CSS or style
const styles = $('style').text();
const hexColors = styles.match(/#[0-9a-fA-F]{6}\b/g) || [];
const colorCounts = {};
hexColors.forEach(c => colorCounts[c.toLowerCase()] = (colorCounts[c.toLowerCase()] || 0) + 1);
const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
console.log('\nTop colors in CMCU CSS:', sortedColors.slice(0, 10));

// Find nav menu items
console.log('\nMenu items:');
$('nav a, header a').slice(0, 20).each((i, el) => {
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  if (text) console.log('-', text);
});
