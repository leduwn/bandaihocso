const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { db } = require('./db');

const PAGES_DIR = path.join(__dirname, '..', 'data', 'clean_pages');

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}

function resolveHtmlFile(requestPath) {
  let cleanPath = (requestPath || '/').split('?')[0].replace(/^\/+|\/+$/g, '');
  if (!cleanPath) cleanPath = 'index';

  const slug = cleanPath.replace(/\//g, '__');
  let filePath = path.join(PAGES_DIR, `${slug}.html`);
  if (fs.existsSync(filePath)) return { slug, filePath };

  if (cleanPath.startsWith('dich-vu-cua-chung-toi/')) {
    const fallbackServiceFile = path.join(PAGES_DIR, 'dich-vu-cua-chung-toi__dich-vu-dao-tao.html');
    if (fs.existsSync(fallbackServiceFile)) {
      return { slug, filePath: fallbackServiceFile };
    }
  }

  return { slug: 'index', filePath: path.join(PAGES_DIR, 'index.html') };
}

function tagCmsElements($) {
  let imgIdx = 0;
  $('img').each(function () {
    const $el = $(this);
    if (!$el.closest('#acac-live-bar, #acac-img-modal, .cmcu-dual-brand-logo, .cmcu-floating-contact').length) {
      $el.attr('data-cms-id', `img-${imgIdx++}`);
    }
  });

  let txtIdx = 0;
  const textSelector = 'h1, h2, h3, h4, h5, h6, p, .col-title, .banner-layers span, a.button, .nav-top-link, .sub-menu a';
  $(textSelector).each(function () {
    const $el = $(this);
    if ($el.closest('#acac-live-bar, #acac-img-modal, script, style, .cmcu-dual-brand-logo, .cmcu-floating-contact').length) return;
    if ($el.find('h1, h2, h3, h4, h5, h6, p').length > 0) return;
    const text = $el.text().replace(/\s+/g, ' ').trim();
    if (!text && $el.find('img').length > 0) return;
    if (!text) return;

    $el.attr('data-cms-id', `txt-${txtIdx++}`);
  });
}

function extractPageElements(slug) {
  const filePath = path.join(PAGES_DIR, `${slug}.html`);
  if (!fs.existsSync(filePath)) return { texts: [], images: [] };

  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });
  tagCmsElements($);

  const edits = db.prepare('SELECT element_id, content_type, content_value FROM page_edits WHERE page_slug = ?').all(slug);
  const editMap = new Map();
  for (const e of edits) {
    editMap.set(e.element_id, e);
  }

  const images = [];
  $('[data-cms-id^="img-"]').each(function () {
    const $el = $(this);
    const id = $el.attr('data-cms-id');
    const currentSrc = editMap.has(id) ? editMap.get(id).content_value : ($el.attr('src') || '');
    const alt = $el.attr('alt') || '';
    const section = $el.closest('header').length ? 'Header' : ($el.closest('footer').length ? 'Footer' : 'Nội dung trang');
    images.push({ id, src: currentSrc, alt, section });
  });

  const texts = [];
  $('[data-cms-id^="txt-"]').each(function () {
    const $el = $(this);
    const id = $el.attr('data-cms-id');
    const currentHtml = editMap.has(id) ? editMap.get(id).content_value : $el.html().trim();
    const currentText = cheerio.load(`<div>${currentHtml}</div>`)('div').text().replace(/\s+/g, ' ').trim();
    const tag = this.tagName.toLowerCase();
    const section = $el.closest('header').length ? 'Header' : ($el.closest('footer').length ? 'Footer' : 'Nội dung trang');
    texts.push({ id, tag, text: currentText, html: currentHtml, section });
  });

  return { texts, images };
}

