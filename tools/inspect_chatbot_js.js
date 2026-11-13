const fs = require('fs');
const js = fs.readFileSync('public/wp-content/litespeed/js/b4c658ca0b5f61149b1ce9756d636cfd.js', 'utf8');
const idx = js.indexOf('ACACChatbotConfig');
console.log('Position:', idx);
if (idx !== -1) {
  console.log(js.slice(idx - 200, idx + 800));
}
