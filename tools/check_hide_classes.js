const fs = require('fs');
const css = fs.readFileSync('public/wp-content/litespeed/ucss/ce8f914582e96d7fffb52264af08bb2e.css', 'utf8');

const regex = /[^}]*hide-for-[^{]*\{[^}]*\}/gi;
console.log('Hide matches:', css.match(regex));
