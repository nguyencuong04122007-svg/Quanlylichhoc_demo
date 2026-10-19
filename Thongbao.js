    const noticeStorageKey = 'quanlylichhoc-notices';
    const noticeList = document.getElementById('noticeList');
    const emptyState = document.getElementById('emptyState');
    const noticeModal = document.getElementById('noticeModal');
    const noticeForm = document.getElementById('noticeForm');
    const formError = document.getElementById('formError');
    const listError = document.getElementById('listError');

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[char]);
    }

    function readNotices() {
      try {
        const saved = localStorage.getItem(noticeStorageKey);
        if (saved === null) return [];
        const notices = JSON.parse(saved);
        if (!Array.isArray(notices) || !notices.every(notice =>
          notice && typeof notice.id === 'string' && typeof notice.title === 'string' &&
          typeof notice.content === 'string' && typeof notice.createdAt === 'string' &&
          !Number.isNaN(Date.parse(notice.createdAt))
        )) throw new Error('Dữ liệu thông báo không hợp lệ.');
        return notices;
      } catch (error) {
        console.error('Không thể tải thông báo đã lưu:', error);
        emptyState.textContent = 'Không thể tải thông báo. Hãy kiểm tra dữ liệu lưu trên trình duyệt.';
        return [];
      }
    }

    let notices = readNotices();

    function renderNotices() {
      notices.sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
      emptyState.hidden = notices.length > 0;
      noticeList.innerHTML = notices.map(notice => {
        const publishedAt = new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'medium', timeStyle: 'short'
        }).format(new Date(notice.createdAt));
        return `<article class="notice-item">
          <div>
            <h4>${escapeHtml(notice.title)}</h4>
            <div class="notice-date">${escapeHtml(publishedAt)}</div>
            <p class="notice-content">${escapeHtml(notice.content)}</p>
          </div>
          ${isAdminMode() ? `<button class="control notice-remove" type="button" data-remove-notice="${escapeHtml(notice.id)}">Xóa</button>` : ''}
        </article>`;
      }).join('');
      document.querySelector('.card').classList.toggle('admin-mode', isAdminMode());
    }

    function closeModal() {
      noticeModal.classList.remove('open');
      noticeForm.reset();
      formError.textContent = '';
    }

    const adminModeKey = 'quanlylichhoc-demo-admin-mode';
    const authKey = 'quanlylichhoc-demo-user';
    function isAdminMode() {
      try {
        return sessionStorage.getItem(adminModeKey) === 'true';
      } catch (error) {
        console.error('Không thể kiểm tra quyền quản trị:', error);
        return false;
      }
    }

    function updateAdminModeUI() {
      const adminMode = isAdminMode();
      const toggle = document.getElementById('adminModeToggle');
      toggle.setAttribute('aria-pressed', String(adminMode));
      toggle.textContent = adminMode ? 'Chuyển sang sinh viên' : 'Chuyển sang quản trị viên';
      document.getElementById('accountModeLabel').textContent =
        `Chế độ: ${adminMode ? 'Quản trị viên' : 'Sinh viên'}`;
      renderNotices();
    }

    document.getElementById('adminModeToggle').addEventListener('click', event => {
      const enableAdminMode = event.currentTarget.getAttribute('aria-pressed') !== 'true';
      try {
        sessionStorage.setItem(adminModeKey, String(enableAdminMode));
      } catch (error) {
        console.error('Không thể đổi chế độ tài khoản:', error);
        window.alert('Không thể lưu chế độ tài khoản. Hãy bật lưu trữ phiên của trình duyệt rồi thử lại.');
        return;
      }
      updateAdminModeUI();
    });

    document.getElementById('addNotice').addEventListener('click', () => {
      if (!isAdminMode()) {
        listError.textContent = 'Chỉ quản trị viên mới được thêm hoặc xóa thông báo.';
        return;
      }
      noticeForm.reset();
      formError.textContent = '';
      noticeModal.classList.add('open');
      document.getElementById('noticeTitle').focus();
    });
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelModal').addEventListener('click', closeModal);
    noticeModal.addEventListener('click', event => {
      if (event.target === noticeModal) closeModal();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && noticeModal.classList.contains('open')) closeModal();
    });
    noticeForm.addEventListener('submit', event => {
      event.preventDefault();
      formError.textContent = '';
      if (!isAdminMode()) {
        closeModal();
        listError.textContent = 'Chỉ quản trị viên mới được thêm hoặc xóa thông báo.';
        return;
      }
      if (!noticeForm.reportValidity()) return;
      const data = new FormData(noticeForm);
      const title = String(data.get('title')).trim();
      const content = String(data.get('content')).trim();
      if (!title || !content) {
        formError.textContent = 'Vui lòng nhập tiêu đề và nội dung thông báo.';
        return;
      }
      const updatedNotices = [...notices, {
        id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        content,
        createdAt: new Date().toISOString()
      }];
      try {
        localStorage.setItem(noticeStorageKey, JSON.stringify(updatedNotices));
      } catch (error) {
        console.error('Không thể lưu thông báo:', error);
        formError.textContent = 'Không lưu được thông báo. Hãy kiểm tra cài đặt lưu trữ của trình duyệt.';
        return;
      }
      notices = updatedNotices;
      emptyState.textContent = 'Hiện chưa có thông báo mới.';
      listError.textContent = '';
      closeModal();
      renderNotices();
    });
    noticeList.addEventListener('click', event => {
      const button = event.target.closest('[data-remove-notice]');
      if (!button) return;
      if (!isAdminMode()) {
        listError.textContent = 'Chỉ quản trị viên mới được thêm hoặc xóa thông báo.';
        renderNotices();
        return;
      }
      const updatedNotices = notices.filter(notice => notice.id !== button.dataset.removeNotice);
      try {
        localStorage.setItem(noticeStorageKey, JSON.stringify(updatedNotices));
      } catch (error) {
        console.error('Không thể cập nhật thông báo:', error);
        listError.textContent = 'Không thể xóa thông báo. Hãy thử lại.';
        return;
      }
      notices = updatedNotices;
      listError.textContent = '';
      renderNotices();
    });
    window.addEventListener('storage', event => {
      if (event.key !== noticeStorageKey) return;
      emptyState.textContent = 'Hiện chưa có thông báo mới.';
      listError.textContent = '';
      notices = readNotices();
      renderNotices();
    });

    try {
      const activeUser = sessionStorage.getItem(authKey);
      if (!activeUser) {
        window.location.replace('Quanlylichhoc.html');
      } else {
        const displayName = activeUser.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Sinh viên';
        document.getElementById('profileName').textContent = displayName;
        document.getElementById('profileEmail').textContent = activeUser;
        document.getElementById('profileAvatar').textContent =
          displayName.split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase() || 'SV';
        updateAdminModeUI();
      }
    } catch (error) {
      console.error('Không thể kiểm tra phiên đăng nhập:', error);
      window.location.replace('Quanlylichhoc.html');
    }
    document.getElementById('logoutButton').addEventListener('click', () => {
      try {
        sessionStorage.removeItem(authKey);
        sessionStorage.removeItem(adminModeKey);
      } catch (error) {
        console.error('Không thể kết thúc phiên đăng nhập:', error);
        window.alert('Không thể đăng xuất. Hãy thử tải lại trang.');
        return;
      }
      window.location.href = 'Quanlylichhoc.html';
    });

    const scheduleMenuToggle = document.getElementById('scheduleMenuToggle');
    const scheduleSubmenu = document.getElementById('scheduleSubmenu');
    scheduleMenuToggle.addEventListener('click', () => {
      const isExpanded = scheduleMenuToggle.getAttribute('aria-expanded') === 'true';
      scheduleMenuToggle.setAttribute('aria-expanded', String(!isExpanded));
      scheduleSubmenu.hidden = isExpanded;
    });
    renderNotices();
  
