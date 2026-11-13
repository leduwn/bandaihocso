const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db, verifyPassword } = require('../lib/db');
const { signSession, requireAdmin } = require('../lib/auth');
const { extractPageElements } = require('../lib/render');

const PAGES_DIR = path.join(__dirname, '..', 'data', 'clean_pages');

// Admin Layout wrapper
function adminLayout(title, activeTab, contentHtml, req) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - CMCU & Ban Đại học số Admin</title>
  <link rel="icon" href="/uploads/ban-dai-hoc-so-logo.png">
  <link rel="stylesheet" href="/releases/v7.1.0/css/all.css">
  <link rel="stylesheet" href="/admin-assets/admin-dashboard.css">
</head>
<body>
  <div class="admin-wrapper">
    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <div class="sidebar-brand" style="display:flex; align-items:center; gap:8px; padding: 12px 14px;">
        <img src="/uploads/cmcu-logo-blue.png" alt="CMCU" style="max-height: 28px;">
        <span style="color:#008fd5; opacity:0.6; font-size:18px;">|</span>
        <img src="/uploads/ban-dai-hoc-so-logo.png" alt="Ban Đại học số" style="max-height: 26px;">
        <span class="badge-cms" style="background:#008fd5; margin-left:auto;">CMS AI</span>
      </div>
      <nav class="sidebar-menu">
        <a href="/admin" class="nav-item ${activeTab === 'dashboard' ? 'active' : ''}">
          <i class="fa fa-gauge-high"></i> Tổng quan
        </a>
        <a href="/admin/settings" class="nav-item ${activeTab === 'settings' ? 'active' : ''}">
          <i class="fa fa-sliders"></i> Cài đặt chung
        </a>
        <a href="/admin/pages" class="nav-item ${activeTab === 'pages' ? 'active' : ''}">
          <i class="fa fa-file-lines"></i> Quản lý Trang & Live Edit
        </a>
        <a href="/admin/slides" class="nav-item ${activeTab === 'slides' ? 'active' : ''}">
          <i class="fa fa-images"></i> Banner & Slider
        </a>
        <a href="/admin/services" class="nav-item ${activeTab === 'services' ? 'active' : ''}">
          <i class="fa fa-briefcase"></i> 9 Nhóm Dịch vụ
        </a>
        <a href="/admin/posts" class="nav-item ${activeTab === 'posts' ? 'active' : ''}">
          <i class="fa fa-newspaper"></i> Tin tức & Bài viết
        </a>
        <a href="/admin/partners" class="nav-item ${activeTab === 'partners' ? 'active' : ''}">
          <i class="fa fa-handshake"></i> Đối tác & Khách hàng
        </a>
        <a href="/admin/contacts" class="nav-item ${activeTab === 'contacts' ? 'active' : ''}">
          <i class="fa fa-envelope"></i> Khách hàng Liên hệ
        </a>
        <div class="menu-divider"></div>
        <a href="/" target="_blank" class="nav-item live-view-link">
          <i class="fa fa-arrow-up-right-from-square"></i> Xem Trang chủ Live
        </a>
        <a href="/admin/account" class="nav-item ${activeTab === 'account' ? 'active' : ''}">
          <i class="fa fa-user-shield"></i> Tài khoản Admin
        </a>
        <a href="/admin/logout" class="nav-item nav-logout">
          <i class="fa fa-right-from-bracket"></i> Đăng xuất
        </a>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
      <header class="admin-header">
        <div class="header-left">
          <h2>${title}</h2>
        </div>
        <div class="header-right">
          <a href="/" target="_blank" class="btn btn-outline">
            <i class="fa fa-desktop"></i> Mở Web (Chế độ Trực quan)
          </a>
          <span class="admin-user-pill">
            <i class="fa fa-user-circle"></i> admin
          </span>
        </div>
      </header>
      <div class="admin-content-body">
        ${contentHtml}
      </div>
    </main>
  </div>
  <script src="/admin-assets/admin-app.js"></script>
