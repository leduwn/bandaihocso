const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'acac.db');
const db = new DatabaseSync(DB_PATH);

console.log('Seeding CMCU & Ban Đại học số data into database...');

// 1. Update Settings
const settingsData = [
  ['site_name', 'TRƯỜNG ĐẠI HỌC CMC - BAN ĐẠI HỌC SỐ CMC'],
  ['slogan', 'TIÊN PHONG - SÁNG TẠO - MÔ HÌNH ĐẠI HỌC AI'],
  ['sub_slogan', 'Đại học số tiên phong thuộc Tập đoàn Công nghệ CMC - Dẫn đầu kỷ nguyên trí tuệ nhân tạo.'],
  ['hotline', '024 7102 9999 / 0984 270 476'],
  ['email', 'daihocso@cmc.edu.vn'],
  ['hanoi_address', 'Tòa nhà CMC, Phố Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội'],
  ['hcm_address', 'Số 84, Đường Nguyễn Thanh Bình, P. Vạn Phúc, Q. Hà Đông, Hà Nội'],
  ['facebook_url', 'https://www.facebook.com/truongdaihoccmc'],
  ['linkedin_url', 'https://www.linkedin.com/school/cmc-university/'],
  ['youtube_url', 'https://www.youtube.com/@cmcuniversity'],
  ['logo_url', '/uploads/cmcu-brand-horizontal.png'],
  ['stat_years', 'TOP 1'],
  ['stat_years_label', 'Đại học AI đầu tiên tại Việt Nam'],
  ['stat_clients', '96 TỶ'],
  ['stat_clients_label', 'Quỹ học bổng "CMC - Vì bạn xứng đáng"'],
  ['stat_experts', '100%'],
  ['stat_experts_label', 'Cam kết việc làm tại CMC & đối tác toàn cầu'],
  ['stat_success', '30+'],
  ['stat_success_label', 'Đối tác công nghệ & đại học quốc tế hàng đầu']
];

