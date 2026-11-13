const fs = require('fs');
const html = fs.readFileSync('data/clean_pages/index.html', 'utf8');
const matches = html.match(/<script[^>]*src=["'][^"']*chat[^"']*["'][^>]*><\/script>/gi) || [];
console.log('Chatbot script tags with src:', matches);

// Check for any tag mentioning chat or bot
const $ = require('cheerio').load(html);
$('script[src*="chat"], link[href*="chat"]').each((i, el) => {
  console.log(el.tagName, $(el).attr('src') || $(el).attr('href'));
});

// Check for broken images: images with src that might not exist or broken icon in bottom-left
console.log('\nChecking all images in clean_pages/index.html:');
const broken = [];
$('img').each((i, el) => {
  const src = $(el).attr('src');
  if (src && !src.startsWith('data:') && !src.startsWith('http')) {
    const cleanSrc = src.split('?')[0];
    const localPath = 'public' + (cleanSrc.startsWith('/') ? cleanSrc : '/' + cleanSrc);
    if (!fs.existsSync(localPath)) {
      broken.push({ id: $(el).attr('data-cms-id'), src, localPath });
    }
  }
});
console.log('Broken local images:', broken);