</body>
</html>
  `;
}

// 1. Login Page
router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đăng nhập Quản trị - CMCU & Ban Đại học số</title>
  <link rel="icon" href="/uploads/ban-dai-hoc-so-logo.png">
  <link rel="stylesheet" href="/releases/v7.1.0/css/all.css">
  <link rel="stylesheet" href="/admin-assets/admin-dashboard.css">
</head>
<body class="login-body" style="background: linear-gradient(135deg, #002757 0%, #008fd5 100%);">
  <div class="login-card">
    <div class="login-header">
      <div style="display:inline-flex; align-items:center; gap:12px; margin-bottom:14px;">
        <img src="/uploads/cmcu-logo-blue.png" alt="CMCU" style="max-height: 36px;">
        <span style="color:#008fd5; font-size:22px; font-weight:300;">|</span>
        <div style="display:inline-flex; flex-direction:column; align-items:center;">
          <img src="/uploads/ban-dai-hoc-so-logo.png" alt="Ban Đại học số" style="max-height: 30px;">
          <span style="font-size:9px; font-weight:800; color:#002757; text-transform:uppercase; margin-top:2px;">BAN ĐẠI HỌC SỐ</span>
        </div>
      </div>
      <h3 style="color:#002757;">HỆ THỐNG QUẢN TRỊ CMCU & BAN ĐẠI HỌC SỐ</h3>
      <p>Đăng nhập để quản trị và chỉnh sửa nội dung website</p>
    </div>
    ${req.query.error ? '<div class="alert alert-danger"><i class="fa fa-triangle-exclamation"></i> Tên đăng nhập hoặc mật khẩu không đúng!</div>' : ''}
    <form action="/admin/login" method="POST" class="login-form">
      <div class="form-group">
        <label><i class="fa fa-user"></i> Tài khoản</label>
        <input type="text" name="username" placeholder="Nhập tên tài khoản" required autofocus value="admin">
      </div>
      <div class="form-group">
        <label><i class="fa fa-lock"></i> Mật khẩu</label>
        <input type="password" name="password" placeholder="Nhập mật khẩu" required value="admin123">
      </div>
      <button type="submit" class="btn btn-primary btn-block">
        <i class="fa fa-right-to-bracket"></i> Đăng nhập
      </button>
      <p class="login-hint">Tài khoản mặc định: <strong>admin</strong> | Mật khẩu: <strong>admin123</strong></p>
    </form>
  </div>
</body>
</html>
  `);
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

  if (user && verifyPassword(password, user.password_hash, user.salt)) {
    const sessionToken = signSession({ id: user.id, username: user.username, isAdmin: true, ts: Date.now() });
    res.setHeader('Set-Cookie', `acac_session=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax`);
    return res.redirect('/admin');
  }

  res.redirect('/admin/login?error=1');
});

router.get('/logout', (req, res) => {
  res.setHeader('Set-Cookie', `acac_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`);
  res.redirect('/admin/login');
});

// All routes below require Admin
router.use(requireAdmin);