const upsertSetting = db.prepare(`
  INSERT INTO settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);
for (const [k, v] of settingsData) {
  upsertSetting.run(k, v);
}

// 2. Replace Slides
db.exec('DELETE FROM slides');
const insertSlide = db.prepare(`
  INSERT INTO slides (title, subtitle, image_url, btn_text, btn_link, order_num, is_active)
  VALUES (?, ?, ?, ?, ?, ?, 1)
`);

insertSlide.run(
  'TRƯỜNG ĐẠI HỌC CMC - ĐẠI HỌC SỐ TIÊN PHONG',
  'Mô hình đại học AI đầu tiên tại Việt Nam - Trực thuộc Tập đoàn Công nghệ CMC',
  '/uploads/cmcu-ai-native.jpg',
  'KHÁM PHÁ NGAY',
  '/gioi-thieu/',
  1
);

insertSlide.run(
  'BAN ĐẠI HỌC SỐ CMC - KIẾN TẠO TƯƠNG LAI GIÁO DỤC SỐ',
  'Chuyển đổi số toàn diện - Kết nối giáo dục thông minh và hệ sinh thái công nghệ AI',
  '/uploads/cmcu-hero-ojt.jpg',
  'HỌC KỲ DOANH NGHIỆP',
  '/dich-vu-cua-chung-toi/',
  2
);

insertSlide.run(
  'QUỸ HỌC BỔNG "CMC - VÌ BẠN XỨNG ĐÁNG" 96 TỶ ĐỒNG',
  'Tặng máy tính bảng cho 100% tân sinh viên nhập học năm 2026',
  '/uploads/cmcu-campus-life.jpg',
  'NỘP HỒ SƠ XÉT TUYỂN',
  '/lien-he/',
  3
);

// 3. Replace Services
db.exec('DELETE FROM services');
const insertService = db.prepare(`
  INSERT INTO services (slug, title, short_desc, icon_url, cover_url, order_num)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const servicesList = [
  {
    slug: 'dao-tao-ai-va-cong-nghe-so',
    title: 'Đào tạo AI & Công nghệ số (AI-Native)',
    short_desc: 'Mô hình đại học AI tiên phong, tích hợp trí tuệ nhân tạo toàn diện vào chương trình đào tạo và nghiên cứu ứng dụng.',
    icon_url: '/wp-content/uploads/2025/10/8-1.png',
    cover_url: '/uploads/cmcu-ai-native.jpg',
    order_num: 1
  },
  {
    slug: 'he-thong-hoc-tap-so-lms-smart-campus',
    title: 'Hệ thống LMS & Smart Campus',
    short_desc: 'Hạ tầng học tập số thông minh, cá nhân hóa lộ trình đào tạo, quản lý tiến độ học tập trên nền tảng Cloud hiện đại.',
    icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-13.png',
    cover_url: '/uploads/cmcu-campus-life.jpg',
    order_num: 2
  },
  {
    slug: 'hoc-ky-doanh-nghiep-ojt',
    title: 'Học kỳ On-the-Job Training (OJT)',
    short_desc: '100% sinh viên được đào tạo và làm việc thực tế tại Tập đoàn CMC và mạng lưới đối tác công nghệ quốc tế.',
    icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-10.png',
    cover_url: '/uploads/cmcu-hero-ojt.jpg',
    order_num: 3
  },
  {
    slug: 'vi-mach-ban-dan-an-ninh-mang',
    title: 'Vi mạch Bán dẫn & An ninh mạng',
    short_desc: 'Chương trình chuẩn quốc tế, hợp tác cùng các tập đoàn hàng đầu thế giới giải quyết bài toán nhân lực công nghệ cao.',
    icon_url: '/wp-content/uploads/2025/10/Gemini_Generated_Image_6ni47e6ni47e6ni4-removebg-preview-1.png',
    cover_url: '/uploads/cmcu-ai-era.jpg',
    order_num: 4
  },
  {
    slug: 'chuyen-doi-so-giao-duc-dai-hoc',
    title: 'Chuyển đổi số Giáo dục Đại học',
    short_desc: 'Nghiên cứu, tư vấn và chuyển giao các giải pháp chuyển đổi số toàn diện cho các trường đại học và tổ chức giáo dục.',
    icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-12.png',
    cover_url: '/uploads/cmcu-intl-collab.jpg',
    order_num: 5
  },
  {
    slug: 'hoc-bong-cmc-vi-ban-xung-dang',
    title: 'Học bổng CMC 96 Tỷ đồng',
    short_desc: 'Chính sách học bổng toàn phần, học bổng tài năng chắp cánh ước mơ công nghệ cho thế hệ trẻ xuất sắc.',
    icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-11-1.png',
    cover_url: '/uploads/cmcu-campus-life.jpg',
    order_num: 6
  },
  {
    slug: 'hop-tac-quoc-te-song-bang',
    title: 'Hợp tác Quốc tế & Song bằng',
    short_desc: 'Liên kết đào tạo với Đại học Southern Queensland (Úc) và các trường đại học danh tiếng tại Mỹ, Nhật Bản, Hàn Quốc.',
    icon_url: '/wp-content/uploads/2025/10/8-1.png',
    cover_url: '/uploads/cmcu-intl-collab.jpg',
    order_num: 7
  },
  {
    slug: 'trung-tam-doi-moi-sang-tao-so',
    title: 'Vườn ươm Đổi mới sáng tạo & AI Hub',
    short_desc: 'Hỗ trợ dự án khởi nghiệp công nghệ, vườn ươm sản phẩm số và tài trợ nghiên cứu ứng dụng cho giảng viên, sinh viên.',
    icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-13.png',
    cover_url: '/uploads/cmcu-ai-native.jpg',
    order_num: 8
  },
  {
    slug: 'dao-tao-ky-nang-so-doanh-nghiep',
    title: 'Đào tạo Năng lực số Doanh nghiệp',
    short_desc: 'Khóa đào tạo chuyên sâu về AI, An toàn thông tin, Data Science và quản trị số dành cho các tập đoàn, doanh nghiệp.',
    icon_url: '/wp-content/uploads/2025/10/Thiet-ke-chua-co-ten-10.png',
    cover_url: '/uploads/cmcu-hero-ojt.jpg',
    order_num: 9
  }
];

for (const s of servicesList) {
  insertService.run(s.slug, s.title, s.short_desc, s.icon_url, s.cover_url, s.order_num);
}

// 4. Update Posts
db.exec('DELETE FROM posts');
const insertPost = db.prepare(`
  INSERT INTO posts (slug, title, category, excerpt, content_html, featured_img)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const postsList = [
  {
    slug: 'truong-dai-hoc-cmc-mo-hinh-dai-hoc-ai-dau-tien-tai-viet-nam',
    title: 'Trường Đại học CMC – Mô hình đại học AI đầu tiên tại Việt Nam',
    category: 'Tin tức & Sự kiện',
    excerpt: 'Trường Đại học CMC định hướng trở thành trường đại học thông minh, tiên phong trong nghiên cứu và ứng dụng trí tuệ nhân tạo (AI-Native) tại Việt Nam.',
    content_html: '<p>Trường Đại học CMC (tiền thân là Trường Đại học Á Châu) được thành lập và đầu tư bởi Tập đoàn Công nghệ CMC. Với định hướng chiến lược trở thành Đại học Thông minh (Smart University) và Đại học AI đầu tiên tại Việt Nam, nhà trường tiên phong ứng dụng công nghệ số và trí tuệ nhân tạo vào toàn bộ công tác giảng dạy, học tập và quản trị.</p><p>Ban Đại học số CMC giữ vai trò nòng cốt trong việc xây dựng kiến trúc số, phát triển các nền tảng học tập thông minh LMS, hệ thống phân tích dữ liệu học tập cá nhân hóa và số hóa 100% quy trình học vụ cho sinh viên.</p>',
    featured_img: '/uploads/cmcu-ai-native.jpg'
  },
  {
    slug: 'toa-dam-he-sinh-thai-hoc-tap-ai-native-kham-pha-cach-hoc-moi',
    title: 'Tọa đàm “Hệ sinh thái học tập AI-Native – Khám phá cách học mới”',
    category: 'Chuyển đổi số',
    excerpt: 'Sự kiện do Ban Đại học số phối hợp cùng các chuyên gia CMC tổ chức nhằm giới thiệu trải nghiệm học tập thế hệ mới cùng AI Assistant.',
    content_html: '<p>Tại buổi tọa đàm, các diễn giả từ Tập đoàn CMC và Trường Đại học CMC đã chia sẻ về phương pháp tiếp cận AI trong giáo dục đại học. Sinh viên không chỉ học về AI mà còn học cùng AI, sử dụng trợ lý ảo thông minh để giải đáp thắc mắc học tập 24/7 và rèn luyện kỹ năng thực chiến.</p>',
    featured_img: '/uploads/cmcu-hero-ojt.jpg'
  },
  {
    slug: 'sinh-vien-cmcu-san-sang-cho-hoc-ky-on-the-job-training-tai-tap-doan-cmc',
    title: 'Sinh viên CMCU sẵn sàng cho Học kỳ On-the-Job Training tại Tập đoàn CMC',
    category: 'Hợp tác Doanh nghiệp',
    excerpt: '100% sinh viên CMCU bước vào kỳ thực tập doanh nghiệp tại các công ty thành viên như CMC Global, CMC Telecom, CMC Cyber Security.',
    content_html: '<p>Chương trình On-the-Job Training (OJT) là điểm nhấn nổi bật trong mô hình đào tạo của Trường Đại học CMC. Sinh viên được trực tiếp tham gia vào các dự án công nghệ thực tế, làm việc cùng các kỹ sư cao cấp và nhận trợ cấp thực tập hấp dẫn ngay từ năm thứ ba.</p>',
    featured_img: '/uploads/cmcu-hero-ojt.jpg'
  },
  {
    slug: 'truong-dai-hoc-cmc-lam-viec-voi-dai-hoc-southern-queensland-uc',
    title: 'Trường Đại học CMC làm việc với Đại học Southern Queensland (Úc)',
    category: 'Hợp tác Quốc tế',
    excerpt: 'Mở rộng cơ hội hợp tác đào tạo quốc tế, trao đổi sinh viên và cấp song bằng cử nhân chuẩn toàn cầu.',
    content_html: '<p>Lãnh đạo Trường Đại học CMC và đại diện Đại học Southern Queensland (Úc) đã thảo luận về các chương trình liên kết đào tạo ngành Khoa học Máy tính, Trí tuệ nhân tạo và Quản trị kinh doanh số. Hợp tác này mang đến cơ hội học tập tại nước ngoài với chi phí tối ưu cho sinh viên CMCU.</p>',
    featured_img: '/uploads/cmcu-intl-collab.jpg'
  }
];

for (const p of postsList) {
  insertPost.run(p.slug, p.title, p.category, p.excerpt, p.content_html, p.featured_img);
}

// 5. Update Partners
db.exec('DELETE FROM partners');
const insertPartner = db.prepare(`
  INSERT INTO partners (name, type, logo_url, order_num)
  VALUES (?, ?, ?, ?)
`);

const partnersList = [
  { name: 'Tập đoàn Công nghệ CMC', type: 'partner', logo_url: '/uploads/cmcu-brand-horizontal.png' },
  { name: 'CMC Global', type: 'partner', logo_url: '/wp-content/uploads/2025/10/PETROLIMEX-scaled.png' },
  { name: 'CMC Telecom', type: 'partner', logo_url: '/wp-content/uploads/2025/10/MOBIFONE-scaled.png' },
  { name: 'CMC Cyber Security', type: 'partner', logo_url: '/wp-content/uploads/2025/10/FOXCONN-scaled.png' },
  { name: 'Samsung SDS', type: 'client', logo_url: '/wp-content/uploads/2025/10/TOSIBA-scaled.png' },
  { name: 'Microsoft', type: 'client', logo_url: '/wp-content/uploads/2025/10/DOOSAN-scaled.png' },
  { name: 'Synopsys', type: 'client', logo_url: '/wp-content/uploads/2025/10/KOKUYO-scaled.png' },
  { name: 'CoAsia SEMI', type: 'client', logo_url: '/wp-content/uploads/2025/10/SON-HA-scaled.png' }
];

let ord = 1;
for (const pt of partnersList) {
  insertPartner.run(pt.name, pt.type, pt.logo_url, ord++);
}

console.log('Successfully seeded CMCU & Ban Đại học số brand data.');
