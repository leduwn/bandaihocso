const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE_URL = 'https://acacvn.com';

function cleanHtml(html) {
  const $ = cheerio.load(html, { decodeEntities: false });

  // 1. Remove unwanted third-party tracking & broken scripts
  $('script').each(function () {
    const $s = $(this);
    const src = $s.attr('src') || '';
    const dSrc = $s.attr('data-src') || '';
    const text = $s.html() || '';
    if (
      src.includes('googletagmanager') ||
      dSrc.includes('googletagmanager') ||
      src.includes('collect.js') ||
      src.includes('why-choose-us.js') ||
      dSrc.includes('why-choose-us.js') ||
      text.includes('gtag(') ||
      text.includes('litespeed_docref') ||
      text.includes('litespeed_ui_events') ||
      text.includes('LITESPEED_JS') ||
      ($s.attr('id') && $s.attr('id').includes('googlesitekit'))
    ) {
      $s.remove();
    }
  });

  $('link[rel="dns-prefetch"], link[rel="preconnect"], link[rel="pingback"], link[rel="EditURI"], link[rel="wlwmanifest"], link[rel="shortlink"]').remove();
  $('link[rel="alternate"][type="application/json"]').remove();

  // 2. Fix LiteSpeed scripts -> normal scripts
  $('script').each(function () {
    const $s = $(this);
    const type = $s.attr('type');
    if (type === 'litespeed/javascript') {
      $s.attr('type', 'text/javascript');
    }
    const dSrc = $s.attr('data-src');
    if (dSrc) {
      $s.attr('src', dSrc);
      $s.removeAttr('data-src');
    }
    let src = $s.attr('src');
    if (src) {
      if (src.startsWith(BASE_URL)) {
        src = src.replace(BASE_URL, '');
        $s.attr('src', src);
      }
    }
    let text = $s.html();
    if (text && text.includes(BASE_URL)) {
      text = text.replace(/https:\/\/acacvn\.com/g, '');
      $s.html(text);
    }
  });

  // 3. Fix iframes (e.g. Google Maps)
  $('iframe').each(function () {
    const $if = $(this);
    const lsSrc = $if.attr('data-litespeed-src') || $if.attr('data-src');
    if (lsSrc) {
      $if.attr('src', lsSrc);
      $if.removeAttr('data-litespeed-src');
      $if.removeAttr('data-src');
    }
  });

  // 4. Fix <style> tags
  $('style').each(function () {
    let css = $(this).html();
    if (css && css.includes('acacvn.com')) {
      css = css.replace(/https?:\/\/acacvn\.com/g, '');
      $(this).html(css);
    }
  });

  // 5. Fix <link> tags
  $('link').each(function () {
    const $l = $(this);
    let href = $l.attr('href');
    if (href) {
      if (href.startsWith(BASE_URL)) {
        href = href.replace(BASE_URL, '');
        $l.attr('href', href);
      } else if (href.includes('use.fontawesome.com/releases/v7.1.0/css/')) {
        const f = href.split('/').pop().split('?')[0];
        $l.attr('href', `/releases/v7.1.0/css/${f}`);
      }
    }
  });

  // 6. Fix <img> tags
  $('img').each(function () {
    const $img = $(this);
    const dSrc = $img.attr('data-src');
    const dSrcset = $img.attr('data-srcset');
    const src = $img.attr('src');

    if (dSrc) {
      $img.attr('src', dSrc);
    } else if (dSrcset) {
      $img.attr('src', dSrcset.split(' ')[0]);
    } else if (src && src.startsWith('data:') && $img.attr('srcset')) {
      $img.attr('src', $img.attr('srcset').split(' ')[0]);
    }

    let finalSrc = $img.attr('src') || '';
    if (finalSrc.startsWith(BASE_URL)) {
      finalSrc = finalSrc.replace(BASE_URL, '');
    } else if (finalSrc.includes('cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/')) {
      const flagName = finalSrc.split('/').pop();
      finalSrc = `/ajax/libs/flag-icon-css/3.5.0/flags/4x3/${flagName}`;
    }
    $img.attr('src', finalSrc);

    $img.removeAttr('data-src');
    $img.removeAttr('data-srcset');
    $img.removeAttr('srcset');
    $img.removeAttr('data-lazy-src');
    $img.removeAttr('data-lazy-srcset');
    $img.removeAttr('sizes');
    $img.removeAttr('data-lazyloaded');
    $img.removeClass('lazy-load-active lazyloading lazyloaded lazy-load');
  });

  // 7. Fix inline styles
  $('[style]').each(function () {
    let style = $(this).attr('style');
    if (style && style.includes('acacvn.com')) {
      style = style.replace(/https?:\/\/acacvn\.com/g, '');
      $(this).attr('style', style);
    }
  });

  // 8. Fix <a> links
  $('a').each(function () {
    const $a = $(this);
    let href = $a.attr('href');
    if (href && href.startsWith(BASE_URL)) {
      href = href.replace(BASE_URL, '') || '/';
      $a.attr('href', href);
    }
  });

  // 9. Fix forms
  $('form.wpcf7-form').each(function () {
    $(this).attr('action', '/api/contact');
    $(this).attr('method', 'POST');
  });

  // 10. Fix html tag class
  $('html').removeClass('loading-site no-js').addClass('js_active js');

  return $.html();
}

async function run() {
  fs.mkdirSync('data/clean_pages', { recursive: true });
  const rawFiles = fs.readdirSync('_raw_site/pages');
  console.log(`Processing ${rawFiles.length} raw pages...`);

  for (const f of rawFiles) {
    if (!f.endsWith('.html')) continue;
    const rawPath = path.join('_raw_site/pages', f);
    const html = fs.readFileSync(rawPath, 'utf8');
    const cleaned = cleanHtml(html);
    fs.writeFileSync(path.join('data/clean_pages', f), cleaned, 'utf8');
  }

  console.log('Done! All clean pages saved to data/clean_pages/');
}

run();
