const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'data', 'acac.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    salt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    btn_text TEXT,
    btn_link TEXT,
    order_num INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    title TEXT,
    short_desc TEXT,
    icon_url TEXT,
    cover_url TEXT,
    order_num INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    title TEXT,
    category TEXT,
    excerpt TEXT,
    content_html TEXT,
    featured_img TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT, -- 'partner' or 'client'
    logo_url TEXT,
    order_num INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstname TEXT,
    lastname TEXT,
    company TEXT,
    email TEXT,
    phone TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS page_edits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_slug TEXT,
    element_id TEXT,
    content_type TEXT, -- 'text' or 'image'
    content_value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(page_slug, element_id)
  );
`);

// Password hashing helpers
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const check = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return check === hash;
}

// Ensure default admin user: admin / admin123
const checkAdmin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get('admin');
if (!checkAdmin) {
  const { hash, salt } = hashPassword('admin123');
  db.prepare('INSERT INTO admin_users (username, password_hash, salt) VALUES (?, ?, ?)').run('admin', hash, salt);
  console.log('[DB] Created default admin account: admin / admin123');
}

// Helper to seed initial settings if not present
function initDefaultData() {
  const checkSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (checkSettings.count === 0) {
    const defaults = {
      site_name: 'CÔNG TY TNHH TƯ VẤN VÀ KIỂM TOÁN ANH (ACAC)',
      slogan: 'HIỆU QUẢ - AN TOÀN - BỀN VỮNG',
      sub_slogan: 'Dịch vụ kế toán, kiểm toán và tư vấn thuế hàng đầu Việt Nam.',
      hotline: '024 3783 5666 / 0989 388 888',
      email: 'contact@acacvn.com',
      hanoi_address: 'Tầng 12, Tòa nhà Licogi 13, 164 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội',
      hcm_address: 'Tầng 5, Tòa nhà Songdo, 62A Phạm Ngọc Thạch, Phường 6, Quận 3, TP. Hồ Chí Minh',
      facebook_url: 'https://www.facebook.com/acacvn',
      linkedin_url: 'https://www.linkedin.com/company/acac-audit-consulting',
      youtube_url: 'https://www.youtube.com/@acacvn',
      logo_url: '/wp-content/uploads/2025/12/Logo-1.png',
      stat_years: '21+',
      stat_years_label: 'Năm kinh nghiệm chuyên sâu',
      stat_clients: '1000+',
      stat_clients_label: 'Khách hàng doanh nghiệp tin cậy',
      stat_experts: '80+',
      stat_experts_label: 'Chuyên gia và nhân sự chất lượng cao',
      stat_success: '99%',
      stat_success_label: 'Tỷ lệ hài lòng từ khách hàng'
    };

    const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(defaults)) {
      insertSetting.run(k, v);
    }
  }

  // Seed default slides if empty
  const checkSlides = db.prepare('SELECT COUNT(*) as count FROM slides').get();
  if (checkSlides.count === 0) {
    const insertSlide = db.prepare('INSERT INTO slides (title, subtitle, image_url, btn_text, btn_link, order_num) VALUES (?, ?, ?, ?, ?, ?)');
    insertSlide.run(
      'HIỆU QUẢ - AN TOÀN - BỀN VỮNG',
      'Đồng hành cùng doanh nghiệp kiến tạo giá trị thịnh vượng',
      '/wp-content/uploads/2025/12/Anh-bia-phan-slogan-1@4x-1024x559.webp',
      'ĐẶT LỊCH TƯ VẤN NGAY',
      '/lien-he/',
      1
    );
    insertSlide.run(
      'DỊCH VỤ KIỂM TOÁN & TƯ VẤN HÀNG ĐẦU',
      'Chuẩn mực quốc tế, thấu hiểu môi trường kinh doanh tại Việt Nam',
      '/wp-content/uploads/2025/12/Anh-bia-phan-slogan-2@4x-1024x559.webp',
      'KHÁM PHÁ DỊCH VỤ',
      '/dich-vu-cua-chung-toi/',
      2
    );
  }

  // Seed default services if empty
  const checkServices = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (checkServices.count === 0) {
    const servicesList = [
      {
        slug: 'dich-vu-tu-van-thue-va-dai-ly-thue',
        title: 'Dịch vụ tư vấn thuế và đại lý thuế',
        short_desc: 'Tối ưu hóa chi phí thuế, đảm bảo tuân thủ pháp luật và giảm thiểu rủi ro pháp lý cho doanh nghiệp.',
        icon_url: '/wp-content/uploads/2025/10/8-1.png',
        cover_url: '/wp-content/uploads/2025/11/7.-Thue-1-scaled.png',
        order_num: 1
      },
      {
        slug: 'dich-vu-kiem-toan',
        title: 'Dịch vụ kiểm toán',
        short_desc: 'Kiểm toán báo cáo tài chính, kiểm toán nội bộ và kiểm toán quyết toán dự án theo chuẩn mực chuyên nghiệp.',
        icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-13.png',
        cover_url: '/wp-content/uploads/2025/11/5.-Kiem-toan-scaled.png',
        order_num: 2
      },
      {
        slug: 'dich-vu-ke-toan',
        title: 'Dịch vụ kế toán',
        short_desc: 'Giải pháp kế toán trọn gói, lập báo cáo tài chính, soát xét sổ sách kế toán chính xác và minh bạch.',
        icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-10.png',
        cover_url: '/wp-content/uploads/2025/11/4.-Ke-toan-scaled.png',
        order_num: 3
      },
      {
        slug: 'tu-van-tai-chinh-doanh-nghiep',
        title: 'Tư vấn tài chính doanh nghiệp',
        short_desc: 'Tái cấu trúc tài chính, định giá doanh nghiệp, thẩm định dự án đầu tư và huy động vốn hiệu quả.',
        icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-9.png',
        cover_url: '/wp-content/uploads/2025/11/2.-TCDN-scaled.png',
        order_num: 4
      },
      {
        slug: 'tu-van-giai-phap-quan-ly',
        title: 'Tư vấn giải pháp quản lý',
        short_desc: 'Xây dựng quy chế quản trị, hệ thống kiểm soát nội bộ và tối ưu hóa quy trình vận hành doanh nghiệp.',
        icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-12.png',
        cover_url: '/wp-content/uploads/2025/11/6.-Quan-ly-scaled.png',
        order_num: 5
      },
      {
        slug: 'tu-van-va-dai-ly-hai-quan',
        title: 'Tư vấn và đại lý hải quan',
        short_desc: 'Thủ tục thông quan nhanh chóng, tư vấn mã HS, thuế xuất nhập khẩu và hỗ trợ sau thông quan an toàn.',
        icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-11-1.png',
        cover_url: '/wp-content/uploads/2025/10/3.-Hai-quan-scaled.png',
        order_num: 6
      },
      {
        slug: 'tu-van-phap-luat-va-kinh-doanh',
        title: 'Tư vấn pháp luật và kinh doanh',
        short_desc: 'Tư vấn thành lập doanh nghiệp, M&A, hợp đồng thương mại và giải quyết tranh chấp kinh doanh.',
        icon_url: '/wp-content/uploads/2025/10/Gemini_Generated_Image_6ni47e6ni47e6ni4-removebg-preview-1.png',
        cover_url: '/wp-content/uploads/2025/10/1.-Phap-luat-scaled.png',
        order_num: 7
      },
      {
        slug: 'dich-vu-tu-van-esg',
        title: 'Dịch vụ tư vấn ESG',
        short_desc: 'Chiến lược phát triển bền vững, báo cáo ESG theo chuẩn GRI/IFRS và kiểm kê phát thải khí nhà kính.',
        icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-14.png',
        cover_url: '/wp-content/uploads/2025/11/8.-ESG-scaled.png',
        order_num: 8
      },
      {
        slug: 'dich-vu-dao-tao',
        title: 'Dịch vụ đào tạo',
        short_desc: 'Đào tạo chuyên sâu kỹ năng kế toán, kiểm toán, quản trị thuế và cập nhật chính sách mới cho nhân sự.',
        icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-15.png',
        cover_url: '/wp-content/uploads/2025/11/9.-Dao-tao-scaled.png',
        order_num: 9
      }
    ];

    const insertService = db.prepare('INSERT INTO services (slug, title, short_desc, icon_url, cover_url, order_num) VALUES (?, ?, ?, ?, ?, ?)');
    for (const s of servicesList) {
      insertService.run(s.slug, s.title, s.short_desc, s.icon_url, s.cover_url, s.order_num);
    }
  }

  // Seed partners and clients if empty
  const checkPartners = db.prepare('SELECT COUNT(*) as count FROM partners').get();
  if (checkPartners.count === 0) {
    const insertPartner = db.prepare('INSERT INTO partners (name, type, logo_url, order_num) VALUES (?, ?, ?, ?)');
    // Alliances
    insertPartner.run('OA Alliance', 'partner', '/wp-content/uploads/2026/09/logo-oa.png', 1);
    insertPartner.run('Pantheon Law', 'partner', '/wp-content/uploads/2026/09/logo-pantheon.png', 2);
    insertPartner.run('Sakura Law Office', 'partner', '/wp-content/uploads/2026/09/logo-sakura.png', 3);

    // Clients
    const clients = [
      { name: 'Carlsberg', logo: '/wp-content/uploads/2025/10/CARLSBERG-scaled.png' },
      { name: 'LG Electronics', logo: '/wp-content/uploads/2025/10/LG-scaled.png' },
      { name: 'Petrolimex', logo: '/wp-content/uploads/2025/10/PETROLIMEX-scaled.png' },
      { name: 'MobiFone', logo: '/wp-content/uploads/2025/10/MOBIFONE-scaled.png' },
      { name: 'Foxconn', logo: '/wp-content/uploads/2025/10/FOXCONN-scaled.png' },
      { name: 'Toshiba', logo: '/wp-content/uploads/2025/10/TOSIBA-scaled.png' },
      { name: 'Doosan', logo: '/wp-content/uploads/2025/10/DOOSAN-scaled.png' },
      { name: 'Kokuyo', logo: '/wp-content/uploads/2025/10/KOKUYO-scaled.png' },
      { name: 'Sơn Hà', logo: '/wp-content/uploads/2025/10/SON-HA-scaled.png' },
      { name: 'Pegatron', logo: '/wp-content/uploads/2025/10/PEGATRON-scaled.png' },
      { name: 'Shell', logo: '/wp-content/uploads/2025/10/SHELL-scaled.png' },
      { name: 'Thạch Bàn', logo: '/wp-content/uploads/2025/10/THACH-BAN-scaled.png' }
    ];
    let ord = 10;
    for (const c of clients) {
      insertPartner.run(c.name, 'client', c.logo, ord++);
    }
  }
}

initDefaultData();

module.exports = {
  db,
  hashPassword,
  verifyPassword
};
