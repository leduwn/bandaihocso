const fs = require('fs');
const css = fs.readFileSync('public/wp-content/litespeed/ucss/ce8f914582e96d7fffb52264af08bb2e.css', 'utf8');

function findRules(keyword) {
  const regex = new RegExp(`[^}]*${keyword}[^{]*\\{[^}]*\\}`, 'gi');
  const matches = css.match(regex) || [];
  console.log(`\n=== Matches for ${keyword} (${matches.length}) ===`);
  matches.slice(0, 10).forEach(m => console.log(m));
}

findRules('imgbox-dv');
findRules('service-content');
findRules('contact-info');
findRules('section-footer');
findRules('e9bd42|e2bd3f|0a2453|143f78|0c356a');
