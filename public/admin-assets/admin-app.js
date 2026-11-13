// ACAC Admin Portal Client Script

function showToast(msg, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'acac-toast';
  if (isError) {
    toast.style.borderLeftColor = '#ef4444';
    toast.innerHTML = `<i class="fa fa-circle-exclamation" style="color:#ef4444;"></i> ${msg}`;
  } else {
    toast.innerHTML = `<i class="fa fa-circle-check" style="color:#10b981;"></i> ${msg}`;
  }
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Upload file helper
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch('/api/admin/upload-image', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (data.url) return data.url;
  throw new Error(data.message || 'Lỗi tải ảnh');
}

async function uploadToInput(event, targetInputId) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const url = await uploadFile(file);
    const input = document.getElementById(targetInputId);
    if (input) input.value = url;
    showToast('Tải ảnh lên thành công!');
  } catch (err) {
    alert('Lỗi tải ảnh: ' + err.message);
  }
}

// 1. Settings Save
async function saveSettings(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const payload = {};
  formData.forEach((val, key) => payload[key] = val);

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đã lưu thông tin cài đặt website!');
    } else {
      showToast(data.message || 'Lỗi lưu', true);
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ: ' + err.message, true);
  }
}

// 2. Element edits (Page form view)
async function saveTextElement(slug, elementId) {
  const textarea = document.getElementById(`text-${elementId}`);
  if (!textarea) return;
  const newHtml = textarea.value.trim();

  try {
    const res = await fetch('/api/admin/save-live-edits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_slug: slug,
        edits: [{
          element_id: elementId,
          content_type: 'text',
          content_value: newHtml
        }]
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Đã lưu phần tử [${elementId}]`);
      const row = document.getElementById(`row-${elementId}`);
      if (row) {
        row.style.background = '#dcfce7';
        setTimeout(() => row.style.background = '', 1500);
      }
    } else {
      showToast(data.message || 'Lỗi lưu', true);
    }
  } catch (err) {
    showToast('Lỗi kết nối: ' + err.message, true);
  }
}

async function saveImageElementUrl(slug, elementId) {
  const input = document.getElementById(`input-${elementId}`);
  if (!input) return;
  const newSrc = input.value.trim();

  try {
    const res = await fetch('/api/admin/save-live-edits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_slug: slug,
        edits: [{
          element_id: elementId,
          content_type: 'image',
          content_value: newSrc
        }]
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Đã cập nhật ảnh [${elementId}]`);
      const preview = document.getElementById(`preview-${elementId}`);
      if (preview) preview.src = newSrc;
    }
  } catch (err) {
    showToast('Lỗi kết nối: ' + err.message, true);
  }
}

async function uploadImageElement(slug, elementId, event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const url = await uploadFile(file);
    const input = document.getElementById(`input-${elementId}`);
    if (input) input.value = url;
    const preview = document.getElementById(`preview-${elementId}`);
    if (preview) preview.src = url;
    await saveImageElementUrl(slug, elementId);
  } catch (err) {
    showToast('Lỗi upload: ' + err.message, true);
  }
}

// 3. Slides
function openSlideModal() {
  document.getElementById('slide-modal-title').innerHTML = '<i class="fa fa-image"></i> Thêm Slide Mới';
  document.getElementById('slide-id').value = '';
  document.getElementById('slide-title').value = '';
  document.getElementById('slide-subtitle').value = '';
  document.getElementById('slide-image-url').value = '';
  document.getElementById('slide-btn-text').value = 'ĐẶT LỊCH TƯ VẤN';
  document.getElementById('slide-btn-link').value = '/lien-he/';
  document.getElementById('slide-order').value = '1';
  document.getElementById('slide-modal').style.display = 'flex';
}

function closeSlideModal() {
  document.getElementById('slide-modal').style.display = 'none';
}

function editSlide(s) {
  document.getElementById('slide-modal-title').innerHTML = '<i class="fa fa-pen"></i> Chỉnh sửa Slide #' + s.id;
  document.getElementById('slide-id').value = s.id;
  document.getElementById('slide-title').value = s.title || '';
  document.getElementById('slide-subtitle').value = s.subtitle || '';
  document.getElementById('slide-image-url').value = s.image_url || '';
  document.getElementById('slide-btn-text').value = s.btn_text || '';
  document.getElementById('slide-btn-link').value = s.btn_link || '';
  document.getElementById('slide-order').value = s.order_num || 1;
  document.getElementById('slide-modal').style.display = 'flex';
}

async function submitSlide(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    id: document.getElementById('slide-id').value || undefined,
    title: document.getElementById('slide-title').value,
    subtitle: document.getElementById('slide-subtitle').value,
    image_url: document.getElementById('slide-image-url').value,
    btn_text: document.getElementById('slide-btn-text').value,
    btn_link: document.getElementById('slide-btn-link').value,
    order_num: parseInt(document.getElementById('slide-order').value, 10) || 1
  };

  try {
    const res = await fetch('/api/admin/slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đã lưu slide!');
      setTimeout(() => location.reload(), 600);
    }
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

