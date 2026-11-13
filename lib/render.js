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

  // Update Page Title
  if (slug === 'index') {
    $('title').text('Trường Đại học CMC - Ban Đại học số CMC | Đại học AI đầu tiên tại Việt Nam');
  } else {
    const currentTitle = $('title').text();
    $('title').text(`${currentTitle.replace(/ACAC/g, 'CMC')} | Trường Đại học CMC - Ban Đại học số`);
  }

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

  // 3. Navigation Menu Items Rebranding
  $('.header-nav a, .mobile-nav a, #main-menu a').each(function () {
    const $a = $(this);
    const text = $a.text().trim();
    if (text === 'Về ACAC') $a.text('Về CMC & CMCU');
    if (text === 'Dịch vụ') $a.text('Đào tạo & Chuyển đổi số');
    if (text === 'Cơ hội nghề nghiệp') $a.text('Tuyển sinh & Học bổng');
    if (text.includes('LIÊN HỆ NGAY')) {
      $a.text('XÉT TUYỂN ONLINE');
      $a.attr('href', '/lien-he/');
    }
  });

  // Rebrand sub-menu service items in header dropdown
  const servicesInDb = db.prepare('SELECT slug, title FROM services ORDER BY order_num ASC').all();
  if (servicesInDb.length > 0) {
    const $submenu = $('.header-bottom-nav .sub-menu').first();
    if ($submenu.length) {
      $submenu.html(servicesInDb.map(s => `
        <li class="menu-item"><a href="/dich-vu-cua-chung-toi/${s.slug}/">${s.title}</a></li>
      `).join(''));
    }
  }

  // 4. Footer Brand & Layout (Fix Overlapping & Apply CMCU Colors)
  const footerLogoHtml = `
    <div class="box has-hover iamge-box-footer has-hover box-text-bottom">
      <div class="box-image" style="display:flex; justify-content:center; align-items:center;">
        <a href="/" title="Trường Đại học CMC & Ban Đại học số CMC">
          <div class="cmcu-dual-brand-logo-footer" style="display:inline-flex; align-items:center; gap:14px; text-decoration:none;">
            <img src="/uploads/cmcu-logo-white.png" alt="CMC University" style="height:48px; width:auto; object-fit:contain; display:block;">
            <span style="display:inline-block; width:1.5px; height:36px; background:rgba(255,255,255,0.4);"></span>
            <div style="display:inline-flex; align-items:center; gap:8px;">
              <img src="/uploads/bds-icon-only.png" alt="Ban Đại học số" style="height:38px; width:auto; object-fit:contain; display:block;">
              <span style="font-size:14px; font-weight:800; color:#00dedf; text-transform:uppercase; letter-spacing:1px; font-family:'Roboto',sans-serif;">BAN ĐẠI HỌC SỐ</span>
            </div>
          </div>
        </a>
      </div>
      <div class="box-text text-center">
        <div class="box-text-inner">
          <div class="text title-logoft">
            <p style="color:#ffffff; font-weight:700; font-size:15px; margin-top:12px; letter-spacing:0.5px;">TRƯỜNG ĐẠI HỌC CMC</p>
            <p style="color:#00dedf; font-weight:600; font-size:12px; margin-top:2px;">Mô hình Đại học AI đầu tiên tại Việt Nam</p>
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
  $('#col-318113861 .col-inner').html(footerLogoHtml);

  // Fix Footer Address Overlapping (Replace old text-2225069663 entirely)
  const footerAddressHtml = `
    <div class="contact-info" style="color: #ffffff; line-height: 1.7; font-size: 13.5px;">
      <div class="contact-item" style="display: flex; gap: 10px; margin-bottom: 12px; align-items: flex-start;">
        <i class="fa-solid fa-location-dot" style="color: #00dedf; margin-top: 4px; font-size: 15px; flex-shrink: 0;"></i>
        <div>
          <strong style="color: #fff; font-size: 13px; text-transform: uppercase;">Trụ sở chính (Campus Cầu Giấy):</strong><br>
          <span style="color: #cbd5e1;">Tòa nhà CMC, Phố Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy, TP. Hà Nội</span>
        </div>
      </div>
      <div class="contact-item" style="display: flex; gap: 10px; margin-bottom: 12px; align-items: flex-start;">
        <i class="fa-solid fa-graduation-cap" style="color: #00dedf; margin-top: 4px; font-size: 15px; flex-shrink: 0;"></i>
        <div>
          <strong style="color: #fff; font-size: 13px; text-transform: uppercase;">Cơ sở đào tạo (Campus Vạn Phúc):</strong><br>
          <span style="color: #cbd5e1;">Số 84, Đường Nguyễn Thanh Bình, P. Vạn Phúc, Q. Hà Đông, TP. Hà Nội</span>
        </div>
      </div>
      <div class="contact-item" style="display: flex; gap: 10px; align-items: flex-start;">
        <i class="fa-solid fa-building-columns" style="color: #00dedf; margin-top: 4px; font-size: 15px; flex-shrink: 0;"></i>
        <div>
          <strong style="color: #fff; font-size: 13px; text-transform: uppercase;">Văn phòng Ban Đại học số:</strong><br>
          <span style="color: #cbd5e1;">Tầng 12, CMC Tower, Duy Tân, Cầu Giấy, Hà Nội</span>
        </div>
      </div>
    </div>
  `;
  $('#text-2225069663').html(footerAddressHtml);

  // Fix Footer Phones
  const footerPhonesHtml = `
    <div class="contact-phones" style="margin-top: 14px; font-size: 13.5px; line-height: 1.8;">
      <div class="contact-item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        <i class="fa-solid fa-phone-volume" style="color: #00dedf;"></i>
        <a href="tel:02471029999" style="color: #ffffff; font-weight: 600; text-decoration: none;">024 7102 9999 (Tổng đài CMCU)</a>
      </div>
      <div class="contact-item" style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        <i class="fa-solid fa-headset" style="color: #00dedf;"></i>
        <a href="tel:0984270476" style="color: #ffffff; font-weight: 600; text-decoration: none;">0984 270 476 (Hotline Đào tạo số)</a>
      </div>
      <div class="contact-item" style="display: flex; align-items: center; gap: 10px;">
        <i class="fa-solid fa-envelope" style="color: #00dedf;"></i>
        <a href="mailto:daihocso@cmc.edu.vn" style="color: #cbd5e1; text-decoration: none;">daihocso@cmc.edu.vn</a>
      </div>
    </div>
  `;
  $('#text-2643528010').html(footerPhonesHtml);

  // Fix Footer Menu List
  $('#text-1536611635 .hover-list').html(`
    <p><a href="/gioi-thieu/">Về CMC & CMCU</a></p>
    <p><a href="/dich-vu-cua-chung-toi/">Đào tạo & Chuyển đổi số</a></p>
    <p><a href="/co-hoi-nghe-nghiep/">Tuyển sinh & Học bổng</a></p>
    <p><a href="/tin-tuc-su-kien/">Tin tức & Sự kiện</a></p>
    <p><a href="/lien-he/">Liên hệ</a></p>
  `);

  // Update Footer Map to CMC Tower
  $('#col-1745935457 .map-box iframe').attr('src', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.9242784534726!2d105.78018997596956!3d21.035715987541243!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab4b94f6f7b1%3A0xc3f58a36c61fcf13!2zVE_DgCBOSEAgQ01D!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s');

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

  // Inject Modern CMCU Floating Contact Bar
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
      <a href="/lien-he/" class="cmcu-float-btn ai" title="Đăng ký xét tuyển & tư vấn số">
        <i class="fa-solid fa-graduation-cap"></i>
        <span class="tooltip-label">Xét tuyển Online</span>
      </a>
    </div>
  `);

  // 6. Homepage Specific Content Transformation (If slug === 'index')
  if (slug === 'index') {
    // 6a. Hero Slider
    const slides = db.prepare('SELECT * FROM slides WHERE is_active = 1 ORDER BY order_num ASC').all();
    if (slides.length > 0) {
      const $banners = $('.khung-slider-chinh .banner');
      slides.forEach((slide, idx) => {
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

    // Hero Stationary Overlay Text (Desktop & Mobile)
    ['#text-3924357870', '#text-1466038440'].forEach(sel => {
      $(sel + ' .highlight-text').text('TRƯỜNG ĐẠI HỌC CMC • BAN ĐẠI HỌC SỐ');
      const h1s = $(sel + ' h1');
      if (h1s.length >= 3) {
        $(h1s[0]).text('TIÊN PHONG');
        $(h1s[1]).text('SÁNG TẠO');
        $(h1s[2]).text('BỨT PHÁ');
      }
      $(sel + ' .subtext').text('Mô hình Đại học AI đầu tiên tại Việt Nam – Đào tạo gắn liền công nghệ và doanh nghiệp toàn cầu.');
    });

    // 6b. Section 1 (Intro: VỀ BAN ĐẠI HỌC SỐ & TRƯỜNG ĐẠI HỌC CMC)
    $('#section_865356580 img').attr('src', '/uploads/bds-ai-lab-whiteboard.jpg');
    $('#text-524056605 h4').text('VỀ BAN ĐẠI HỌC SỐ & TRƯỜNG ĐẠI HỌC CMC');
    $('#text-1746365312 h1').text('Mô hình đại học AI tiên phong, dẫn đầu xu thế chuyển đổi số giáo dục đại học tại Việt Nam');
    $('#text-428433913 p').html(`
      Trường Đại học CMC (tiền thân là Trường Đại học Á Châu) được đầu tư bởi <strong>Tập đoàn Công nghệ CMC</strong> – một trong những tập đoàn công nghệ hàng đầu Việt Nam. Với sứ mệnh trở thành Đại học Thông minh, <strong>Đại học AI đầu tiên tại Việt Nam</strong>, Ban Đại học số đóng vai trò nòng cốt trong chiến lược số hóa toàn diện hệ thống quản trị, chương trình đào tạo số, hệ sinh thái học tập AI-Native và trung tâm dữ liệu thông minh, mang đến môi trường giáo dục chuẩn quốc tế, gắn liền thực tiễn doanh nghiệp.
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
    $('#section_466373946 h2, #section_1212534044 h2, #section_720290466 h2').first().text('TRỤ CỘT ĐÀO TẠO & CHUYỂN ĐỔI SỐ');
    $('#section_466373946 p, #section_1212534044 p, #section_720290466 p').first().text('Hệ sinh thái Giáo dục Thông minh - AI-Native');

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
