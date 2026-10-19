    const examStorageKey = 'quanlylichthi-exams';
    const examList = document.getElementById('examList');
    const emptyState = document.getElementById('emptyState');
    const examModal = document.getElementById('examModal');
    const examForm = document.getElementById('examForm');
    const formError = document.getElementById('formError');
    const listError = document.getElementById('listError');
    const adminModeKey = 'quanlylichhoc-demo-admin-mode';
    let changeNoticeTimer;

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
      renderExams();
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

    function showChangeNotice(message) {
      const notice = document.getElementById('changeNotice');
      document.getElementById('changeNoticeText').textContent = message;
      notice.hidden = false;
      clearTimeout(changeNoticeTimer);
      changeNoticeTimer = setTimeout(() => { notice.hidden = true; }, 8000);
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[char]);
    }

    function readExams() {
      try {
        const saved = localStorage.getItem(examStorageKey);
        if (saved === null) return [];
        const exams = JSON.parse(saved);
        if (!Array.isArray(exams) || !exams.every(exam =>
          exam && typeof exam.id === 'string' && typeof exam.name === 'string' &&
          typeof exam.date === 'string' && typeof exam.time === 'string' &&
          typeof exam.room === 'string' && typeof exam.type === 'string' &&
          typeof exam.note === 'string'
        )) throw new Error('Dữ liệu lịch thi không hợp lệ.');
        return exams;
      } catch (error) {
        console.error('Không thể tải lịch thi đã lưu:', error);
        emptyState.textContent = 'Không thể tải lịch thi. Hãy kiểm tra dữ liệu lưu trên trình duyệt.';
        return [];
      }
    }

    function saveExamChange(updatedExams, notice, onError) {
      const noticeStorageKey = 'quanlylichhoc-notices';
      let previousExamData;
      let examsSaved = false;
      try {
        previousExamData = localStorage.getItem(examStorageKey);
        const savedNotices = localStorage.getItem(noticeStorageKey);
        const notices = savedNotices === null ? [] : JSON.parse(savedNotices);
        if (!Array.isArray(notices) || !notices.every(item =>
          item && typeof item.id === 'string' && typeof item.title === 'string' &&
          typeof item.content === 'string' && typeof item.createdAt === 'string' &&
          !Number.isNaN(Date.parse(item.createdAt))
        )) throw new Error('Dữ liệu thông báo không hợp lệ.');

        localStorage.setItem(examStorageKey, JSON.stringify(updatedExams));
        examsSaved = true;
        localStorage.setItem(noticeStorageKey, JSON.stringify([...notices, notice]));
        return true;
      } catch (error) {
        console.error('Không thể lưu thay đổi lịch thi và thông báo:', error);
        if (examsSaved) {
          try {
            if (previousExamData === null) localStorage.removeItem(examStorageKey);
            else localStorage.setItem(examStorageKey, previousExamData);
          } catch (rollbackError) {
            console.error('Không thể khôi phục lịch thi sau lỗi lưu thông báo:', rollbackError);
          }
        }
        onError();
        return false;
      }
    }

    let exams = readExams();

    function renderExams() {
      exams.sort((first, second) =>
        `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`)
      );
      emptyState.hidden = exams.length > 0;
      examList.innerHTML = exams.map(exam => {
        const date = new Intl.DateTimeFormat('vi-VN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date(`${exam.date}T12:00:00`));
        return `<article class="exam-item">
          <div>
            <h4>${escapeHtml(exam.name)}</h4>
            <div class="exam-details">
              <span>${escapeHtml(date)}</span>
              <span>${escapeHtml(exam.time)}</span>
              <span>Phòng ${escapeHtml(exam.room)}</span>
              <span>${escapeHtml(exam.type)}</span>
            </div>
            ${exam.note ? `<p class="exam-details">${escapeHtml(exam.note)}</p>` : ''}
          </div>
          ${isAdminMode() ? `<button class="control exam-remove" type="button" data-remove-exam="${escapeHtml(exam.id)}">Xóa</button>` : ''}
        </article>`;
      }).join('');
      document.querySelector('.card').classList.toggle('admin-mode', isAdminMode());
    }

    function closeModal() {
      examModal.classList.remove('open');
      examForm.reset();
      formError.textContent = '';
    }

    document.getElementById('addExam').addEventListener('click', () => {
      if (!isAdminMode()) {
        showChangeNotice('Chỉ quản trị viên mới được thêm hoặc xóa lịch thi.');
        return;
      }
      examForm.reset();
      formError.textContent = '';
      examModal.classList.add('open');
      document.getElementById('examName').focus();
    });
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelModal').addEventListener('click', closeModal);
    examModal.addEventListener('click', event => {
      if (event.target === examModal) closeModal();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && examModal.classList.contains('open')) closeModal();
    });
    examForm.addEventListener('submit', event => {
      event.preventDefault();
      formError.textContent = '';
      if (!isAdminMode()) {
        closeModal();
        showChangeNotice('Chỉ quản trị viên mới được thêm hoặc xóa lịch thi.');
        return;
      }
      if (!examForm.reportValidity()) return;
      const data = new FormData(examForm);
      const exam = {
        id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: String(data.get('name')).trim(),
        date: String(data.get('date')),
        time: String(data.get('time')),
        room: String(data.get('room')).trim(),
        type: String(data.get('type')),
        note: String(data.get('note')).trim()
      };
      if (!exam.name || !exam.room) {
        formError.textContent = 'Vui lòng nhập tên môn thi và phòng thi.';
        return;
      }
      const updatedExams = [...exams, exam];
      const examDate = new Intl.DateTimeFormat('vi-VN', {
        day: 'numeric', month: 'long', year: 'numeric'
      }).format(new Date(`${exam.date}T12:00:00`));
      const saved = saveExamChange(updatedExams, {
        id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: 'Lịch thi đã cập nhật',
        content: `Đã thêm lịch thi ${exam.name} vào ngày ${examDate}, lúc ${exam.time}, phòng ${exam.room}.`,
        createdAt: new Date().toISOString()
      }, () => {
        formError.textContent = 'Không lưu được lịch thi kèm thông báo. Hãy kiểm tra cài đặt lưu trữ của trình duyệt.';
      });
      if (!saved) return;
      listError.textContent = '';
      emptyState.textContent = 'Chưa có lịch thi được cập nhật.';
      exams = updatedExams;
      closeModal();
      renderExams();
      showChangeNotice('Đã thêm lịch thi và lưu thông báo.');
    });
    examList.addEventListener('click', event => {
      const button = event.target.closest('[data-remove-exam]');
      if (!button) return;
      if (!isAdminMode()) {
        showChangeNotice('Chỉ quản trị viên mới được thêm hoặc xóa lịch thi.');
        renderExams();
        return;
      }
      const removedExam = exams.find(exam => exam.id === button.dataset.removeExam);
      if (!removedExam) return;
      const updatedExams = exams.filter(exam => exam.id !== removedExam.id);
      const examDate = new Intl.DateTimeFormat('vi-VN', {
        day: 'numeric', month: 'long', year: 'numeric'
      }).format(new Date(`${removedExam.date}T12:00:00`));
      const saved = saveExamChange(updatedExams, {
        id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: 'Lịch thi đã cập nhật',
        content: `Đã xóa lịch thi ${removedExam.name} ngày ${examDate}, lúc ${removedExam.time}, phòng ${removedExam.room}.`,
        createdAt: new Date().toISOString()
      }, () => {
        listError.textContent = 'Không thể xóa lịch thi kèm thông báo. Hãy thử lại.';
      });
      if (!saved) return;
      listError.textContent = '';
      emptyState.textContent = 'Chưa có lịch thi được cập nhật.';
      exams = updatedExams;
      renderExams();
      showChangeNotice('Đã xóa lịch thi và lưu thông báo.');
    });

    const authKey = 'quanlylichhoc-demo-user';
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
    renderExams();
  
