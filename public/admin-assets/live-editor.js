(function () {
  console.log('[ACAC CMS] Visual Live Editor initialized for page:', window.__ACAC_PAGE_SLUG__);
  document.body.classList.add('acac-editor-active');

  const pendingEdits = new Map();
  let currentTargetImg = null;

  function updateCounter() {
    const count = pendingEdits.size;
    const counterEl = document.getElementById('acac-change-counter');
    const saveBtn = document.getElementById('acac-save-btn');
    if (counterEl) {
      counterEl.textContent = count + ' thay đổi chưa lưu';
      if (count > 0) {
        counterEl.classList.add('has-changes');
        if (saveBtn) saveBtn.removeAttribute('disabled');
      } else {
        counterEl.classList.remove('has-changes');
        if (saveBtn) saveBtn.setAttribute('disabled', 'true');
      }
    }
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'acac-toast';
    toast.innerHTML = '<i class="fa fa-circle-check" style="color:#10b981;"></i> ' + msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // 1. Setup editable text elements
  const textElements = document.querySelectorAll('[data-cms-id^="txt-"]');
  textElements.forEach(el => {
    if (el.closest('#acac-live-bar, #acac-img-modal')) return;

    el.classList.add('acac-editable-text');
    el.title = 'Nhấp đúp hoặc nhấp chuột để chỉnh sửa văn bản này';

    el.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        e.preventDefault();
      }
      el.contentEditable = 'true';
      el.classList.add('acac-editing');
      el.focus();
    });

    el.addEventListener('blur', function () {
      el.contentEditable = 'false';
      el.classList.remove('acac-editing');
      const cmsId = el.getAttribute('data-cms-id');
      const newHtml = el.innerHTML.trim();
      pendingEdits.set(cmsId, {
        element_id: cmsId,
        content_type: 'text',
        content_value: newHtml
      });
      el.classList.add('acac-edited');
      updateCounter();
    });
  });

  // 2. Setup editable image elements
  const images = document.querySelectorAll('[data-cms-id^="img-"]');
  images.forEach(img => {
    if (img.closest('#acac-live-bar, #acac-img-modal')) return;

    const parent = img.parentElement;
    if (parent && !parent.classList.contains('acac-img-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'acac-img-wrapper';
      wrapper.style.display = window.getComputedStyle(img).display === 'inline' ? 'inline-block' : window.getComputedStyle(img).display;
      parent.insertBefore(wrapper, img);
      wrapper.appendChild(img);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'acac-img-btn';
      btn.innerHTML = '<i class="fa fa-camera"></i> Đổi ảnh';
      wrapper.appendChild(btn);

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openImgModal(img);
      });
    }
  });

  // Modal handlers
  window.openImgModal = function (img) {
    currentTargetImg = img;
    const modal = document.getElementById('acac-img-modal');
    const preview = document.getElementById('acac-modal-preview');
    const urlInput = document.getElementById('acac-modal-url');
    const fileInput = document.getElementById('acac-modal-file');

    fileInput.value = '';
    urlInput.value = img.getAttribute('src') || '';
    preview.src = img.getAttribute('src') || '';
    preview.style.display = 'block';

    modal.style.display = 'flex';
  };

  window.closeImgModal = function () {
    const modal = document.getElementById('acac-img-modal');
    modal.style.display = 'none';
    currentTargetImg = null;
  };

  window.previewSelectedImg = function (e) {
    const file = e.target.files[0];
    if (file) {
      const preview = document.getElementById('acac-modal-preview');
      preview.src = URL.createObjectURL(file);
      preview.style.display = 'block';
    }
  };

  window.applyImgChange = async function () {
    if (!currentTargetImg) return;
    const fileInput = document.getElementById('acac-modal-file');
    const urlInput = document.getElementById('acac-modal-url');

    let finalSrc = '';
    if (fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);
      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.url) {
          finalSrc = data.url;
        } else {
          alert('Tải ảnh lên thất bại!');
          return;
        }
      } catch (err) {
        alert('Lỗi tải ảnh: ' + err.message);
        return;
      }
    } else if (urlInput.value.trim()) {
      finalSrc = urlInput.value.trim();
    }

    if (finalSrc) {
      currentTargetImg.src = finalSrc;
      currentTargetImg.classList.add('acac-edited');
      const cmsId = currentTargetImg.getAttribute('data-cms-id');
      pendingEdits.set(cmsId, {
        element_id: cmsId,
        content_type: 'image',
        content_value: finalSrc
      });
      updateCounter();
      closeImgModal();
    }
  };

  // 3. Save button
  const saveBtn = document.getElementById('acac-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async function () {
      if (pendingEdits.size === 0) return;
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Đang lưu...';

      const editsArray = Array.from(pendingEdits.values());
      try {
        const res = await fetch('/api/admin/save-live-edits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_slug: window.__ACAC_PAGE_SLUG__ || 'index',
            edits: editsArray
          })
        });

        const data = await res.json();
        if (data.success) {
          showToast('Đã lưu thành công tất cả thay đổi trên trang!');
          pendingEdits.clear();
          updateCounter();
          document.querySelectorAll('.acac-edited').forEach(el => el.classList.remove('acac-edited'));
        } else {
          alert('Lỗi lưu: ' + (data.message || 'Không xác định'));
        }
      } catch (err) {
        alert('Lỗi kết nối máy chủ: ' + err.message);
      } finally {
        saveBtn.innerHTML = '<i class="fa fa-floppy-disk"></i> Lưu thay đổi';
        updateCounter();
      }
    });
  }
})();