function renderPage(requestPath, req) {
  const { slug, filePath } = resolveHtmlFile(requestPath);
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });
  const settings = getSettings();

  // Strip all data-animate attributes so Flatsome UCSS never hides elements with opacity: 0
  $('[data-animate]').removeAttr('data-animate');

  // 1. Inject CMCU Brand Stylesheet & Favicon
  $('head').append('<link rel="stylesheet" href="/cmcu-brand.css">');
  $('link[rel*="icon"]').attr('href', '/uploads/ban-dai-hoc-so-logo.png');

  // Update Page Title & Meta Tags
  if (slug === 'index') {
    $('title').text('Trường Đại học CMC - Ban Đại học số CMC | Đại học AI đầu tiên tại Việt Nam');
  } else {
    const currentTitle = $('title').text();
    $('title').text(`${currentTitle.replace(/ACAC/g, 'CMC')} | Trường Đại học CMC - Ban Đại học số`);
  }
  const pageTitle = $('title').text();
  const defaultDesc = 'Trường Đại học CMC - Ban Đại học số CMC | Mô hình Đại học AI đầu tiên tại Việt Nam – Đào tạo gắn liền công nghệ và doanh nghiệp toàn cầu.';
  $('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').attr('content', defaultDesc);
  $('meta[property="og:title"], meta[name="twitter:title"]').attr('content', pageTitle);
  $('meta[property="og:site_name"]').attr('content', 'Trường Đại học CMC - Ban Đại học số CMC');
  $('meta[property="og:url"]').attr('content', requestPath || '/');
  $('meta[property="og:image"], meta[property="og:image:secure_url"], meta[name="twitter:image"]').attr('content', '/uploads/cmcu-brand-horizontal.png');

  // 2. Composite Header Logo (CMCU + | + Ban Đại học số)
  const headerLogoHtml = `
    <a href="/" title="Trường Đại học CMC & Ban Đại học số CMC" rel="home">
      <div class="cmcu-dual-brand-logo">
        <img src="/uploads/cmcu-logo-blue.png" class="logo-cmcu" alt="Trường Đại học CMC">
        <span class="logo-sep"></span>
        <div class="logo-bds-group">
          <img src="/uploads/ban-dai-hoc-so-logo-clean.png" class="logo-bds-img" alt="Ban Đại học số CMC">
        </div>
      </div>
    </a>
  `;
  $('#logo').html(headerLogoHtml);

  // 3. Navigation Menu Items Rebranding & Single-Row Unified Header (#masthead)
  $('.header-nav a, .mobile-nav a, #main-menu a').each(function () {
    const $a = $(this);
    const text = $a.text().trim();
    if (text === 'Về ACAC') $a.text('Về CMC & CMCU');
    if (text === 'Dịch vụ') {
      if ($a.find('.icon-angle-down').length) {
        $a.html('Đào tạo &amp; Chuyển đổi số <i class="icon-angle-down"></i>');
      } else {
        $a.text('Đào tạo & Chuyển đổi số');
      }
    }
    if (text === 'Cơ hội nghề nghiệp') $a.text('Tuyển sinh & Học bổng');
    if (text === 'Tin Tức & Sự kiện' || text === 'Tin Tức & Sự Kiện') $a.text('Tin tức & Sự kiện');
    if (text.includes('LIÊN HỆ NGAY')) {
      $a.html('Xét tuyển Online <span class="cta-arrow">↗</span>');
      $a.attr('href', '/lien-he/');
    }
  });

  // Clean leftover ACAC ESG badge & search action
  $('.logo-esg').remove();
  $('form[action*="acacvn.com"]').attr('action', '/');

  // Rebrand sub-menu service items in desktop header & mobile drawer dropdowns
  const servicesInDb = db.prepare('SELECT slug, title FROM services ORDER BY order_num ASC').all();
  if (servicesInDb.length > 0) {
    const submenuHtml = servicesInDb.map(s => `
      <li class="menu-item"><a href="/dich-vu-cua-chung-toi/${s.slug}/">${s.title}</a></li>
    `).join('');
    const $desktopSubmenu = $('.header-bottom-nav #menu-item-1315 .sub-menu').length
      ? $('.header-bottom-nav #menu-item-1315 .sub-menu')
      : $('.header-bottom-nav .sub-menu').first();
    if ($desktopSubmenu.length) {
      $desktopSubmenu.html(submenuHtml);
    }
    const $mobileSubmenu = $('#main-menu .menu-item-1315 .sub-menu').length
      ? $('#main-menu .menu-item-1315 .sub-menu')
      : $('#main-menu .sub-menu').first();
    if ($mobileSubmenu.length) {
      $mobileSubmenu.html(submenuHtml);
    }
  }

  // Move only real desktop menu-item links into #masthead single-row white navbar (matching reference mockup)
  $('#masthead .header-inner').removeClass('medium-logo-center');
  const $wideNavItems = $('#wide-nav ul.nav-left > li.menu-item').filter(function () {
    const id = $(this).attr('id') || '';
    const href = $(this).find('> a').attr('href') || '';
    const txt = $(this).find('> a').text().trim();
    if (id === 'menu-item-1277' || (href === '/' && txt === 'Trang chủ')) return false;
    return true;
  }).clone();

  const $mastheadLeftUl = $('#masthead .header-nav-main.nav-left');
  if ($mastheadLeftUl.length && $wideNavItems.length) {
    $mastheadLeftUl.removeClass('nav-size-xlarge nav-spacing-xlarge nav-uppercase').addClass('header-bottom-nav cmcu-main-nav');
    $mastheadLeftUl.html($wideNavItems);
  }

  // Show VI label on language switcher & place single rounded CTA pill in #masthead right nav
  $('#acac-current-label').text('VI');
  const $mastheadRightUl = $('#masthead .header-nav-main.nav-right');
  if ($mastheadRightUl.length) {
    $mastheadRightUl.removeClass('nav-size-xlarge nav-spacing-xlarge nav-uppercase');
    const $searchLi = $mastheadRightUl.find('#btn-open-search').closest('li');
    const $langLi = $mastheadRightUl.find('#acac-lang-menu').closest('li');
    if ($searchLi.length && $langLi.length) {
      $searchLi.insertBefore($langLi);
    }
    $mastheadRightUl.find('.header-cta-item').remove();
    $mastheadRightUl.append(`
      <li class="header-cta-item">
        <a href="/lien-he/" class="button-animated-blue-bg cmcu-header-pill-cta">
          Xét tuyển Online <span class="cta-arrow">↗</span>
        </a>
      </li>
    `);
  }

  // 4. Footer Brand & Layout (Apply across index & all subpages via semantic selectors)
  const footerLogoHtml = `
    <div class="box has-hover iamge-box-footer has-hover box-text-bottom">
      <div class="box-image" style="display:flex; justify-content:center; align-items:center;">
        <a href="/" title="Trường Đại học CMC & Ban Đại học số CMC">
          <div class="cmcu-dual-brand-logo-footer" style="display:inline-flex; align-items:center; gap:14px; text-decoration:none;">
            <img src="/uploads/cmcu-logo-white.png" alt="CMC University" style="height:48px; width:auto; object-fit:contain; display:block;">
            <span style="display:inline-block; width:1.5px; height:36px; background:rgba(255,255,255,0.4);"></span>
            <div style="display:inline-flex; align-items:center; gap:8px;">
              <img src="/uploads/bds-icon-only.png" alt="Ban Đại học số" style="height:38px; width:auto; object-fit:contain; display:block;">
              <span style="font-size:14px; font-weight:800; color:#e9bd42; text-transform:uppercase; letter-spacing:1px; font-family:'Montserrat',sans-serif;">BAN ĐẠI HỌC SỐ</span>
            </div>
          </div>
        </a>
      </div>
      <div class="box-text text-center">
        <div class="box-text-inner">
          <div class="text title-logoft">
            <p style="color:#ffffff; font-weight:700; font-size:15px; margin-top:12px; letter-spacing:0.5px;">TRƯỜNG ĐẠI HỌC CMC</p>
            <p style="color:#e9bd42; font-weight:600; font-size:12px; margin-top:2px;">Mô hình Đại học AI đầu tiên tại Việt Nam</p>
          </div>
        </div>
      </div>
    </div>
    <div class="social-links" style="margin-top: 15px; display: flex; justify-content: center; gap: 12px;">
      <a href="${settings.facebook_url || 'https://www.facebook.com/truongdaihoccmc'}" target="_blank" title="Facebook" style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; background:#1877f2; color:#fff;">
        <i class="fa-brands fa-facebook-f"></i>
      </a>
      <a href="https://zalo.me/4418267904969597429" target="_blank" title="Zalo" style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; background:#0068ff; color:#fff;">
        <i class="fa-solid fa-comment-dots"></i>
      </a>
      <a href="${settings.linkedin_url || 'https://www.linkedin.com/school/cmc-university/'}" target="_blank" title="LinkedIn" style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; background:#0a66c2; color:#fff;">
        <i class="fa-brands fa-linkedin-in"></i>
      </a>
      <a href="${settings.youtube_url || 'https://www.youtube.com/@cmcuniversity'}" target="_blank" title="YouTube" style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; background:#ff0000; color:#fff;">
        <i class="fa-brands fa-youtube"></i>
      </a>
    </div>
  `;
  const $footerLogoCol = $('.section-footer .iamge-box-footer').closest('.col-inner');
  if ($footerLogoCol.length) {
    $footerLogoCol.html(footerLogoHtml);
  } else {
    $('#col-318113861 .col-inner').html(footerLogoHtml);
  }

  // Fix Footer Address Overlapping across all pages
  const footerAddressHtml = `
    <div class="contact-info" style="color: #ffffff; line-height: 1.7; font-size: 13.5px;">
      <div class="contact-item" style="display: flex; gap: 10px; margin-bottom: 12px; align-items: flex-start;">
        <i class="fa-solid fa-location-dot" style="color: #e9bd42; margin-top: 4px; font-size: 15px; flex-shrink: 0;"></i>
        <div>
          <strong style="color: #fff; font-size: 13px; text-transform: uppercase;">Trụ sở chính (Campus Cầu Giấy):</strong><br>
          <span style="color: #e2e8f0;">Tòa nhà CMC, Phố Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy, TP. Hà Nội</span>
        </div>
      </div>
      <div class="contact-item" style="display: flex; gap: 10px; margin-bottom: 12px; align-items: flex-start;">
        <i class="fa-solid fa-graduation-cap" style="color: #e9bd42; margin-top: 4px; font-size: 15px; flex-shrink: 0;"></i>
        <div>
          <strong style="color: #fff; font-size: 13px; text-transform: uppercase;">Cơ sở đào tạo (Campus Vạn Phúc):</strong><br>
          <span style="color: #e2e8f0;">Số 84, Đường Nguyễn Thanh Bình, P. Vạn Phúc, Q. Hà Đông, TP. Hà Nội</span>
        </div>
      </div>
      <div class="contact-item" style="display: flex; gap: 10px; align-items: flex-start;">
        <i class="fa-solid fa-building-columns" style="color: #e9bd42; margin-top: 4px; font-size: 15px; flex-shrink: 0;"></i>
        <div>
          <strong style="color: #fff; font-size: 13px; text-transform: uppercase;">Văn phòng Ban Đại học số:</strong><br>
          <span style="color: #e2e8f0;">Tầng 12, CMC Tower, Duy Tân, Cầu Giấy, Hà Nội</span>
        </div>
      </div>
    </div>
  `;
  const $footerAddr = $('.section-footer .contact-info').closest('.text');
  if ($footerAddr.length) {
    $footerAddr.html(footerAddressHtml);
  } else {
    $('#text-2225069663').html(footerAddressHtml);
  }

  // Fix Footer Phones across all pages
  const footerPhonesHtml = `
    <div class="contact-phones" style="margin-top: 14px; font-size: 13.5px; line-height: 1.8;">
      <div class="contact-item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        <i class="fa-solid fa-phone-volume" style="color: #e9bd42;"></i>
        <a href="tel:02471029999" style="color: #ffffff; font-weight: 600; text-decoration: none;">024 7102 9999 (Tổng đài CMCU)</a>
      </div>
      <div class="contact-item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        <i class="fa-solid fa-headset" style="color: #e9bd42;"></i>
        <a href="tel:0984270476" style="color: #ffffff; font-weight: 600; text-decoration: none;">0984 270 476 (Hotline Đào tạo số)</a>
      </div>
      <div class="contact-item" style="display: flex; align-items: center; gap: 10px;">
        <i class="fa-solid fa-envelope" style="color: #e9bd42;"></i>
        <a href="mailto:daihocso@cmc.edu.vn" style="color: #e2e8f0; text-decoration: none;">daihocso@cmc.edu.vn</a>
      </div>
    </div>
  `;
  const $footerPhones = $('.section-footer .contact-phones').closest('.text');
  if ($footerPhones.length) {
    $footerPhones.html(footerPhonesHtml);
  } else {
    $('#text-2643528010').html(footerPhonesHtml);
  }

  // Fix Footer Menu List across all pages
  $('.section-footer .hover-list').html(`
    <p><a href="/gioi-thieu/">Về CMC & CMCU</a></p>
    <p><a href="/dich-vu-cua-chung-toi/">Đào tạo & Chuyển đổi số</a></p>
    <p><a href="/cac-phan-tich-chuyen-sau/">Phân tích chuyên sâu</a></p>
    <p><a href="/co-hoi-nghe-nghiep/">Tuyển sinh & Học bổng</a></p>
    <p><a href="/tin-tuc-su-kien/">Tin tức & Sự kiện</a></p>
    <p><a href="/lien-he/">Liên hệ</a></p>
  `);

  // Update Footer Map to CMC Tower across all pages
  $('.section-footer .map-box iframe').attr('src', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.9242784534726!2d105.78018997596956!3d21.035715987541243!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab4b94f6f7b1%3A0xc3f58a36c61fcf13!2zVE_DgCBOSEAgQ01D!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s');

  // Update Copyright
  $('.copyright-footer').html(`
    © 2026 Bản quyền thuộc về Trường Đại học CMC - Ban Đại học số CMC (Tập đoàn Công nghệ CMC)
    <span style="padding-left: 8px; margin-left: 8px; border-left: 1px solid rgba(255,255,255,0.2);">
      Mô hình Đại học AI đầu tiên tại Việt Nam
    </span>
  `);

  // 5. Remove Broken Chatbot Widget and Missing Buttons Scripts
  $('script').each(function () {
    const content = $(this).html() || '';
    if (content.includes('ACACChatbotConfig') || content.includes('var buttons=[{link:') || content.includes('contactButtons')) {
      $(this).remove();
    }
  });
  $('.contact-button-container, .acac-chat-widget').remove();

  // Inject Modern CMCU Floating Contact Bar (Bottom-Right matching mockup)
  $('body').append(`
    <div class="cmcu-floating-contact">
      <a href="tel:02471029999" class="cmcu-float-btn phone" title="Gọi Tổng đài CMCU">
        <i class="fa-solid fa-phone"></i>
        <span class="tooltip-label">Hotline: 024 7102 9999</span>
      </a>
      <a href="https://zalo.me/4418267904969597429" target="_blank" class="cmcu-float-btn zalo" title="Nhắn Zalo">
        <i class="fa-solid fa-comment-dots"></i>
        <span class="tooltip-label">Zalo CMCU</span>
      </a>
      <a href="https://www.facebook.com/truongdaihoccmc" target="_blank" class="cmcu-float-btn fb" title="Facebook CMCU">
        <i class="fa-brands fa-facebook-f"></i>
        <span class="tooltip-label">Facebook CMCU</span>
      </a>
      <a href="mailto:daihocso@cmc.edu.vn" class="cmcu-float-btn mail" title="Gửi Email Ban Đại học số">
        <i class="fa-solid fa-envelope"></i>
        <span class="tooltip-label">daihocso@cmc.edu.vn</span>
      </a>
    </div>
  `);

  // 6. Homepage Specific Content Transformation (If slug === 'index')
  if (slug === 'index') {
    // 6a. Hero Slider (Prioritize /uploads/bds-1st-ai-reception.jpg as initial entry banner)
    const slides = db.prepare('SELECT * FROM slides WHERE is_active = 1 ORDER BY order_num ASC').all();
    const sortedSlides = [...slides].sort((a, b) => {
      const aIsReception = (a.image_url || '').includes('bds-1st-ai-reception.jpg') ? 0 : 1;
      const bIsReception = (b.image_url || '').includes('bds-1st-ai-reception.jpg') ? 0 : 1;
      if (aIsReception !== bIsReception) return aIsReception - bIsReception;
      return (a.order_num || 0) - (b.order_num || 0);
    });
    if (sortedSlides.length > 0) {
      const $banners = $('.khung-slider-chinh .banner');
      sortedSlides.forEach((slide, idx) => {
        if ($banners[idx]) {
          const $b = $($banners[idx]);
          if (slide.image_url) {
            $b.find('img').first().attr('src', slide.image_url);
          }
          if (slide.btn_link) {
            $b.find('a.banner-link').attr('href', slide.btn_link);
          }
        }
      });
    }
    $('#banner-79944489 img').first().attr('src', '/uploads/bds-1st-ai-reception.jpg');

    // Hero Decorative Backdrop, Glowing Shapes & Curved Bottom Wave Mask
    const $heroSliderWrap = $('.khung-slider-chinh .slider-wrapper');
    if ($heroSliderWrap.length && $heroSliderWrap.find('.cmcu-hero-backdrop-gradient').length === 0) {
      $heroSliderWrap.append(`
        <div class="cmcu-hero-backdrop-gradient" aria-hidden="true"></div>
        <div class="cmcu-hero-shapes" aria-hidden="true">
          <span class="shape-arc"></span>
          <span class="shape-orb"></span>
        </div>
        <div class="cmcu-hero-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 72" preserveAspectRatio="none">
            <path d="M0,40 C340,78 960,-10 1440,34 L1440,72 L0,72 Z" fill="#ffffff"></path>
          </svg>
        </div>
      `);
    }

    // Hero Stationary Overlay Text (Desktop & Mobile) matching mockup
    const heroInnerHtml = `
      <p class="highlight-text">TRƯỜNG ĐẠI HỌC CMC • BAN ĐẠI HỌC SỐ</p>
      <h1 class="uppercase hero-line-1">TIÊN PHONG</h1>
      <h1 class="uppercase hero-line-2"><span class="cyan-text">SÁNG TẠO</span><span class="hero-sparkle" aria-hidden="true">✦</span></h1>
      <h1 class="uppercase hero-line-3">BỨT PHÁ</h1>
      <p class="subtext">Mô hình Đại học AI đầu tiên tại Việt Nam — Đào tạo gắn liền công nghệ và doanh nghiệp toàn cầu.</p>
      <div class="cmcu-hero-actions">
        <a href="/gioi-thieu/" class="cmcu-btn-primary">Khám phá ngay <span class="btn-arrow">→</span></a>
        <a href="/dich-vu-cua-chung-toi/" class="cmcu-btn-outline"><span class="play-icon">▷</span> Xem video giới thiệu</a>
      </div>
      <div class="cmcu-hero-dots" aria-hidden="true">
        <span class="dot active"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;
    ['#text-3924357870', '#text-1466038440'].forEach(sel => {
      const $sec = $(sel + ' .acac-hero-text');
      if ($sec.length) {
        $sec.html(heroInnerHtml);
      }
    });

    // Inject 4 Overlapping Feature Cards Bar inside #section_1006456508 > .section-content
    const $heroContent = $('#section_1006456508 > .section-content');
    if ($heroContent.length && $heroContent.find('.cmcu-hero-pillars-wrap').length === 0) {
      $heroContent.append(`
        <div class="cmcu-hero-pillars-wrap">
          <div class="cmcu-hero-pillars">
            <a href="/dich-vu-cua-chung-toi/dao-tao-ai-va-cong-nghe-so/" class="cmcu-pillar-card">
              <span class="pillar-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 10L12 5 2 10l10 5 10-5z"/>
                  <path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/>
                </svg>
              </span>
              <span class="pillar-title">Đào tạo số</span>
              <span class="pillar-arrow">→</span>
            </a>
            <a href="/dich-vu-cua-chung-toi/he-thong-hoc-tap-so-lms-smart-campus/" class="cmcu-pillar-card">
              <span class="pillar-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                  <polyline points="2 12 12 17 22 12"/>
                  <polyline points="2 17 12 22 22 17"/>
                </svg>
              </span>
              <span class="pillar-title">Hạ tầng số</span>
              <span class="pillar-arrow">→</span>
            </a>
            <a href="/dich-vu-cua-chung-toi/" class="cmcu-pillar-card">
              <span class="pillar-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </span>
              <span class="pillar-title">Dịch vụ số</span>
              <span class="pillar-arrow">→</span>
            </a>
            <a href="/gioi-thieu/" class="cmcu-pillar-card">
              <span class="pillar-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </span>
              <span class="pillar-title">Hệ sinh thái</span>
              <span class="pillar-arrow">→</span>
            </a>
          </div>
        </div>
      `);
    }

    // 6b. Section 1 (Intro: VỀ BAN ĐẠI HỌC SỐ & CMCU)
    $('#section_865356580 img').attr('src', '/uploads/bds-ai-lab-whiteboard.jpg');
    $('#text-524056605 h4').text('VỀ BAN ĐẠI HỌC SỐ & CMCU');
    $('#text-1746365312 h1').text('Mô hình đại học AI tiên phong, dẫn đầu xu thế chuyển đổi số giáo dục đại học tại Việt Nam');
    $('#text-428433913').html(`
      <div class="acac-intro" style="text-align: justify; margin-bottom: 14px;">
        Trường Đại học CMC (tiền thân là Trường Đại học Á Châu) được đầu tư bởi <strong>Tập đoàn Công nghệ CMC</strong> – một trong những tập đoàn công nghệ hàng đầu Việt Nam. Với sứ mệnh trở thành Đại học Thông minh, <strong>Đại học AI đầu tiên tại Việt Nam</strong>, Ban Đại học số đóng vai trò nòng cốt trong chiến lược số hóa toàn diện hệ thống quản trị và đào tạo.
      </div>
      <div class="acac-intro" style="text-align: justify;">
        Chúng tôi phát triển hệ sinh thái học tập AI-Native, nền tảng học tập số LMS, Smart Campus và chương trình thực tập doanh nghiệp On-the-Job Training (OJT), mang đến môi trường giáo dục chuẩn quốc tế gắn liền thực tiễn doanh nghiệp toàn cầu.
      </div>
    `);

    // 6c. Section 2 (Đối tác & Liên minh công nghệ toàn cầu)
    $('#section_156873414 .acac-partners-label').text('HỢP TÁC CHIẾN LƯỢC TOÀN CẦU');
    $('#section_156873414 h2').first().text('LIÊN MINH CÔNG NGHỆ & ĐỐI TÁC HÀNG ĐẦU THẾ GIỚI');
    $('#section_156873414 .acac-partners-intro').html(`
      Trường Đại học CMC và Ban Đại học số thiết lập mối quan hệ hợp tác chiến lược sâu rộng cùng các tập đoàn công nghệ hàng đầu (Tập đoàn CMC, Samsung SDS, Microsoft, Synopsys) và các trường đại học danh tiếng thế giới, kiến tạo hệ sinh thái đào tạo – thực tập OJT – nghiên cứu ứng dụng AI chuẩn mực quốc tế cho sinh viên.
    `);

    // Update 3 Partner cards in Section 2
    const partnerCards = $('#section_156873414 .acac-partner-card');
    if (partnerCards.length >= 3) {
      // Card 1: CMC Corp
      const $p1 = $(partnerCards[0]);
      $p1.find('.acac-partner-logo img').attr('src', '/uploads/cmcu-brand-horizontal.png').attr('alt', 'Tập đoàn Công nghệ CMC');
      $p1.find('h3').text('Tập đoàn Công nghệ CMC & Khối Doanh nghiệp');
      $p1.find('.acac-partner-text').text('Tập đoàn công nghệ hàng đầu Việt Nam bảo trợ toàn diện. 100% sinh viên được đào tạo thực chiến On-the-Job Training (OJT) và ưu tiên tuyển dụng tại CMC Global, CMC Telecom, CMC Cyber Security.');
      $p1.find('.acac-partner-link').attr('href', 'https://cmc.com.vn/').html('Tìm hiểu thêm <span>→</span>');

      // Card 2: Samsung SDS & Microsoft
      const $p2 = $(partnerCards[1]);
      $p2.find('.acac-partner-logo img').attr('src', '/uploads/samsung-microsoft-partner.svg').attr('alt', 'Samsung SDS & Microsoft');
      $p2.find('h3').text('Samsung SDS & Microsoft');
      $p2.find('.acac-partner-text').text('Hợp tác xây dựng hệ sinh thái Smart Campus và phòng thí nghiệm AI Lab hiện đại. Sinh viên được tiếp cận các công nghệ điện toán đám mây, dữ liệu lớn và chứng chỉ quốc tế từ các hãng công nghệ hàng đầu.');
      $p2.find('.acac-partner-link').attr('href', 'https://www.samsungsds.com/').html('Tìm hiểu thêm <span>→</span>');

      // Card 3: Đại học Quốc tế
      const $p3 = $(partnerCards[2]);
      $p3.find('.acac-partner-logo img').attr('src', '/uploads/cmcu-intl-collab.jpg').attr('alt', 'Mạng lưới Đại học Quốc tế');
      $p3.find('h3').text('Mạng lưới Đại học Quốc tế (Úc, Nhật Bản, Hàn Quốc)');
      $p3.find('.acac-partner-text').text('Liên kết đào tạo song bằng, trao đổi giảng viên và sinh viên quốc tế cùng Đại học Southern Queensland (Úc) và các trường đại học đối tác tại Hàn Quốc, Nhật Bản, mở rộng cánh cửa sự nghiệp toàn cầu.');
      $p3.find('.acac-partner-link').attr('href', '/tin-tuc-su-kien/').html('Tìm hiểu thêm <span>→</span>');
    }

    // 6d. Section 3, 4, 5 (Trụ cột đào tạo & Dịch vụ chuyển đổi số - ALL 3 VIEWPORTS)
    $('#text-1577488377 h4, #text-3048788510 h4, #text-1390866465 h4').text('TRỤ CỘT ĐÀO TẠO & CHUYỂN ĐỔI SỐ');
    $('#text-3776512695 h1, #text-3718179881 h1, #text-3726331558 h1').text('Hệ sinh thái Giáo dục Thông minh – AI-Native');
    $('#text-2142988421 p, #text-605646506 p, #text-4287405473 p').text('Ban Đại học số & Trường Đại học CMC đồng hành kiến tạo hệ sinh thái đào tạo công nghệ số, AI, Vi mạch bán dẫn và chuyển đổi số giáo dục chuẩn quốc tế.');

    // Inject 9 updated services into desktop, tablet, and mobile sections
    const services = db.prepare('SELECT * FROM services ORDER BY order_num ASC').all();
    if (services.length > 0) {
      // Desktop cards
      const desktopCards = $('#section_466373946 .imgbox-dv');
      services.forEach((s, idx) => {
        if (desktopCards[idx]) {
          const $c = $(desktopCards[idx]);
          $c.find('h4').text(s.title);
          $c.find('p').first().text(s.short_desc);
          $c.find('a').attr('href', `/dich-vu-cua-chung-toi/${s.slug}/`).html('Khám phá chi tiết <i class="fa-solid fa-arrow-right"></i>');
        }
      });

      // Tablet cards
      const tabletCards = $('#section_1212534044 .imgbox-dv');
      services.forEach((s, idx) => {
        if (tabletCards[idx]) {
          const $c = $(tabletCards[idx]);
          $c.find('h4').text(s.title);
          $c.find('p').first().text(s.short_desc);
          $c.find('a').attr('href', `/dich-vu-cua-chung-toi/${s.slug}/`).html('Khám phá chi tiết <i class="fa-solid fa-arrow-right"></i>');
        }
      });

      // Mobile cards (show-for-small)
      const mobileCards = $('#section_720290466 .imgbox-dv');
      services.forEach((s, idx) => {
        if (mobileCards[idx]) {
          const $c = $(mobileCards[idx]);
          $c.find('h4').text(s.title);
          $c.find('p').first().text(s.short_desc);
          $c.find('a').attr('href', `/dich-vu-cua-chung-toi/${s.slug}/`).html('Khám phá chi tiết <i class="fa-solid fa-arrow-right"></i>');
        }
      });
    }

    // 6e. Section 6 (Call to action)
    $('#section_1415813573 h1').text('SẴN SÀNG CHO HÀNH TRÌNH ĐẠI HỌC SỐ CÙNG TRƯỜNG ĐẠI HỌC CMC');
    $('#section_1415813573 p').text('Đăng ký xét tuyển trực tuyến và nhận học bổng "CMC - Vì bạn xứng đáng" ngay hôm nay để dẫn đầu kỷ nguyên AI.');
    $('#section_1415813573 a.button span').text('NỘP HỒ SƠ XÉT TUYỂN ONLINE');

    // 6f. Section 7 (Điều khiến CMCU & Ban Đại học số khác biệt)
    $('#text-2943854240').remove(); // Clean duplicate hidden ACAC element
    const $s10 = $('#section_380594517');
    $s10.find('.subtitle').text('ĐIỀU KHIẾN CMCU & BAN ĐẠI HỌC SỐ KHÁC BIỆT');
    $s10.find('h2').text('Hệ sinh thái Viện - Trường - Doanh nghiệp gắn kết thực tiễn');
    $s10.find('.content-side > p').eq(1).text('Trường Đại học CMC chọn con đường tiên phong – kiến tạo thế hệ công dân số và kỹ sư AI chuẩn quốc tế. Sinh viên được thụ hưởng nền tảng giáo dục AI-Native, học tập cùng trợ lý ảo thông minh và trải nghiệm môi trường doanh nghiệp thực tế ngay từ những năm đầu đại học.');

    $s10.find('.acac-points').html(`
      <li><i class="fa-solid fa-circle-check"></i> <div><strong>Cam kết 100% việc làm:</strong> Cơ hội việc làm tại Tập đoàn CMC và các doanh nghiệp đối tác hàng đầu thế giới.</div></li>
      <li><i class="fa-solid fa-circle-check"></i> <div><strong>Quỹ học bổng 96 tỷ đồng:</strong> Chương trình "CMC - Vì bạn xứng đáng" tiếp sức nhân tài công nghệ cao.</div></li>
      <li><i class="fa-solid fa-circle-check"></i> <div><strong>Mô hình AI-Native tiên phong:</strong> 100% sinh viên được trang bị kiến thức, tư duy và kỹ năng ứng dụng AI vào chuyên ngành.</div></li>
      <li><i class="fa-solid fa-circle-check"></i> <div><strong>Học kỳ On-the-Job Training (OJT):</strong> Trải nghiệm dự án thực tế tại doanh nghiệp ngay từ năm thứ hai.</div></li>
      <li><i class="fa-solid fa-circle-check"></i> <div><strong>Smart Campus & AI Lab hiện đại:</strong> Trung tâm dữ liệu, AI Hub và hệ thống phòng lab chuẩn quốc tế.</div></li>
    `);

    // Section 7 dual images in col-1083676306
    $('#col-1083676306 .left-image img').attr('src', '/uploads/bds-lecturer-student-ai.jpg').attr('alt', 'Sinh viên CMCU thực tập On-the-Job Training');
    $('#col-1083676306 .right-image img').attr('src', '/uploads/bds-ai-lab-workstations.jpg').attr('alt', 'Môi trường học tập AI-Native chuẩn quốc tế');

    // 6g. Section 8 (Tin tức & Sự kiện)
    $('#section_1638842805 h4').text('TIN TỨC & SỰ KIỆN CMCU');
    $('#section_1638842805 h1').text('Cập nhật những thông tin mới nhất về tuyển sinh, đào tạo AI, học bổng 96 tỷ đồng và hoạt động chuyển đổi số');
    $('#section_1638842805 a.button span').text('Xem tất cả tin tức & sự kiện');
  } else if (slug === 'gioi-thieu') {
    // 6h. Subpage /gioi-thieu/
    $('#text-box-439625607 .text-inner').html(`
      <h2 style="text-align: center;"><strong>Về Trường Đại học CMC &amp; Ban Đại học số</strong></h2>
      <p style="text-align: center;"><a href="/">Trang chủ</a> &gt; Về CMC &amp; CMCU</p>
    `);
    $('#image_1191803756 img, #image_208835296 img')
      .attr('src', '/uploads/bds-ai-lab-whiteboard.jpg')
      .attr('alt', 'Ban Đại học số - Trường Đại học CMC');

    ['#col-443567159', '#col-1479535730', '#col-1306819364'].forEach(colSel => {
      const $card = $(colSel);
      if ($card.length) {
        $card.find('blockquote p').text('“Tiên phong chuyển đổi số giáo dục – Kiến tạo thế hệ công dân toàn cầu AI-Native”');
        $card.find('h4.uppercase').text('Ban Đại học số CMC');
        $card.find('h6.thin-font').text('Trường Đại học CMC (CMC University)');
      }
    });
    $('#image_1681673906 img, #image_1887434097 img, #image_157694569 img')
      .attr('src', '/uploads/bds-lecturer-student-ai.jpg')
      .attr('alt', 'Ban Đại học số CMC - Trường Đại học CMC');

    $('.col-vechungtoi .Subject').html(`
      <p><strong>Trường Đại học CMC (CMC University)</strong> – thành viên thuộc Tập đoàn Công nghệ CMC – là trường đại học công nghệ tư thục hiện đại được đầu tư bài bản với tầm nhìn trở thành Đại học Thông minh, Đại học AI đầu tiên tại Việt Nam.</p>
      <p><strong>Ban Đại học số CMC</strong> giữ vai trò kiến trúc sư trưởng trong chiến lược chuyển đổi số toàn diện: phát triển hệ sinh thái học tập thông minh (Smart Campus &amp; LMS), tích hợp trí tuệ nhân tạo (AI-Native) vào mọi chương trình đào tạo và kết nối sinh viên thực chiến doanh nghiệp.</p>
      <p>Với sự bảo trợ từ Tập đoàn Công nghệ CMC cùng các đối tác chiến lược toàn cầu (Samsung SDS, Microsoft, Synopsys), CMCU cam kết mang đến môi trường giáo dục chuẩn quốc tế, 100% sinh viên được trải nghiệm học kỳ doanh nghiệp (OJT) và mở rộng cơ hội việc làm toàn cầu.</p>
    `);
    $('.acac-guarantees').html(`
      <p><i class="fas fa-award"></i> Đại học AI đầu tiên tại Việt Nam</p>
      <p><i class="fas fa-shield-alt"></i> Bảo trợ bởi Tập đoàn Công nghệ CMC – Cam kết 100% việc làm</p>
      <p><i class="fas fa-chart-line"></i> Hệ sinh thái học tập số &amp; Thực tập OJT chuẩn quốc tế</p>
    `);

    const $vision = $('#col-340622570 .consult-inner');
    if ($vision.length) {
      $vision.find('.title').text('Định hướng phát triển');
      $vision.find('.text').text('Trường Đại học CMC và Ban Đại học số hướng tới mục tiêu trở thành Đại học số thông minh, đổi mới sáng tạo hàng đầu khu vực châu Á vào năm 2033, dẫn đầu Việt Nam về đào tạo nhân lực công nghệ cao, AI, Vi mạch bán dẫn và Chuyển đổi số.');
      $vision.find('ul.list-style-two').html(`
        <li>Tiên phong mô hình Đại học AI-Native gắn kết chặt chẽ Viện – Trường – Doanh nghiệp.</li>
        <li>Phát triển Smart Campus, Trung tâm Dữ liệu và AI Lab đạt chuẩn quốc tế ngay tại giảng đường.</li>
      `);
    }

    const $mission = $('#col-415896487 .consult-inner');
    if ($mission.length) {
      $mission.find('.title').text('Giá trị giáo dục');
      $mission.find('ul.list-style-two').html(`
        <li><strong>Ban Đại học số CMC</strong> kiến tạo nền tảng giáo dục số linh hoạt, cá nhân hóa trải nghiệm học tập bằng AI cho mỗi sinh viên.</li>
        <li>CMCU – Đào tạo nguồn nhân lực chất lượng cao đa ngành (CNTT, Vi mạch bán dẫn, Kinh doanh số, Ngôn ngữ) đáp ứng chuẩn mực toàn cầu.</li>
        <li>Đồng hành cùng doanh nghiệp thông qua chương trình On-the-Job Training (OJT), Quỹ học bổng 96 tỷ đồng "CMC - Vì bạn xứng đáng" và cam kết cơ hội nghề nghiệp vững chắc.</li>
      `);
    }

    // Remove hardcoded ACAC CPA leadership popup bios, auditing methodology & 2004 Hải Phòng history
    $('#section_399497485, #section_364376435, #section_1463627819, #section_1310840736, #section_1639212911').remove();
  } else if (slug === 'dich-vu-cua-chung-toi') {
    // 6i. Subpage /dich-vu-cua-chung-toi/
    $('#text-box-1810784565 .text-inner').html(`
      <h2 style="text-align: center;"><strong>Đào tạo &amp; Chuyển đổi số</strong></h2>
      <p style="text-align: center;"><a href="/">Trang chủ</a> &gt; Đào tạo &amp; Chuyển đổi số</p>
    `);
    $('#text-2815098365 h1').text('Hệ sinh thái Đào tạo & Chuyển đổi số Giáo dục');
    $('#col-528812240 p').text('Ban Đại học số & Trường Đại học CMC triển khai hệ sinh thái 9 trụ cột đào tạo – chuyển đổi số toàn diện theo mô hình Đại học AI tiên phong tại Việt Nam. Sinh viên được tiếp cận hạ tầng Smart Campus, LMS thông minh, các ngành công nghệ mũi nhọn (AI, Vi mạch bán dẫn, An ninh mạng), học kỳ doanh nghiệp OJT và chương trình liên kết quốc tế.');

    const $showcaseCols = $('#row-1320202114 > .col');
    servicesInDb.forEach((s, idx) => {
      if ($showcaseCols[idx]) {
        const $col = $($showcaseCols[idx]);
        $col.find('h1.main-heading').text(s.title);
        if ($col.find('.cmcu-service-desc').length === 0) {
          $col.find('h1.main-heading').after(`<p class="cmcu-service-desc" style="color:#4b5563; margin-bottom:16px; line-height:1.6;">${s.short_desc}</p>`);
        } else {
          $col.find('.cmcu-service-desc').text(s.short_desc);
        }
        if (s.cover_url) {
          $col.find('.image-cover img').attr('src', s.cover_url).attr('alt', s.title);
        }
        const $btn = $col.find('a.button');
        $btn.attr('href', `/dich-vu-cua-chung-toi/${s.slug}/`);
        $btn.find('span').text('Khám phá chi tiết');
      }
    });
  } else if (slug.startsWith('dich-vu-cua-chung-toi__')) {
    // 6j. Dynamic Service Detail Pages (/dich-vu-cua-chung-toi/:serviceSlug/)
    const serviceSlug = slug.replace('dich-vu-cua-chung-toi__', '');
    const service = db.prepare('SELECT * FROM services WHERE slug = ?').get(serviceSlug) || servicesInDb[0];
    if (service) {
      $('title').text(`${service.title} | Trường Đại học CMC - Ban Đại học số`);
      const bannerHtml = `
        <h2 style="text-align: center;"><strong>${service.title}</strong></h2>
        <h2 style="text-align: center;"><a style="font-size: 14.4px;" href="/">Trang chủ &gt; Đào tạo &amp; Chuyển đổi số &gt; ${service.title}</a></h2>
      `;
      if ($('#text-453527673').length) {
        $('#text-453527673').html(bannerHtml);
      } else {
        $('.banner .text-inner').first().html(bannerHtml);
      }

      const detailHtml = `
        <h2>${service.title}</h2>
        <p>${service.short_desc}</p>
        <p>Là một trong 9 trụ cột chiến lược do <strong>Ban Đại học số CMC</strong> và <strong>Trường Đại học CMC (CMCU)</strong> triển khai, chương trình được thiết kế theo chuẩn quốc tế, gắn kết chặt chẽ với hệ sinh thái công nghệ của Tập đoàn Công nghệ CMC và các đối tác toàn cầu như Samsung SDS, Microsoft, Synopsys.</p>
        <p><strong>Điểm nổi bật tại Trường Đại học CMC:</strong></p>
        <ul>
          <li>Đào tạo theo mô hình Đại học AI-Native với sự hỗ trợ của hệ thống LMS &amp; Smart Campus hiện đại;</li>
          <li>Tham gia học kỳ doanh nghiệp On-the-Job Training (OJT) thực chiến ngay từ năm học thứ hai;</li>
          <li>Cơ hội nhận học bổng từ Quỹ "CMC - Vì bạn xứng đáng" trị giá 96 tỷ đồng;</li>
          <li>Cam kết 100% cơ hội việc làm tại Tập đoàn CMC và mạng lưới doanh nghiệp đối tác toàn cầu.</li>
        </ul>
        <div style="margin-top: 24px;">
          <a href="/lien-he/" class="button primary" style="background-color:#0c356a; color:#ffffff; border-radius:6px; padding:10px 24px; font-weight:700; display:inline-block;">Đăng ký tư vấn &amp; Xét tuyển</a>
        </div>
      `;
      if ($('#text-134661989').length) {
        $('#text-134661989').html(detailHtml);
      } else {
        $('.content-area .text.dvdt').first().html(detailHtml);
      }

      if ($('#image_812936987 img').length) {
        $('#image_812936987 img').attr('src', service.cover_url || '/uploads/bds-ai-lab-workstations.jpg').attr('alt', service.title);
      }
    }
  } else if (slug === 'cac-phan-tich-chuyen-sau') {
    // 6k. Subpage /cac-phan-tich-chuyen-sau/
    $('#text-3772803083').html(`
      <h2 style="text-align: center;"><strong>Phân tích chuyên sâu &amp; Chuyển đổi số</strong></h2>
      <p style="text-align: center;"><a href="/">Trang chủ</a> &gt; Phân tích chuyên sâu</p>
    `);
    $('#text-2766794118 h1').text('Bản tin Học thuật, Công nghệ AI & Chuyển đổi số');
    $('#col-720183063 p').text('Chuyên trang tổng hợp nghiên cứu chuyên sâu, báo cáo xu hướng công nghệ Trí tuệ nhân tạo (AI), Vi mạch bán dẫn, An ninh mạng và thực tiễn chuyển đổi số giáo dục đại học từ Ban Đại học số CMC & Trường Đại học CMC.');
  } else if (slug === 'co-hoi-nghe-nghiep') {
    // 6l. Subpage /co-hoi-nghe-nghiep/ -> Tuyển sinh & Học bổng
    $('#text-655235138').html(`
      <h2 style="text-align: center;"><strong>Tuyển sinh &amp; Học bổng CMCU</strong></h2>
      <p style="text-align: center;"><a href="/">Trang chủ</a> &gt; Tuyển sinh &amp; Học bổng</p>
    `);
    $('#text-1473704852').html(`
      <h2>Tuyển sinh Đại học chính quy &amp; Quỹ học bổng "CMC - Vì bạn xứng đáng" 96 tỷ đồng</h2>
      <p><strong>Trường Đại học CMC (CMCU)</strong> mở ra cơ hội học tập trong môi trường Đại học AI chuẩn quốc tế cùng các suất học bổng giá trị lên tới 100% học phí toàn khóa từ Quỹ học bổng 96 tỷ đồng "CMC - Vì bạn xứng đáng".</p>
      <p>100% sinh viên các ngành công nghệ mũi nhọn và kinh doanh số được tham gia học kỳ thực tập doanh nghiệp On-the-Job Training (OJT) và cam kết cơ hội việc làm tại Tập đoàn Công nghệ CMC, Samsung SDS và mạng lưới đối tác toàn cầu.</p>
    `);

    const admissionsCards = [
      {
        title: 'Thông báo Tuyển sinh Đại học chính quy năm 2026 – Trường Đại học CMC',
        date: '01/03/2026',
        excerpt: 'Trường Đại học CMC tuyển sinh các ngành công nghệ mũi nhọn: Trí tuệ nhân tạo (AI), Công nghệ thông tin, Vi mạch bán dẫn, Quản trị kinh doanh số và Ngôn ngữ.',
        img: '/uploads/bds-ai-lab-whiteboard.jpg',
        link: '/lien-he/'
      },
      {
        title: 'Chương trình Học bổng "CMC – Vì bạn xứng đáng" tổng trị giá 96 tỷ đồng',
        date: '15/02/2026',
        excerpt: 'Cơ hội nhận học bổng 50%, 70% và 100% học phí toàn khóa dành cho thí sinh có thành tích học tập xuất sắc khi xét tuyển vào Trường Đại học CMC.',
        img: '/uploads/bds-lecturer-student-ai.jpg',
        link: '/lien-he/'
      },
      {
        title: 'Học kỳ Doanh nghiệp On-the-Job Training (OJT) – Cam kết 100% việc làm',
        date: '10/02/2026',
        excerpt: 'Sinh viên CMCU trực tiếp tham gia dự án thực tế có hưởng lương tại Tập đoàn Công nghệ CMC, Samsung SDS và các đối tác công nghệ hàng đầu.',
        img: '/uploads/bds-ai-lab-workstations.jpg',
        link: '/dich-vu-cua-chung-toi/hoc-ky-doanh-nghiep-ojt/'
      },
      {
        title: 'Chương trình Liên kết Quốc tế & Song bằng cùng Đại học Southern Queensland (Úc)',
        date: '05/02/2026',
        excerpt: 'Mở rộng cánh cửa sự nghiệp toàn cầu với chương trình đào tạo chuẩn quốc tế và học kỳ trao đổi tại Úc, Hàn Quốc, Nhật Bản.',
        img: '/uploads/cmcu-intl-collab.jpg',
        link: '/dich-vu-cua-chung-toi/hop-tac-quoc-te-song-bang/'
      }
    ];
    $('#section_906581254 .post-item').each((idx, el) => {
      if (idx < admissionsCards.length) {
        const c = admissionsCards[idx];
        const $item = $(el);
        $item.find('.box-image a').attr('href', c.link).attr('aria-label', c.title);
        $item.find('.box-image img').attr('src', c.img).attr('alt', c.title).removeAttr('srcset');
        $item.find('.post-title a').attr('href', c.link).text(c.title);
        $item.find('.post-meta').text(c.date);
        $item.find('.from_the_blog_excerpt').text(c.excerpt);
      } else {
        $(el).remove();
      }
    });
    $('#section_906581254 .page-numbers.nav-pagination').remove();
  } else if (slug === 'tin-tuc-su-kien') {
    // 6m. Subpage /tin-tuc-su-kien/ -> Dynamic DB posts
    $('#text-2570066698').html(`
      <h2 style="text-align: center;"><strong>Tin tức &amp; Sự kiện CMCU</strong></h2>
      <p style="text-align: center;"><a href="/">Trang chủ</a> &gt; Tin tức &amp; Sự kiện</p>
    `);
    const posts = db.prepare('SELECT * FROM posts ORDER BY id ASC').all();
    $('#section_236081841 .post-item').each((idx, el) => {
      if (idx < posts.length) {
        const p = posts[idx];
        const $item = $(el);
        const postHref = '/tin-tuc-su-kien/';
        $item.find('.box-image a').attr('href', postHref).attr('aria-label', p.title);
        $item.find('.box-image img')
          .attr('src', p.featured_img || '/uploads/bds-ai-lab-whiteboard.jpg')
          .attr('alt', p.title)
          .removeAttr('srcset');
        $item.find('.post-title a').attr('href', postHref).text(p.title);
        $item.find('.post-meta').text(p.category || 'Tin tức CMCU');
        $item.find('.from_the_blog_excerpt').text(p.excerpt || '');
      } else {
        $(el).remove();
      }
    });
    $('#section_236081841 .page-numbers.nav-pagination').remove();
  } else if (slug === 'lien-he') {
    // 6n. Subpage /lien-he/
    $('#text-3117879121').html(`
      <h2 style="text-align: center;"><strong>Liên hệ &amp; Đăng ký Xét tuyển</strong></h2>
      <p style="text-align: center;"><a href="/">Trang chủ</a> &gt; Liên hệ</p>
    `);
    $('#text-917696525 h1').text('Liên hệ Tư vấn Tuyển sinh & Chuyển đổi số');
    $('.form-cta .contact-info p').text('Ban Đại học số & Trường Đại học CMC luôn sẵn sàng đồng hành, tư vấn thông tin tuyển sinh đại học, chương trình học bổng 96 tỷ đồng và hợp tác đào tạo – chuyển đổi số doanh nghiệp.');
    $('.contact-form .title-tu-van').text('Đăng ký tư vấn & Xét tuyển trực tuyến');
    $('.form-acac label').each(function () {
      if ($(this).text().includes('Tên công ty')) {
        $(this).text('Trường THPT / Đơn vị *');
      }
    });
    $('.form-acac input[name="company"]').attr('placeholder', 'Nhập tên trường hoặc đơn vị');
    $('.checkbox-group .wpcf7-list-item').each(function () {
      const $item = $(this);
      const $input = $item.find('input[type="checkbox"]');
      const $label = $item.find('.wpcf7-list-item-label');
      if ($input.val()) $input.val($input.val().replace(/ACAC/g, 'Trường Đại học CMC (CMCU)'));
      if ($label.text()) $label.text($label.text().replace(/ACAC/g, 'Trường Đại học CMC (CMCU)'));
    });
  }

  // 7. Deterministically Tag Elements for Visual CMS Editing
  tagCmsElements($);

  // 8. Apply User Overrides from page_edits Database Table
  const edits = db.prepare('SELECT element_id, content_type, content_value FROM page_edits WHERE page_slug = ?').all(slug);
  for (const edit of edits) {
    const $el = $(`[data-cms-id="${edit.element_id}"]`);
    if ($el.length > 0) {
      if (edit.content_type === 'image') {
        $el.attr('src', edit.content_value);
      } else {
        $el.html(edit.content_value);
      }
    }
  }

  // 9. Inject Live Visual Editor Toolbar for Admin
  const isAdmin = req.session && req.session.isAdmin;
  if (isAdmin) {
    $('head').append(`<link rel="stylesheet" href="/admin-assets/live-editor.css">`);
    $('body').append(`
      <div id="acac-live-bar" class="acac-live-bar">
        <div class="acac-live-left">
          <span class="acac-live-badge"><i class="fa fa-pen-to-square"></i> CMCU Visual Editor</span>
          <span class="acac-live-page">Trang: <strong>${slug}</strong></span>
          <span id="acac-change-counter" class="acac-change-counter">0 thay đổi chưa lưu</span>
        </div>
        <div class="acac-live-right">
          <button id="acac-save-btn" class="acac-btn acac-btn-save" disabled>
            <i class="fa fa-floppy-disk"></i> Lưu thay đổi
          </button>
          <a href="/admin" class="acac-btn acac-btn-admin" target="_blank">
            <i class="fa fa-gauge-high"></i> Bảng Quản trị
          </a>
          <a href="/admin/logout" class="acac-btn acac-btn-logout">
            <i class="fa fa-right-from-bracket"></i> Đăng xuất
          </a>
        </div>
      </div>

      <div id="acac-img-modal" class="acac-modal" style="display:none;">
        <div class="acac-modal-content">
          <div class="acac-modal-header">
            <h3><i class="fa fa-image"></i> Đổi ảnh trực tiếp</h3>
            <span class="acac-modal-close" onclick="closeImgModal()">&times;</span>
          </div>
          <div class="acac-modal-body">
            <p>Chọn ảnh mới từ máy tính của bạn:</p>
            <input type="file" id="acac-modal-file" accept="image/*" style="width: 100%; padding: 10px; border: 2px dashed #cbd5e1; border-radius: 6px; margin: 10px 0;">
            <div id="acac-modal-preview" style="text-align: center; margin: 10px 0; max-height: 200px; overflow: hidden; display: none;">
              <img src="" style="max-height: 180px; max-width: 100%; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            </div>
            <div style="margin-top: 15px;">
              <label>Hoặc nhập URL ảnh:</label>
              <input type="text" id="acac-modal-url" placeholder="/uploads/..." style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #cbd5e1; border-radius: 4px;">
            </div>
          </div>
          <div class="acac-modal-footer">
            <button class="acac-btn acac-btn-secondary" onclick="closeImgModal()">Hủy</button>
            <button class="acac-btn acac-btn-primary" onclick="applyImgChange()">Áp dụng ảnh này</button>
          </div>
        </div>
      </div>

      <script>window.__ACAC_PAGE_SLUG__ = "${slug}";</script>
      <script src="/admin-assets/live-editor.js"></script>
    `);
  }

  return $.html();
}

module.exports = {
  renderPage,
  getSettings,
  resolveHtmlFile,
  extractPageElements
};