// 2. Dashboard Overview
router.get('/', (req, res) => {
  const pageFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));
  const editCount = db.prepare('SELECT COUNT(*) as c FROM page_edits').get().c;
  const contactCount = db.prepare('SELECT COUNT(*) as c FROM contacts').get().c;
  const postCount = db.prepare('SELECT COUNT(*) as c FROM posts').get().c;
  const latestContacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5').all();

  const content = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: #e0f2fe; color: #0284c7;"><i class="fa fa-file-lines"></i></div>
        <div class="stat-info">
          <h3>${pageFiles.length}</h3>
          <p>Trang giao diện đã clone</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #fef3c7; color: #d97706;"><i class="fa fa-pen-nib"></i></div>
        <div class="stat-info">
          <h3>${editCount}</h3>
          <p>Phần tử chỉnh sửa tùy biến</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #dcfce7; color: #16a34a;"><i class="fa fa-envelope"></i></div>
        <div class="stat-info">
          <h3>${contactCount}</h3>
          <p>Khách hàng gửi thông tin</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #f3e8ff; color: #9333ea;"><i class="fa fa-newspaper"></i></div>
        <div class="stat-info">
          <h3>${postCount}</h3>
          <p>Bài viết CMS tự thêm</p>
        </div>
      </div>
    </div>

    <div class="dashboard-banner">
      <div class="banner-text">
        <h3><i class="fa fa-wand-magic-sparkles"></i> Tính năng Live Visual Editor đang BẬT</h3>
        <p>Bạn đã đăng nhập quyền Quản trị. Khi duyệt bất kỳ trang nào trên website (ví dụ: Trang chủ, Về ACAC, Dịch vụ...), thanh công cụ Live Editor sẽ hiển thị trên đầu. Bạn có thể <strong>nhấp trực tiếp vào chữ để sửa văn bản</strong> hoặc <strong>bấm nút [Đổi ảnh] trên từng hình</strong> để cập nhật ảnh tức thì!</p>
      </div>
      <a href="/" target="_blank" class="btn btn-warning">
        <i class="fa fa-eye"></i> Mở Trang Chủ Để Sửa Trực Tiếp
      </a>
    </div>

    <div class="content-box" style="margin-top: 25px;">
      <div class="box-header">
        <h3><i class="fa fa-inbox"></i> Khách hàng liên hệ mới nhất</h3>
        <a href="/admin/contacts" class="btn btn-sm btn-outline">Xem tất cả</a>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Công ty</th>
              <th>Nội dung yêu cầu</th>
            </tr>
          </thead>
          <tbody>
            ${latestContacts.length === 0 ? '<tr><td colspan="6" class="text-center">Chưa có liên hệ nào từ khách hàng</td></tr>' : ''}
            ${latestContacts.map(c => `
              <tr>
                <td><small>${new Date(c.created_at).toLocaleString('vi-VN')}</small></td>
                <td><strong>${c.firstname} ${c.lastname}</strong></td>
                <td><a href="mailto:${c.email}">${c.email}</a></td>
                <td><a href="tel:${c.phone}">${c.phone}</a></td>
                <td>${c.company || '—'}</td>
                <td>${c.message || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  res.send(adminLayout('Tổng quan Quản trị', 'dashboard', content, req));
});

// 3. General Settings
router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const s = {};
  rows.forEach(r => s[r.key] = r.value);

  const content = `
    <div class="content-box">
      <div class="box-header">
        <h3><i class="fa fa-sliders"></i> Cài đặt thông tin thương hiệu & Liên hệ</h3>
      </div>
      <form id="settings-form" onsubmit="saveSettings(event)" class="admin-form">
        <div class="form-row">
          <div class="form-group col-6">
            <label>Tên công ty / Tiêu đề thương hiệu</label>
            <input type="text" name="site_name" value="${s.site_name || ''}">
          </div>
          <div class="form-group col-6">
            <label>Hotline hiển thị</label>
            <input type="text" name="hotline" value="${s.hotline || ''}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group col-6">
            <label>Slogan chính</label>
            <input type="text" name="slogan" value="${s.slogan || ''}">
          </div>
          <div class="form-group col-6">
            <label>Slogan phụ (mô tả ngắn)</label>
            <input type="text" name="sub_slogan" value="${s.sub_slogan || ''}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group col-6">
            <label>Email liên hệ</label>
            <input type="email" name="email" value="${s.email || ''}">
          </div>
          <div class="form-group col-6">
            <label>Đường dẫn Logo Header</label>
            <div class="input-with-upload">
              <input type="text" name="logo_url" id="setting_logo_url" value="${s.logo_url || ''}">
              <label class="btn btn-outline upload-btn">
                <i class="fa fa-upload"></i> Tải ảnh
                <input type="file" onchange="uploadToInput(event, 'setting_logo_url')" style="display:none;" accept="image/*">
              </label>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group col-6">
            <label>Địa chỉ Trụ sở Hà Nội</label>
            <textarea name="hanoi_address" rows="2">${s.hanoi_address || ''}</textarea>
          </div>
          <div class="form-group col-6">
            <label>Địa chỉ Chi nhánh TP. Hồ Chí Minh / Hải Phòng</label>
            <textarea name="hcm_address" rows="2">${s.hcm_address || ''}</textarea>
          </div>
        </div>

        <h4 class="form-section-title"><i class="fa fa-share-nodes"></i> Mạng xã hội</h4>
        <div class="form-row">
          <div class="form-group col-4">
            <label>Facebook URL</label>
            <input type="text" name="facebook_url" value="${s.facebook_url || ''}">
          </div>
          <div class="form-group col-4">
            <label>LinkedIn URL</label>
            <input type="text" name="linkedin_url" value="${s.linkedin_url || ''}">
          </div>
          <div class="form-group col-4">
            <label>YouTube URL</label>
            <input type="text" name="youtube_url" value="${s.youtube_url || ''}">
          </div>
        </div>

        <h4 class="form-section-title"><i class="fa fa-chart-line"></i> Số liệu thành tựu (Thống kê nổi bật)</h4>
        <div class="form-row">
          <div class="form-group col-3">
            <label>Số năm kinh nghiệm</label>
            <input type="text" name="stat_years" value="${s.stat_years || ''}">
            <input type="text" name="stat_years_label" value="${s.stat_years_label || ''}" style="margin-top:5px;" placeholder="Nhãn">
          </div>
          <div class="form-group col-3">
            <label>Khách hàng doanh nghiệp</label>
            <input type="text" name="stat_clients" value="${s.stat_clients || ''}">
            <input type="text" name="stat_clients_label" value="${s.stat_clients_label || ''}" style="margin-top:5px;" placeholder="Nhãn">
          </div>
          <div class="form-group col-3">
            <label>Đội ngũ chuyên gia</label>
            <input type="text" name="stat_experts" value="${s.stat_experts || ''}">
            <input type="text" name="stat_experts_label" value="${s.stat_experts_label || ''}" style="margin-top:5px;" placeholder="Nhãn">
          </div>
          <div class="form-group col-3">
            <label>Tỷ lệ hài lòng</label>
            <input type="text" name="stat_success" value="${s.stat_success || ''}">
            <input type="text" name="stat_success_label" value="${s.stat_success_label || ''}" style="margin-top:5px;" placeholder="Nhãn">
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary"><i class="fa fa-floppy-disk"></i> Lưu cài đặt</button>
        </div>
      </form>
    </div>
  `;
  res.send(adminLayout('Cài đặt chung', 'settings', content, req));
});

// 4. Pages Management & Element List
router.get('/pages', (req, res) => {
  const pageFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html')).sort();
  const editCounts = db.prepare('SELECT page_slug, COUNT(*) as c FROM page_edits GROUP BY page_slug').all();
  const editMap = {};
  editCounts.forEach(e => editMap[e.page_slug] = e.c);

  const pagesInfo = pageFiles.map(f => {
    const slug = f.replace('.html', '');
    const html = fs.readFileSync(path.join(PAGES_DIR, f), 'utf8');
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace('- ACAC', '').trim() : slug;
    let url = '/' + slug.replace(/__/g, '/') + '/';
    if (slug === 'index') url = '/';
    return { slug, title, url, edits: editMap[slug] || 0 };
  });

  const content = `
    <div class="content-box">
      <div class="box-header">
        <h3><i class="fa fa-file-lines"></i> Danh sách tất cả các trang (${pagesInfo.length} trang)</h3>
        <p>Mỗi trang có thể nhấp <strong>"Sửa Trực Quan (Live)"</strong> để mở trang thực tế và click để sửa, hoặc nhấp <strong>"Danh sách phần tử"</strong> để sửa từng câu chữ & ảnh theo biểu mẫu.</p>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Tên trang</th>
              <th>Đường dẫn web</th>
              <th>Thay đổi tùy biến</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${pagesInfo.map(p => `
              <tr>
                <td><strong>${p.title}</strong><br><small class="text-muted">Slug: ${p.slug}</small></td>
                <td><a href="${p.url}" target="_blank">${p.url}</a></td>
                <td>
                  ${p.edits > 0 ? `<span class="badge badge-success">${p.edits} phần tử đã sửa</span>` : `<span class="badge badge-light">Chưa sửa</span>`}
                </td>
                <td>
                  <a href="${p.url}" target="_blank" class="btn btn-sm btn-warning">
                    <i class="fa fa-pen-to-square"></i> Sửa Trực Quan (Live)
                  </a>
                  <a href="/admin/pages/elements/${p.slug}" class="btn btn-sm btn-outline">
                    <i class="fa fa-list-check"></i> Sửa theo Form
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  res.send(adminLayout('Quản lý Trang', 'pages', content, req));
});

// 5. Edit specific page elements via form list
router.get('/pages/elements/:slug', (req, res) => {
  const { slug } = req.params;
  const elements = extractPageElements(slug);
  let liveUrl = '/' + slug.replace(/__/g, '/') + '/';
  if (slug === 'index') liveUrl = '/';

  const content = `
    <div class="page-header-actions">
      <a href="/admin/pages" class="btn btn-outline"><i class="fa fa-arrow-left"></i> Quay lại danh sách trang</a>
      <a href="${liveUrl}" target="_blank" class="btn btn-warning"><i class="fa fa-eye"></i> Mở trang Live Editor</a>
    </div>

    <!-- Images section -->
    <div class="content-box" style="margin-top: 15px;">
      <div class="box-header">
        <h3><i class="fa fa-image"></i> Tất cả hình ảnh trên trang (${elements.images.length} ảnh)</h3>
      </div>
      <div class="image-elements-grid">
        ${elements.images.map(img => `
          <div class="image-edit-card" id="card-${img.id}">
            <div class="img-preview-box">
              <img src="${img.src}" id="preview-${img.id}">
            </div>
            <div class="img-edit-info">
              <span class="badge badge-light">${img.section}</span>
              <small class="text-muted">ID: ${img.id}</small>
              <input type="text" id="input-${img.id}" value="${img.src}" style="margin: 8px 0; width: 100%;">
              <div class="card-btn-row">
                <label class="btn btn-sm btn-outline">
                  <i class="fa fa-upload"></i> Đổi ảnh máy tính
                  <input type="file" onchange="uploadImageElement('${slug}', '${img.id}', event)" style="display:none;" accept="image/*">
                </label>
                <button type="button" class="btn btn-sm btn-primary" onclick="saveImageElementUrl('${slug}', '${img.id}')">
                  <i class="fa fa-floppy-disk"></i> Lưu URL
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Texts section -->
    <div class="content-box" style="margin-top: 25px;">
      <div class="box-header">
        <h3><i class="fa fa-align-left"></i> Tất cả các đoạn văn bản & tiêu đề (${elements.texts.length} mục)</h3>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th width="12%">Vị trí & Thẻ</th>
              <th width="68%">Nội dung văn bản</th>
              <th width="20%">Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${elements.texts.map(t => `
              <tr id="row-${t.id}">
                <td>
                  <span class="badge badge-light">${t.section}</span><br>
                  <small class="text-muted">&lt;${t.tag}&gt; [${t.id}]</small>
                </td>
                <td>
                  <textarea id="text-${t.id}" rows="2" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">${t.html}</textarea>
                </td>
                <td>
                  <button type="button" class="btn btn-sm btn-primary" onclick="saveTextElement('${slug}', '${t.id}')">
                    <i class="fa fa-floppy-disk"></i> Lưu đoạn này
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  res.send(adminLayout(`Chỉnh sửa phần tử trang: ${slug}`, 'pages', content, req));
});

// 6. Slides Management
router.get('/slides', (req, res) => {
  const slides = db.prepare('SELECT * FROM slides ORDER BY order_num ASC, id ASC').all();
  const content = `
    <div class="content-box">
      <div class="box-header">
        <h3><i class="fa fa-images"></i> Quản lý Banner / Slider trang chủ</h3>
        <button class="btn btn-primary" onclick="openSlideModal()"><i class="fa fa-plus"></i> Thêm Slide Mới</button>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th width="20%">Hình ảnh</th>
              <th>Tiêu đề chính</th>
              <th>Tiêu đề phụ / Mô tả</th>
              <th>Nút bấm & Link</th>
              <th>Thứ tự</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${slides.map(s => `
              <tr>
                <td>
                  <img src="${s.image_url}" style="max-width: 160px; height: auto; border-radius: 4px;">
                </td>
                <td><strong>${s.title || ''}</strong></td>
                <td>${s.subtitle || ''}</td>
                <td>
                  ${s.btn_text ? `<span class="badge badge-primary">${s.btn_text}</span> &rarr; ${s.btn_link}` : '—'}
                </td>
                <td>${s.order_num}</td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick='editSlide(${JSON.stringify(s)})'><i class="fa fa-pen"></i></button>
                  <button class="btn btn-sm btn-danger" onclick="deleteSlide(${s.id})"><i class="fa fa-trash"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Slide Modal -->
    <div id="slide-modal" class="acac-modal" style="display:none;">
      <div class="acac-modal-content" style="max-width: 600px;">
        <div class="acac-modal-header">
          <h3 id="slide-modal-title"><i class="fa fa-image"></i> Cập nhật Slide</h3>
          <span class="acac-modal-close" onclick="closeSlideModal()">&times;</span>
        </div>
        <form onsubmit="submitSlide(event)" class="admin-form" style="padding: 20px;">
          <input type="hidden" name="id" id="slide-id">
          <div class="form-group">
            <label>Tiêu đề chính</label>
            <input type="text" name="title" id="slide-title" required>
          </div>
          <div class="form-group">
            <label>Tiêu đề phụ</label>
            <input type="text" name="subtitle" id="slide-subtitle">
          </div>
          <div class="form-group">
            <label>Đường dẫn hình ảnh</label>
            <div class="input-with-upload">
              <input type="text" name="image_url" id="slide-image-url" required>
              <label class="btn btn-outline upload-btn">
                <i class="fa fa-upload"></i> Chọn ảnh
                <input type="file" onchange="uploadToInput(event, 'slide-image-url')" style="display:none;" accept="image/*">
              </label>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-6">
              <label>Chữ trên nút (Button)</label>
              <input type="text" name="btn_text" id="slide-btn-text" placeholder="ĐẶT LỊCH TƯ VẤN">
            </div>
            <div class="form-group col-6">
              <label>Đường dẫn khi bấm nút</label>
              <input type="text" name="btn_link" id="slide-btn-link" placeholder="/lien-he/">
            </div>
          </div>
          <div class="form-group">
            <label>Thứ tự hiển thị</label>
            <input type="number" name="order_num" id="slide-order" value="1">
          </div>
          <div class="form-actions" style="margin-top: 15px;">
            <button type="button" class="btn btn-outline" onclick="closeSlideModal()">Hủy</button>
            <button type="submit" class="btn btn-primary"><i class="fa fa-floppy-disk"></i> Lưu Slide</button>
          </div>
        </form>
      </div>
    </div>
  `;
  res.send(adminLayout('Quản lý Banner & Slider', 'slides', content, req));
});

// 7. Services Management (9 services)
router.get('/services', (req, res) => {
  const services = db.prepare('SELECT * FROM services ORDER BY order_num ASC').all();
  const content = `
    <div class="content-box">
      <div class="box-header">
        <h3><i class="fa fa-briefcase"></i> 9 Nhóm Dịch Vụ Chủ Lực Của ACAC</h3>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th width="8%">Icon</th>
              <th width="15%">Ảnh bìa</th>
              <th width="25%">Tên Dịch Vụ</th>
              <th>Mô tả ngắn</th>
              <th width="12%">Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${services.map(s => `
              <tr>
                <td><img src="${s.icon_url}" style="max-height: 45px;"></td>
                <td><img src="${s.cover_url}" style="max-width: 90px; border-radius: 4px;"></td>
                <td>
                  <strong>${s.title}</strong><br>
                  <small class="text-muted">Slug: ${s.slug}</small>
                </td>
                <td>${s.short_desc}</td>
                <td>
                  <button class="btn btn-sm btn-primary" onclick='editService(${JSON.stringify(s)})'>
                    <i class="fa fa-pen"></i> Chỉnh sửa
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Service Edit Modal -->
    <div id="service-modal" class="acac-modal" style="display:none;">
      <div class="acac-modal-content" style="max-width: 600px;">
        <div class="acac-modal-header">
          <h3><i class="fa fa-briefcase"></i> Chỉnh sửa Dịch vụ</h3>
          <span class="acac-modal-close" onclick="closeServiceModal()">&times;</span>
        </div>
        <form onsubmit="submitService(event)" class="admin-form" style="padding: 20px;">
          <input type="hidden" name="id" id="service-id">
          <div class="form-group">
            <label>Tên dịch vụ</label>
            <input type="text" name="title" id="service-title" required>
          </div>
          <div class="form-group">
            <label>Mô tả ngắn</label>
            <textarea name="short_desc" id="service-desc" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label>Ảnh Icon</label>
            <div class="input-with-upload">
              <input type="text" name="icon_url" id="service-icon" required>
              <label class="btn btn-outline upload-btn">
                <i class="fa fa-upload"></i> Chọn ảnh
                <input type="file" onchange="uploadToInput(event, 'service-icon')" style="display:none;" accept="image/*">
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Ảnh bìa dịch vụ</label>
            <div class="input-with-upload">
              <input type="text" name="cover_url" id="service-cover" required>
              <label class="btn btn-outline upload-btn">
                <i class="fa fa-upload"></i> Chọn ảnh
                <input type="file" onchange="uploadToInput(event, 'service-cover')" style="display:none;" accept="image/*">
              </label>
            </div>
          </div>
          <div class="form-actions" style="margin-top: 15px;">
            <button type="button" class="btn btn-outline" onclick="closeServiceModal()">Hủy</button>
            <button type="submit" class="btn btn-primary"><i class="fa fa-floppy-disk"></i> Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  `;
  res.send(adminLayout('Quản lý Dịch vụ', 'services', content, req));
});

// 8. Posts Management
router.get('/posts', (req, res) => {
  const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  const content = `
    <div class="content-box">
      <div class="box-header">
        <h3><i class="fa fa-newspaper"></i> Quản lý Bài viết & Tin tức mới</h3>
        <button class="btn btn-primary" onclick="openPostModal()"><i class="fa fa-plus"></i> Đăng Bài Viết Mới</button>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th width="15%">Ảnh đại diện</th>
              <th>Tiêu đề bài viết</th>
              <th>Chuyên mục</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${posts.length === 0 ? '<tr><td colspan="5" class="text-center">Chưa có bài viết mới nào. Nhấp nút trên để thêm bài viết mới.</td></tr>' : ''}
            ${posts.map(p => `
              <tr>
                <td>
                  <img src="${p.featured_img || '/wp-content/uploads/2026/01/Anh-bia-chung-cho-bai-viet-Tin-tuc-Su-kien-1980x1020-1-1024x528.png'}" style="max-width: 100px; border-radius: 4px;">
                </td>
                <td>
                  <strong>${p.title}</strong><br>
                  <a href="/bai-viet/${p.slug}" target="_blank" class="text-muted"><small>/bai-viet/${p.slug}</small></a>
                </td>
                <td><span class="badge badge-primary">${p.category}</span></td>
                <td><small>${new Date(p.created_at).toLocaleDateString('vi-VN')}</small></td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick='editPost(${JSON.stringify(p)})'><i class="fa fa-pen"></i> Sửa</button>
                  <button class="btn btn-sm btn-danger" onclick="deletePost(${p.id})"><i class="fa fa-trash"></i> Xóa</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Post Modal -->
    <div id="post-modal" class="acac-modal" style="display:none;">
      <div class="acac-modal-content" style="max-width: 780px;">
        <div class="acac-modal-header">
          <h3 id="post-modal-title"><i class="fa fa-newspaper"></i> Thêm Bài Viết Mới</h3>
          <span class="acac-modal-close" onclick="closePostModal()">&times;</span>
        </div>
        <form onsubmit="submitPost(event)" class="admin-form" style="padding: 20px;">
          <input type="hidden" name="id" id="post-id">
          <div class="form-group">
            <label>Tiêu đề bài viết</label>
            <input type="text" name="title" id="post-title" required placeholder="Nhập tiêu đề bài viết...">
          </div>
          <div class="form-row">
            <div class="form-group col-6">
              <label>Chuyên mục</label>
              <select name="category" id="post-category">
                <option value="Tin tức & Sự kiện">Tin tức & Sự kiện</option>
                <option value="Bản tin thuế và tài chính">Bản tin thuế và tài chính</option>
                <option value="Toàn cảnh thị trường">Toàn cảnh thị trường</option>
                <option value="Cơ hội nghề nghiệp">Cơ hội nghề nghiệp</option>
              </select>
            </div>
            <div class="form-group col-6">
              <label>Ảnh đại diện (Featured Image)</label>
              <div class="input-with-upload">
                <input type="text" name="featured_img" id="post-img" placeholder="/wp-content/uploads/...">
                <label class="btn btn-outline upload-btn">
                  <i class="fa fa-upload"></i> Chọn ảnh
                  <input type="file" onchange="uploadToInput(event, 'post-img')" style="display:none;" accept="image/*">
                </label>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Tóm tắt bài viết (Excerpt)</label>
            <textarea name="excerpt" id="post-excerpt" rows="2" placeholder="Tóm tắt ngắn hiển thị ở danh sách bài viết..."></textarea>
          </div>
          <div class="form-group">
            <label>Nội dung chi tiết (Hỗ trợ HTML)</label>
            <textarea name="content_html" id="post-content" rows="8" placeholder="Nhập nội dung chi tiết bài viết..."></textarea>
          </div>
          <div class="form-actions" style="margin-top: 15px;">
            <button type="button" class="btn btn-outline" onclick="closePostModal()">Hủy</button>
            <button type="submit" class="btn btn-primary"><i class="fa fa-floppy-disk"></i> Xuất bản bài viết</button>
          </div>
        </form>
      </div>
    </div>
  `;
  res.send(adminLayout('Quản lý Bài viết', 'posts', content, req));
});

// 9. Partners & Clients
router.get('/partners', (req, res) => {
  const partners = db.prepare('SELECT * FROM partners ORDER BY type ASC, order_num ASC').all();
  const content = `
    <div class="content-box">
      <div class="box-header">
        <h3><i class="fa fa-handshake"></i> Quản lý Đối Tác & Khách Hàng Tiêu Biểu</h3>
        <button class="btn btn-primary" onclick="openPartnerModal()"><i class="fa fa-plus"></i> Thêm Logo Mới</button>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th width="15%">Logo</th>
              <th>Tên Đơn vị</th>
              <th>Phân loại</th>
              <th>Thứ tự</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${partners.map(p => `
              <tr>
                <td><img src="${p.logo_url}" style="max-height: 40px; max-width: 120px;"></td>
                <td><strong>${p.name}</strong></td>
                <td><span class="badge ${p.type === 'partner' ? 'badge-primary' : 'badge-success'}">${p.type === 'partner' ? 'Liên minh Quốc tế' : 'Khách hàng'}</span></td>
                <td>${p.order_num}</td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick='editPartner(${JSON.stringify(p)})'><i class="fa fa-pen"></i></button>
                  <button class="btn btn-sm btn-danger" onclick="deletePartner(${p.id})"><i class="fa fa-trash"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Partner Modal -->
    <div id="partner-modal" class="acac-modal" style="display:none;">
      <div class="acac-modal-content" style="max-width: 500px;">
        <div class="acac-modal-header">
          <h3><i class="fa fa-handshake"></i> Thêm / Sửa Đối tác & Khách hàng</h3>
          <span class="acac-modal-close" onclick="closePartnerModal()">&times;</span>
        </div>
        <form onsubmit="submitPartner(event)" class="admin-form" style="padding: 20px;">
          <input type="hidden" name="id" id="partner-id">
          <div class="form-group">
            <label>Tên đơn vị</label>
            <input type="text" name="name" id="partner-name" required>
          </div>
          <div class="form-group">
            <label>Phân loại</label>
            <select name="type" id="partner-type">
              <option value="partner">Đối tác / Liên minh Quốc tế (OA, Pantheon, Sakura...)</option>
              <option value="client">Khách hàng tiêu biểu (Carlsberg, LG, Petrolimex...)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Đường dẫn Logo</label>
            <div class="input-with-upload">
              <input type="text" name="logo_url" id="partner-logo" required>
              <label class="btn btn-outline upload-btn">
                <i class="fa fa-upload"></i> Chọn ảnh
                <input type="file" onchange="uploadToInput(event, 'partner-logo')" style="display:none;" accept="image/*">
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Thứ tự hiển thị</label>
            <input type="number" name="order_num" id="partner-order" value="1">
          </div>
          <div class="form-actions" style="margin-top: 15px;">
            <button type="button" class="btn btn-outline" onclick="closePartnerModal()">Hủy</button>
            <button type="submit" class="btn btn-primary"><i class="fa fa-floppy-disk"></i> Lưu</button>
          </div>
        </form>
      </div>
    </div>
  `;
  res.send(adminLayout('Quản lý Đối tác & Khách hàng', 'partners', content, req));
});

// 10. Contacts List
router.get('/contacts', (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  const content = `
    <div class="content-box">
      <div class="box-header">
        <h3><i class="fa fa-envelope"></i> Danh Sách Khách Hàng Gửi Yêu Cầu Liên Hệ (${contacts.length} yêu cầu)</h3>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th width="12%">Thời gian</th>
              <th width="15%">Họ tên</th>
              <th width="15%">Email</th>
              <th width="12%">Điện thoại</th>
              <th width="15%">Công ty</th>
              <th>Nội dung</th>
              <th width="8%">Xóa</th>
            </tr>
          </thead>
          <tbody>
            ${contacts.length === 0 ? '<tr><td colspan="7" class="text-center">Chưa có liên hệ nào từ khách hàng</td></tr>' : ''}
            ${contacts.map(c => `
              <tr>
                <td><small>${new Date(c.created_at).toLocaleString('vi-VN')}</small></td>
                <td><strong>${c.firstname} ${c.lastname}</strong></td>
                <td><a href="mailto:${c.email}">${c.email}</a></td>
                <td><a href="tel:${c.phone}">${c.phone}</a></td>
                <td>${c.company || '—'}</td>
                <td>${c.message || '—'}</td>
                <td>
                  <button class="btn btn-sm btn-danger" onclick="deleteContact(${c.id})"><i class="fa fa-trash"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  res.send(adminLayout('Khách hàng Liên hệ', 'contacts', content, req));
});

// 11. Admin Account & Password
router.get('/account', (req, res) => {
  const content = `
    <div class="content-box" style="max-width: 500px;">
      <div class="box-header">
        <h3><i class="fa fa-key"></i> Đổi Mật Khẩu Tài Khoản Admin</h3>
      </div>
      <form onsubmit="changePassword(event)" class="admin-form">
        <div class="form-group">
          <label>Tên đăng nhập</label>
          <input type="text" value="admin" disabled style="background: #f1f5f9;">
        </div>
        <div class="form-group">
          <label>Mật khẩu hiện tại</label>
          <input type="password" id="cur-pass" required placeholder="Nhập mật khẩu hiện tại...">
        </div>
        <div class="form-group">
          <label>Mật khẩu mới</label>
          <input type="password" id="new-pass" required placeholder="Nhập mật khẩu mới...">
        </div>
        <div class="form-group">
          <label>Xác nhận mật khẩu mới</label>
          <input type="password" id="confirm-pass" required placeholder="Nhập lại mật khẩu mới...">
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary"><i class="fa fa-lock"></i> Đổi Mật Khẩu</button>
        </div>
      </form>
    </div>
  `;
  res.send(adminLayout('Tài khoản Admin', 'account', content, req));
});

module.exports = router;
