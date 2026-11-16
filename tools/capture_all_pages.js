const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');
const { signSession } = require('../lib/auth');
const { db } = require('../lib/db');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'screenshots');
const PAGES_DIR = path.join(__dirname, '..', 'data', 'clean_pages');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const TEMP_PROFILE = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\edge_batch_profile';

const adminToken = signSession({ id: 1, username: 'admin', isAdmin: true, ts: Date.now() });

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function takeScreenshot(url, destFile) {
  try {
    const cmd = `"${EDGE_PATH}" --headless=new --disable-gpu --user-data-dir="${TEMP_PROFILE}" --window-size=1440,900 --screenshot="${destFile}" "${url}"`;
    execSync(cmd, { stdio: 'ignore', timeout: 30000 });
    return fs.existsSync(destFile);
  } catch (err) {
    console.error(`Error capturing ${url}: ${err.message}`);
    return false;
  }
}

async function fetchHtmlWithAuth(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}${urlPath}`, {
      headers: { 'Cookie': `acac_session=${encodeURIComponent(adminToken)}` }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== BẮT ĐẦU CHỤP CHI TIẾT TẤT CẢ CÁC TRANG CÒN LẠI ===\n');

  const dirMain = path.join(SCREENSHOTS_DIR, '01_trang_chinh');
  const dirAdmin = path.join(SCREENSHOTS_DIR, '02_quan_tri_admin');
  const dirServices = path.join(SCREENSHOTS_DIR, '03_dich_vu_chi_tiet');
  const dirArticles = path.join(SCREENSHOTS_DIR, '04_bai_viet_tin_tuc');
  const dirEn = path.join(SCREENSHOTS_DIR, '05_tieng_anh_en');

  [dirMain, dirAdmin, dirServices, dirArticles, dirEn].forEach(ensureDir);

  // Copy existing 10 main screenshots to 01_trang_chinh
  const existingScreenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png') && !fs.statSync(path.join(SCREENSHOTS_DIR, f)).isDirectory());
  for (const f of existingScreenshots) {
    const src = path.join(SCREENSHOTS_DIR, f);
    const dest = path.join(dirMain, f);
    if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  }
  console.log(`[01_trang_chinh] Đã lưu trữ ${existingScreenshots.length} trang chính.`);

  // 1. Capture Admin Pages
  console.log('\n--- 1. Chụp các trang Quản trị Admin ---');
  const adminPages = [
    { route: '/', name: '00_admin_tong_quan.png', title: 'Tổng quan Dashboard' },
    { route: '/settings', name: '01_admin_cai_dat_chung.png', title: 'Cài đặt chung' },
    { route: '/pages', name: '02_admin_quan_ly_trang.png', title: 'Quản lý trang & Visual Live Editor' },
    { route: '/slides', name: '03_admin_banner_slider.png', title: 'Quản lý Banner Slider' },
    { route: '/services', name: '04_admin_dich_vu.png', title: 'Quản lý 9 nhóm dịch vụ' },
    { route: '/posts', name: '05_admin_tin_tuc_bai_viet.png', title: 'Quản lý tin tức & bài viết' },
    { route: '/partners', name: '06_admin_doi_tac_khach_hang.png', title: 'Quản lý đối tác & khách hàng' },
    { route: '/contacts', name: '07_admin_khach_hang_lien_he.png', title: 'Khách hàng liên hệ' },
    { route: '/account', name: '08_admin_tai_khoan.png', title: 'Tài khoản admin' }
  ];

  for (const p of adminPages) {
    const dest = path.join(dirAdmin, p.name);
    if (fs.existsSync(dest)) {
      console.log(`[Bỏ qua - đã có] ${p.name} (${p.title})`);
      continue;
    }
    const html = await fetchHtmlWithAuth(`/admin${p.route === '/' ? '' : p.route}`);
    const tempFile = path.join(PUBLIC_DIR, `temp_adm_${p.name}.html`);
    fs.writeFileSync(tempFile, html, 'utf8');
    const ok = takeScreenshot(`${BASE_URL}/temp_adm_${p.name}.html`, dest);
    fs.unlinkSync(tempFile);
    console.log(`[Admin] ${p.name}: ${ok ? 'OK' : 'LỖI'}`);
  }

  // 2. Capture Detailed Service Subpages
  console.log('\n--- 2. Chụp các trang Dịch vụ chi tiết ---');
  const allCleanFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));
  const serviceFiles = allCleanFiles.filter(f => f.startsWith('dich-vu-cua-chung-toi__'));

  for (const f of serviceFiles) {
    const baseSlug = f.replace(/\.html$/, '');
    const urlPath = '/' + baseSlug.replace(/__/g, '/') + '/';
    const cleanName = baseSlug.replace(/^dich-vu-cua-chung-toi__/, '') + '.png';
    const dest = path.join(dirServices, cleanName);

    if (fs.existsSync(dest)) {
      console.log(`[Bỏ qua - đã có] ${cleanName}`);
      continue;
    }
    const ok = takeScreenshot(`${BASE_URL}${urlPath}`, dest);
    console.log(`[Dịch vụ] ${cleanName}: ${ok ? 'OK' : 'LỖI'}`);
  }

  // 3. Capture Dynamic Posts from SQLite
  console.log('\n--- 3. Chụp các bài viết động (/bai-viet/:slug) ---');
  const dbPosts = db.prepare('SELECT slug, title FROM posts').all();
  for (const post of dbPosts) {
    const cleanName = `bai_viet__${post.slug}.png`;
    const dest = path.join(dirArticles, cleanName);
    if (fs.existsSync(dest)) {
      console.log(`[Bỏ qua - đã có] ${cleanName}`);
      continue;
    }
    const ok = takeScreenshot(`${BASE_URL}/bai-viet/${post.slug}`, dest);
    console.log(`[Bài viết động] ${post.slug}: ${ok ? 'OK' : 'LỖI'}`);
  }

  // 4. Capture Articles/Bulletins/News from clean_pages
  console.log('\n--- 4. Chụp toàn bộ Tin tức, Bản tin, Phân tích thị trường ---');
  const articleFiles = allCleanFiles.filter(f => {
    return !f.startsWith('dich-vu-cua-chung-toi__') &&
           !f.startsWith('en__') &&
           !['index.html', 'gioi-thieu.html', 'dich-vu-cua-chung-toi.html', 'cac-phan-tich-chuyen-sau.html', 'co-hoi-nghe-nghiep.html', 'tin-tuc-su-kien.html', 'lien-he.html'].includes(f);
  });

  for (const f of articleFiles) {
    const baseSlug = f.replace(/\.html$/, '');
    const urlPath = '/' + baseSlug.replace(/__/g, '/') + '/';
    let safeName = baseSlug.replace(/%/g, '_').substring(0, 80) + '.png';
    const dest = path.join(dirArticles, safeName);

    if (fs.existsSync(dest)) {
      console.log(`[Bỏ qua - đã có] ${safeName}`);
      continue;
    }
    const ok = takeScreenshot(`${BASE_URL}${urlPath}`, dest);
    console.log(`[Tin tức/Bài viết] ${safeName}: ${ok ? 'OK' : 'LỖI'}`);
  }

  // 5. Capture English Pages (en/...)
  console.log('\n--- 5. Chụp toàn bộ các trang Tiếng Anh (English Version) ---');
  const enFiles = allCleanFiles.filter(f => f.startsWith('en__'));
  for (const f of enFiles) {
    const baseSlug = f.replace(/\.html$/, '');
    const urlPath = '/' + baseSlug.replace(/__/g, '/') + '/';
    const cleanName = baseSlug.replace(/^en__/, 'en_') + '.png';
    const dest = path.join(dirEn, cleanName);

    if (fs.existsSync(dest)) {
      console.log(`[Bỏ qua - đã có] ${cleanName}`);
      continue;
    }
    const ok = takeScreenshot(`${BASE_URL}${urlPath}`, dest);
    console.log(`[Tiếng Anh] ${cleanName}: ${ok ? 'OK' : 'LỖI'}`);
  }

  console.log('\n=== HOÀN TẤT CHỤP TẤT CẢ CÁC TRANG CỦA WEBSITE ===');
}

run().catch(console.error);
