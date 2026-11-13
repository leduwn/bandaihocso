const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== CSS LINKS ===');
$('link[rel="stylesheet"]').each((i, el) => console.log($(el).attr('href')));

console.log('\n=== HEADER LOGO ===');
console.log($('#logo').html());

console.log('\n=== FOOTER LOGO & INFO ===');
console.log($('footer #logo, footer .logo, footer img[src*="logo"], footer img[src*="Logo"]').map((i, el) => $(el).parent().html()).get());

console.log('\n=== CHATBOT / FLOATING ICONS ===');
$('[class*="chat"], [id*="chat"], img[src*="chat"], [class*="mess"], [class*="hotline"], [class*="zalo"]').each((i, el) => {
  console.log($(el).prop('tagName'), $(el).attr('class'), $(el).attr('id'), $(el).attr('src') || '');
});

console.log('\n=== SERVICES SECTION HTML (FIRST 1000 CHARS) ===');
const serviceSec = $('#dich-vu-section, .section-dich-vu, section:has(h2:contains("DỊCH VỤ")), div:has(h2:contains("DỊCH VỤ"))').first();
console.log('Service section found:', serviceSec.length);
if (serviceSec.length) {
  console.log(serviceSec.html().slice(0, 1000));
} else {
  // Find where "DỊCH VỤ" is
  $(':contains("DỊCH VỤ CỦA CHÚNG TÔI")').slice(0, 3).each((i, el) => {
    console.log(el.tagName, $(el).attr('class'), $(el).text().slice(0, 50));
  });
}

console.log('\n=== FOOTER CONTACT ADDRESS INFO ===');
$('footer .contact-info, footer .col:has(p)').each((i, el) => {
  console.log(`--- Footer col ${i} ---`);
  console.log($(el).html().slice(0, 500));
});
