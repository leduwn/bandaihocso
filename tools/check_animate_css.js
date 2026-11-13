const fs = require('fs');
const css = fs.readFileSync('public/wp-content/litespeed/ucss/ce8f914582e96d7fffb52264af08bb2e.css', 'utf8');

const regex = /[^}]*data-animate[^{]*\{[^}]*\}/gi;
const matches = css.match(regex) || [];
console.log('Matches:', matches);
