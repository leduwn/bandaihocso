const fs = require('fs');

const html = fs.readFileSync('_raw_site/pages/index.html', 'utf8');

// Extract header
const headerMatch = html.match(/<header[\s\S]*?<\/header>/i);
console.log('=== HEADER ===');
console.log('Has header:', !!headerMatch, 'length:', headerMatch ? headerMatch[0].length : 0);

// Extract main
const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
console.log('=== MAIN ===');
console.log('Has main:', !!mainMatch, 'length:', mainMatch ? mainMatch[0].length : 0);

// Extract footer
const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
console.log('=== FOOTER ===');
console.log('Has footer:', !!footerMatch, 'length:', footerMatch ? footerMatch[0].length : 0);

// Check inline scripts for custom behavior (sliders, tabs, counters, forms)
const scriptMatches = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi) || [];
console.log('\nInline scripts:', scriptMatches.length);
scriptMatches.forEach((s, i) => {
  if (s.length > 50 && !s.includes('litespeed')) {
    console.log(`--- Script #${i} (len ${s.length}) ---`);
    console.log(s.slice(0, 300));
  }
});
