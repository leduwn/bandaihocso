const express = require('express');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const { sessionMiddleware } = require('./lib/auth');
const { renderPage, resolveHtmlFile, getSettings } = require('./lib/render');
const { db } = require('./lib/db');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parsers & Session
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(sessionMiddleware);

// Static assets
app.use('/admin-assets', express.static(path.join(__dirname, 'public', 'admin-assets')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// API and Admin Routes
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Dynamic Single Post Route (/bai-viet/:slug)
app.get('/bai-viet/:slug', (req, res) => {
  const { slug } = req.params;
  const post = db.prepare('SELECT * FROM posts WHERE slug = ?').get(slug);
  if (!post) {
    return res.status(404).send(renderPage('/tin-tuc-su-kien/', req));
  }

  // Use an article template from clean pages
  const templatePath = path.join(__dirname, 'data', 'clean_pages', 'ban-tin-thang-12.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });

  $('head').append('<link rel="stylesheet" href="/cmcu-brand.css">');
  $('title').text(`${post.title} - Trường Đại học CMC | Ban Đại học số`);
  $('.entry-title').text(post.title);
  $('.entry-category, .badge').first().text(post.category || 'Tin tức & Sự kiện');
  $('.post-date, .entry-date').first().text(new Date(post.created_at).toLocaleDateString('vi-VN'));
  if (post.featured_img) {
    $('.entry-image img, .featured-image img').first().attr('src', post.featured_img);
  }
  $('.entry-content').html(`
    ${post.excerpt ? `<p style="font-weight:600; font-size:16px; color:#475569;">${post.excerpt}</p><hr style="margin:20px 0;">` : ''}
    <div>${post.content_html || '<p>Nội dung đang được cập nhật.</p>'}</div>
  `);

  res.send($.html());
});

// Cloned Site Catch-All Route
app.get('*', (req, res) => {
  const reqPath = req.path;

  // Skip favicon/robots if static served or missing
  if (reqPath === '/favicon.ico') {
    return res.sendFile(path.join(__dirname, 'public', 'uploads', 'ban-dai-hoc-so-logo.png'));
  }

  try {
    const renderedHtml = renderPage(reqPath, req);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderedHtml);
  } catch (err) {
    console.error(`Error rendering ${reqPath}:`, err);
    res.status(500).send(`Server Error: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log('===========================================================');
  console.log(`[TRƯỜNG ĐẠI HỌC CMC & BAN ĐẠI HỌC SỐ - CMS LIVE]`);
  console.log(`Website:            http://localhost:${PORT}`);
  console.log(`Admin Portal:       http://localhost:${PORT}/admin`);
  console.log(`Admin Login:        admin / admin123`);
  console.log('===========================================================');
});
