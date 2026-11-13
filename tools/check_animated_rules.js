const fs = require('fs');
const css = fs.readFileSync('public/wp-content/litespeed/ucss/ce8f914582e96d7fffb52264af08bb2e.css', 'utf8');

const regex = /[^}]*animated[^{]*\{[^}]*\}/gi;
const matches = css.match(regex) || [];
console.log('Animated matches count:', matches.length);
matches.slice(0, 5).forEach(m => console.log(m));
