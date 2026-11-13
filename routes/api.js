const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cheerio = require('cheerio');
const { db } = require('../lib/db');
const { requireAdmin } = require('../lib/auth');

// Multer storage for uploads
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e4);
    cb(null, `${safeBase}-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Public Contact Form Submission
router.post('/contact', (req, res) => {
  const { firstname, lastname, company, email, phone, message } = req.body;
  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email hoặc số điện thoại.' });
  }

  const stmt = db.prepare(`
    INSERT INTO contacts (firstname, lastname, company, email, phone, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(firstname || '', lastname || '', company || '', email || '', phone || '', message || '');

  // If request came from standard form POST without fetch
  if (!req.xhr && !req.headers.accept?.includes('application/json')) {
    return res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Liên hệ thành công</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/releases/v7.1.0/css/all.css">
      <style>
        body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin:0; background: #002757; color: white; text-align: center; }
        .box { background: white; color: #1e293b; padding: 40px; border-radius: 12px; max-width: 480px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .btn { display: inline-block; margin-top: 20px; padding: 12px 26px; background: #008fd5; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 6px; }
      </style>
      </head>
      <body>
        <div class="box">
          <i class="fa fa-circle-check" style="font-size: 50px; color: #10b981;"></i>
          <h2>Gửi yêu cầu thành công!</h2>
          <p>Cảm ơn bạn đã gửi thông tin đến Trường Đại học CMC & Ban Đại học số CMC. Ban tuyển sinh và đào tạo số sẽ liên hệ lại trong thời gian sớm nhất.</p>
          <a href="/lien-he/" class="btn">Quay lại trang web</a>
        </div>
      </body></html>
    `);
  }

  res.json({ success: true, message: 'Cảm ơn bạn đã liên hệ! Trường Đại học CMC - Ban Đại học số sẽ liên hệ lại sớm nhất.' });
});

// Admin Image Upload
router.post('/admin/upload-image', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Chưa chọn file ảnh.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// Admin Save Live Edits
router.post('/admin/save-live-edits', requireAdmin, (req, res) => {
  const { page_slug, edits } = req.body;
  if (!page_slug || !Array.isArray(edits)) {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ.' });
  }

  const upsert = db.prepare(`
    INSERT INTO page_edits (page_slug, element_id, content_type, content_value, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(page_slug, element_id) DO UPDATE SET
      content_value = excluded.content_value,
      content_type = excluded.content_type,
      updated_at = CURRENT_TIMESTAMP
  `);

  for (const edit of edits) {
    if (edit.element_id && edit.content_value !== undefined) {
      upsert.run(page_slug, edit.element_id, edit.content_type || 'text', String(edit.content_value));
    }
  }

  res.json({ success: true, message: 'Đã lưu thay đổi thành công!' });
});

// Admin Save Settings
router.post('/admin/settings', requireAdmin, (req, res) => {
  const settings = req.body;
  const upsert = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  for (const [k, v] of Object.entries(settings)) {
    upsert.run(k, String(v));
  }
  res.json({ success: true, message: 'Đã lưu cài đặt website!' });
});

// Admin Slide CRUD
router.post('/admin/slides', requireAdmin, (req, res) => {
  const { id, title, subtitle, image_url, btn_text, btn_link, order_num } = req.body;
  if (id) {
    db.prepare(`
      UPDATE slides SET title=?, subtitle=?, image_url=?, btn_text=?, btn_link=?, order_num=?
      WHERE id=?
    `).run(title, subtitle, image_url, btn_text, btn_link, order_num || 0, id);
  } else {
    db.prepare(`
      INSERT INTO slides (title, subtitle, image_url, btn_text, btn_link, order_num)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, subtitle, image_url, btn_text, btn_link, order_num || 0);
  }
  res.json({ success: true });
});

router.delete('/admin/slides/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM slides WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Admin Service Update
router.post('/admin/services', requireAdmin, (req, res) => {
  const { id, title, short_desc, icon_url, cover_url, order_num } = req.body;
  db.prepare(`
    UPDATE services SET title=?, short_desc=?, icon_url=?, cover_url=?, order_num=?
    WHERE id=?
  `).run(title, short_desc, icon_url, cover_url, order_num || 0, id);
  res.json({ success: true });
});

// Admin Posts CRUD
router.post('/admin/posts', requireAdmin, (req, res) => {
  const { id, title, category, excerpt, content_html, featured_img } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Tiêu đề không được trống.' });

  const slug = title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (id) {
    db.prepare(`
      UPDATE posts SET title=?, category=?, excerpt=?, content_html=?, featured_img=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(title, category || 'Tin tức', excerpt || '', content_html || '', featured_img || '', id);
  } else {
    db.prepare(`
      INSERT INTO posts (slug, title, category, excerpt, content_html, featured_img)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(slug + '-' + Date.now().toString().slice(-4), title, category || 'Tin tức', excerpt || '', content_html || '', featured_img || '');
  }
  res.json({ success: true });
});

router.delete('/admin/posts/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Admin Partner / Client Logo CRUD
router.post('/admin/partners', requireAdmin, (req, res) => {
  const { id, name, type, logo_url, order_num } = req.body;
  if (id) {
    db.prepare('UPDATE partners SET name=?, type=?, logo_url=?, order_num=? WHERE id=?').run(name, type, logo_url, order_num || 0, id);
  } else {
    db.prepare('INSERT INTO partners (name, type, logo_url, order_num) VALUES (?, ?, ?, ?)').run(name, type, logo_url, order_num || 0);
  }
  res.json({ success: true });
});

router.delete('/admin/partners/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM partners WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Delete contact submission
router.delete('/admin/contacts/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Admin Change Password
router.post('/admin/change-password', requireAdmin, (req, res) => {
  const { current_password, new_password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get('admin');
  const { verifyPassword, hashPassword } = require('../lib/db');

  if (!verifyPassword(current_password, user.password_hash, user.salt)) {
    return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
  }

  const { hash, salt } = hashPassword(new_password);
  db.prepare('UPDATE admin_users SET password_hash = ?, salt = ? WHERE username = ?').run(hash, salt, 'admin');
  res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
});

module.exports = router;