async function deleteSlide(id) {
  if (!confirm('Bạn có chắc muốn xóa slide này?')) return;
  try {
    const res = await fetch(`/api/admin/slides/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Đã xóa slide');
      setTimeout(() => location.reload(), 600);
    }
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

// 4. Services
function editService(s) {
  document.getElementById('service-id').value = s.id;
  document.getElementById('service-title').value = s.title;
  document.getElementById('service-desc').value = s.short_desc;
  document.getElementById('service-icon').value = s.icon_url;
  document.getElementById('service-cover').value = s.cover_url;
  document.getElementById('service-modal').style.display = 'flex';
}

function closeServiceModal() {
  document.getElementById('service-modal').style.display = 'none';
}

async function submitService(e) {
  e.preventDefault();
  const payload = {
    id: document.getElementById('service-id').value,
    title: document.getElementById('service-title').value,
    short_desc: document.getElementById('service-desc').value,
    icon_url: document.getElementById('service-icon').value,
    cover_url: document.getElementById('service-cover').value
  };

  try {
    const res = await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đã lưu thông tin dịch vụ!');
      setTimeout(() => location.reload(), 600);
    }
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

// 5. Posts
function openPostModal() {
  document.getElementById('post-modal-title').innerHTML = '<i class="fa fa-newspaper"></i> Thêm Bài Viết Mới';
  document.getElementById('post-id').value = '';
  document.getElementById('post-title').value = '';
  document.getElementById('post-category').value = 'Tin tức & Sự kiện';
  document.getElementById('post-img').value = '';
  document.getElementById('post-excerpt').value = '';
  document.getElementById('post-content').value = '';
  document.getElementById('post-modal').style.display = 'flex';
}

function closePostModal() {
  document.getElementById('post-modal').style.display = 'none';
}

function editPost(p) {
  document.getElementById('post-modal-title').innerHTML = '<i class="fa fa-pen"></i> Sửa bài: ' + p.title;
  document.getElementById('post-id').value = p.id;
  document.getElementById('post-title').value = p.title || '';
  document.getElementById('post-category').value = p.category || 'Tin tức & Sự kiện';
  document.getElementById('post-img').value = p.featured_img || '';
  document.getElementById('post-excerpt').value = p.excerpt || '';
  document.getElementById('post-content').value = p.content_html || '';
  document.getElementById('post-modal').style.display = 'flex';
}

async function submitPost(e) {
  e.preventDefault();
  const payload = {
    id: document.getElementById('post-id').value || undefined,
    title: document.getElementById('post-title').value,
    category: document.getElementById('post-category').value,
    featured_img: document.getElementById('post-img').value,
    excerpt: document.getElementById('post-excerpt').value,
    content_html: document.getElementById('post-content').value
  };

  try {
    const res = await fetch('/api/admin/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đã lưu bài viết!');
      setTimeout(() => location.reload(), 600);
    }
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

async function deletePost(id) {
  if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
  try {
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Đã xóa bài viết');
      setTimeout(() => location.reload(), 600);
    }
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

// 6. Partners
function openPartnerModal() {
  document.getElementById('partner-id').value = '';
  document.getElementById('partner-name').value = '';
  document.getElementById('partner-type').value = 'partner';
  document.getElementById('partner-logo').value = '';
  document.getElementById('partner-order').value = '1';
  document.getElementById('partner-modal').style.display = 'flex';
}

function closePartnerModal() {
  document.getElementById('partner-modal').style.display = 'none';
}

function editPartner(p) {
  document.getElementById('partner-id').value = p.id;
  document.getElementById('partner-name').value = p.name;
  document.getElementById('partner-type').value = p.type;
  document.getElementById('partner-logo').value = p.logo_url;
  document.getElementById('partner-order').value = p.order_num;
  document.getElementById('partner-modal').style.display = 'flex';
}

async function submitPartner(e) {
  e.preventDefault();
  const payload = {
    id: document.getElementById('partner-id').value || undefined,
    name: document.getElementById('partner-name').value,
    type: document.getElementById('partner-type').value,
    logo_url: document.getElementById('partner-logo').value,
    order_num: parseInt(document.getElementById('partner-order').value, 10) || 1
  };

  try {
    const res = await fetch('/api/admin/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đã lưu đối tác / khách hàng!');
      setTimeout(() => location.reload(), 600);
    }
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

async function deletePartner(id) {
  if (!confirm('Bạn có chắc muốn xóa logo này?')) return;
  try {
    const res = await fetch(`/api/admin/partners/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Đã xóa đối tác / khách hàng');
      setTimeout(() => location.reload(), 600);
    }
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

// 7. Contacts
async function deleteContact(id) {
  if (!confirm('Bạn có chắc muốn xóa liên hệ này?')) return;
  try {
    const res = await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Đã xóa liên hệ');
      setTimeout(() => location.reload(), 600);
    }
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

// 8. Change Password
async function changePassword(e) {
  e.preventDefault();
  const current_password = document.getElementById('cur-pass').value;
  const new_password = document.getElementById('new-pass').value;
  const confirm_password = document.getElementById('confirm-pass').value;

  if (new_password !== confirm_password) {
    alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
    return;
  }

  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password, new_password })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đổi mật khẩu thành công!');
      document.getElementById('cur-pass').value = '';
      document.getElementById('new-pass').value = '';
      document.getElementById('confirm-pass').value = '';
    } else {
      alert(data.message || 'Lỗi đổi mật khẩu');
    }
  } catch (err) {
    alert('Lỗi: ' + err.message);
  }
}
