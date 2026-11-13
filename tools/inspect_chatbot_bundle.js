const fs = require('fs');
const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');

const idx = html.indexOf('acac-chatbot-widget-js-extra');
if (idx !== -1) {
  console.log(html.slice(idx - 100, idx + 800));
}
