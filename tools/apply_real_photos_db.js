const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data/acac.db');

// 1. Update Slides with real photos of Ban Đại học số & CMCU
db.exec('DELETE FROM slides');
const insertSlide = db.prepare(`
  INSERT INTO slides (title, subtitle, image_url, btn_text, btn_link, order_num, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertSlide.run(
  'Lễ Khai Giảng Khóa 5 – Accelerate Your AI-X',
  'Trường Đại học CMC & Ban Đại học số tiên phong kỷ nguyên Trí tuệ nhân tạo',
  '/uploads/bds-opening-ceremony.jpg',
  'Khám phá ngay',
  '/gioi-thieu/',
  1,
  1
);

insertSlide.run(
  'Đại học AI Đầu Tiên Tại Việt Nam – CMC University',
  'Mô hình đào tạo chuẩn quốc tế, gắn kết trực tiếp cùng Tập đoàn Công nghệ CMC',
  '/uploads/bds-1st-ai-reception.jpg',
  'Tìm hiểu chương trình',
  '/dich-vu-cua-chung-toi/',
  2,
  1
);

insertSlide.run(
  'Đội ngũ Ban Đại học số – Kiến tạo Đại học Thông minh',
  'Chuyển đổi số toàn diện giáo dục đại học, phát triển hệ thống LMS & AI Smart Campus',
  '/uploads/bds-team-office.jpg',
  'Về chúng tôi',
  '/gioi-thieu/',
  3,
  1
);

console.log('Seeded real photos into slides.');

// 2. Update Services covers with real photos
const updateServiceCover = db.prepare('UPDATE services SET cover_url = ? WHERE slug = ?');
updateServiceCover.run('/uploads/bds-lecturer-student-ai.jpg', 'dao-tao-ai-cong-nghe-so-ai-native');
updateServiceCover.run('/uploads/bds-student-ai-research.jpg', 'he-thong-hoc-tap-so-lms-smart-campus');
updateServiceCover.run('/uploads/bds-classroom-guidance.jpg', 'hoc-ky-doanh-nghiep-ojt');
updateServiceCover.run('/uploads/bds-ai-lab-whiteboard.jpg', 'vi-mach-ban-dan-an-ninh-mang');
updateServiceCover.run('/uploads/bds-1st-ai-reception.jpg', 'trung-tam-du-lieu-ha-tang-cloud-ai');
updateServiceCover.run('/uploads/bds-ai-conference-poster.jpg', 'nghien-cuu-phat-trien-chuyen-giao-cong-nghe');
updateServiceCover.run('/uploads/bds-opening-ceremony.jpg', 'lien-ket-dao-tao-hop-tac-quoc-te');
updateServiceCover.run('/uploads/bds-team-office.jpg', 'vuon-uom-doi-moi-sang-tao-ai-hub');
updateServiceCover.run('/uploads/bds-teambuilding.jpg', 'dao-tao-ky-nang-so-doanh-nghiep');

console.log('Updated services cover_url with real photos.');

// 3. Update Posts with real photos
const updatePost = db.prepare('UPDATE posts SET featured_img = ? WHERE slug = ?');
updatePost.run('/uploads/bds-1st-ai-reception.jpg', 'truong-dai-hoc-cmc-mo-hinh-dai-hoc-ai-dau-tien-tai-viet-nam');
updatePost.run('/uploads/bds-lecturer-student-ai.jpg', 'toa-dam-he-sinh-thai-hoc-tap-ai-native-kham-pha-cach-hoc-moi');
updatePost.run('/uploads/bds-ai-conference-poster.jpg', 'sinh-vien-cmcu-san-sang-cho-hoc-ky-on-the-job-training-tai-tap-doan-cmc');
updatePost.run('/uploads/bds-opening-ceremony.jpg', 'truong-dai-hoc-cmc-lam-viec-voi-dai-hoc-southern-queensland-uc');

console.log('Updated posts featured_img with real photos.');
