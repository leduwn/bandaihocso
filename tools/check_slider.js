const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('Slider section:');
const $slider = $('.khung-slider-chinh');
console.log('Found slider:', $slider.length);
console.log('Classes inside slider:', $slider.find('*').map((i, el) => $(el).attr('class')).get().slice(0, 15));

console.log('\nFlickity elements:');
console.log($('[data-flickity-options]').map((i, el) => $(el).attr('data-flickity-options')).get());
console.log('\nSlider banners:');
console.log($('.banner').map((i, el) => ({ id: $(el).attr('id'), class: $(el).attr('class') })).get());
