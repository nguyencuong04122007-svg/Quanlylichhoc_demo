    const slots = ['07:00 – 09:00', '09:00 – 11:00', '13:00 – 15:00', '15:00 – 17:00'];
    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    const storageKey = 'quanlylichhoc-standalone';
    const noticeStorageKey = 'quanlylichhoc-notices';
    const defaultLessons = [
      { id: 'a1', course: 'Cơ sở dữ liệu', className: 'KTPM-01', teacher: 'Trần Thu Hà', room: 'A203', day: 1, slot: 0, type: 'lecture' },
      { id: 'a2', course: 'Nhập môn lập trình', className: 'KTPM-02', teacher: 'Nguyễn Minh Hải', room: 'B105', day: 1, slot: 2, type: 'practice' },
      { id: 'a3', course: 'Toán rời rạc', className: 'CNTT-01', teacher: 'Phạm Ngọc Anh', room: 'A301', day: 2, slot: 1, type: 'lecture' },
      { id: 'a4', course: 'Phát triển ứng dụng web', className: 'KTPM-01', teacher: 'Lê Quốc Bảo', room: 'Lab 02', day: 3, slot: 2, type: 'practice' },
      { id: 'a5', course: 'Cơ sở dữ liệu', className: 'CNTT-01', teacher: 'Trần Thu Hà', room: 'A203', day: 4, slot: 0, type: 'lecture' },
      { id: 'a6', course: 'Nhập môn lập trình', className: 'KTPM-02', teacher: 'Nguyễn Minh Hải', room: 'B105', day: 5, slot: 1, type: 'lecture' },
      { id: 'a7', course: 'Phát triển ứng dụng web', className: 'KTPM-01', teacher: 'Lê Quốc Bảo', room: 'Lab 02', day: 6, slot: 0, type: 'practice' }
    ];
    const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });
    const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    let exceptions = {};
    let lessons = readLessons();
    let selectedDate = new Date();
    let calendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 12);
    const filter = document.getElementById('classFilter');
    const body = document.getElementById('scheduleBody');
    const calendarGrid = document.getElementById('calendarGrid');
    const viewMode = document.getElementById('viewMode');
    const modal = document.getElementById('lessonModal');
    const form = document.getElementById('lessonForm');
    const errorMessage = document.getElementById('formError');
    const scopeSelect = document.getElementById('scope');
    const dateField = document.getElementById('dateField');
    const dateRangeField = document.getElementById('dateRangeField');
    const dayField = document.getElementById('dayField');
    const deleteSeriesButton = document.getElementById('deleteSeries');
    let editing = null;

    function isValidDateValue(value) {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      return dateInputValue(new Date(`${value}T12:00:00`)) === value;
    }
    function isValidLesson(item) {
      return item && typeof item.id === 'string' && typeof item.course === 'string' &&
        typeof item.className === 'string' && typeof item.teacher === 'string' &&
        typeof item.room === 'string' && Number.isInteger(item.day) && item.day >= 1 && item.day <= 7 &&
        Number.isInteger(item.slot) && item.slot >= 0 && item.slot < slots.length &&
        (item.type === 'lecture' || item.type === 'practice' || item.type === 'makeup' || item.type === 'holiday') &&
        (item.date === undefined || (isValidDateValue(item.date) && item.startDate === undefined && item.endDate === undefined)) &&
        ((item.startDate === undefined && item.endDate === undefined) ||
          (item.date === undefined && isValidDateValue(item.startDate) && isValidDateValue(item.endDate) &&
            item.startDate <= item.endDate));
    }
    const loginScreen = document.getElementById('loginScreen');
    const scheduleApp = document.getElementById('scheduleApp');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const authKey = 'quanlylichhoc-demo-user';
    const adminModeKey = 'quanlylichhoc-demo-admin-mode';
    const navLinks = [...document.querySelectorAll('.main-nav a')];
    const scheduleMenuToggle = document.getElementById('scheduleMenuToggle');
    const scheduleSubmenu = document.getElementById('scheduleSubmenu');

    function updateActiveNav() {
      const activeHash = window.location.hash || '#home';
      let activeScheduleLink = false;
      navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === activeHash;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
        if (isActive && (activeHash === '#scheduleSection' || activeHash === '#lookupSection')) {
          activeScheduleLink = true;
        }
      });
      scheduleMenuToggle.classList.toggle('active', activeScheduleLink);
    }
    scheduleMenuToggle.addEventListener('click', () => {
      const isExpanded = scheduleMenuToggle.getAttribute('aria-expanded') === 'true';
      scheduleMenuToggle.setAttribute('aria-expanded', String(!isExpanded));
      scheduleSubmenu.hidden = isExpanded;
    });
    window.addEventListener('hashchange', updateActiveNav);
    updateActiveNav();

    function showSchedule(email) {
      loginScreen.hidden = true;
      scheduleApp.hidden = false;
      document.getElementById('profileEmail').textContent = email;
      const displayName = email.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Sinh viên';
      document.getElementById('profileName').textContent = displayName;
      const initials = displayName.split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
      document.querySelector('.profile-avatar').textContent = initials || 'SV';
      updateAdminModeUI();
    }

    function updateAdminModeUI() {
      let isAdminMode = false;
      try {
        isAdminMode = sessionStorage.getItem(adminModeKey) === 'true';
      } catch (error) {
        console.error('Không thể đọc chế độ tài khoản:', error);
      }
      const toggle = document.getElementById('adminModeToggle');
      toggle.setAttribute('aria-pressed', String(isAdminMode));
      toggle.textContent = isAdminMode ? 'Chuyển sang sinh viên' : 'Chuyển sang quản trị viên';
      document.getElementById('accountModeLabel').textContent =
        `Chế độ: ${isAdminMode ? 'Quản trị viên' : 'Sinh viên'}`;
      scheduleApp.classList.toggle('admin-mode', isAdminMode);
      render();
    }

    document.getElementById('adminModeToggle').addEventListener('click', event => {
      const toggle = event.currentTarget;
      const enableAdminMode = toggle.getAttribute('aria-pressed') !== 'true';
      try {
        sessionStorage.setItem(adminModeKey, String(enableAdminMode));
      } catch (error) {
        console.error('Không thể đổi chế độ tài khoản:', error);
        window.alert('Không thể lưu chế độ tài khoản. Hãy bật lưu trữ phiên của trình duyệt rồi thử lại.');
        return;
      }
      updateAdminModeUI();
    });

    function isAdminMode() {
      try {
        return sessionStorage.getItem(adminModeKey) === 'true';
      } catch (error) {
        console.error('Không thể kiểm tra quyền quản trị:', error);
        return false;
      }
    }

    function showLogin() {
      scheduleApp.hidden = true;
      loginScreen.hidden = false;
      loginForm.reset();
      loginError.textContent = '';
      document.getElementById('loginEmail').focus();
    }

    loginForm.addEventListener('submit', event => {
      event.preventDefault();
      loginError.textContent = '';
      const data = new FormData(loginForm);
      const email = String(data.get('email')).trim().toLowerCase();
      const password = String(data.get('password'));
      if (!loginForm.reportValidity()) return;
      if (password.length < 6) {
        loginError.textContent = 'Mật khẩu cần có ít nhất 6 ký tự.';
        return;
      }
      try {
        sessionStorage.setItem(authKey, email);
      } catch (error) {
        console.error('Không thể lưu phiên đăng nhập:', error);
        loginError.textContent = 'Trình duyệt không cho phép lưu phiên đăng nhập. Hãy bật lưu trữ trang web rồi thử lại.';
        return;
      }
      showSchedule(email);
    });

    document.getElementById('logoutButton').addEventListener('click', () => {
      try {
        sessionStorage.removeItem(authKey);
        sessionStorage.removeItem(adminModeKey);
      } catch (error) {
        console.error('Không thể xóa phiên đăng nhập:', error);
        loginError.textContent = 'Không thể kết thúc phiên đăng nhập. Hãy thử tải lại trang.';
        return;
      }
      showLogin();
    });

    try {
      const activeUser = sessionStorage.getItem(authKey);
      if (activeUser) showSchedule(activeUser);
      else showLogin();
    } catch (error) {
      console.error('Không thể kiểm tra phiên đăng nhập:', error);
      showLogin();
      loginError.textContent = 'Không thể kiểm tra phiên đăng nhập của trình duyệt.';
    }

    function readLessons() {
      let saved;
      try {
        saved = localStorage.getItem(storageKey);
      } catch (error) {
        console.error('Không thể truy cập lịch học đã lưu:', error);
        return defaultLessons.map(item => ({ ...item }));
      }
      if (saved === null) return defaultLessons.map(item => ({ ...item }));
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(isValidLesson)) return parsed;
        if (parsed && Array.isArray(parsed.lessons) && parsed.lessons.every(isValidLesson) &&
          parsed.exceptions && typeof parsed.exceptions === 'object' && !Array.isArray(parsed.exceptions) &&
          Object.values(parsed.exceptions).every(value => value === null ||
            (value && value.cancelled === true) || isValidLesson(value))) {
          exceptions = parsed.exceptions;
          return parsed.lessons;
        }
        throw new Error('Dữ liệu lịch học không hợp lệ.');
      } catch (error) {
        console.error('Không thể tải lịch học đã lưu:', error);
        return defaultLessons.map(item => ({ ...item }));
      }
    }
    let scheduleNoticeTimer;
    function showScheduleNotice(message, isError = false) {
      const notice = document.getElementById('scheduleNotice');
      document.getElementById('scheduleNoticeText').textContent = message;
      notice.classList.toggle('error', isError);
      notice.hidden = false;
      clearTimeout(scheduleNoticeTimer);
      scheduleNoticeTimer = setTimeout(() => { notice.hidden = true; }, 8000);
    }
    function saveLessonsWithNotice(content) {
      let previousScheduleData;
      let scheduleSaved = false;
      try {
        previousScheduleData = localStorage.getItem(storageKey);
        const savedNotices = localStorage.getItem(noticeStorageKey);
        const notices = savedNotices === null ? [] : JSON.parse(savedNotices);
        if (!Array.isArray(notices) || !notices.every(item =>
          item && typeof item.id === 'string' && typeof item.title === 'string' &&
          typeof item.content === 'string' && typeof item.createdAt === 'string' &&
          !Number.isNaN(Date.parse(item.createdAt))
        )) throw new Error('Dữ liệu thông báo không hợp lệ.');

        localStorage.setItem(storageKey, JSON.stringify({ lessons, exceptions }));
        scheduleSaved = true;
        localStorage.setItem(noticeStorageKey, JSON.stringify([...notices, {
          id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: 'Lịch học đã cập nhật',
          content,
          createdAt: new Date().toISOString()
        }]));
        return true;
      } catch (error) {
        console.error('Không thể lưu thay đổi lịch học và thông báo:', error);
        if (scheduleSaved) {
          try {
            if (previousScheduleData === null) localStorage.removeItem(storageKey);
            else localStorage.setItem(storageKey, previousScheduleData);
          } catch (rollbackError) {
            console.error('Không thể khôi phục lịch học sau lỗi lưu thông báo:', rollbackError);
          }
        }
        errorMessage.textContent = 'Không lưu được thay đổi lịch học kèm thông báo. Hãy kiểm tra cài đặt lưu trữ của trình duyệt.';
        showScheduleNotice(errorMessage.textContent, true);
        return false;
      }
    }
    function localDate(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    }
    function mondayOf(date) {
      const result = localDate(date);
      result.setDate(result.getDate() - (result.getDay() + 6) % 7);
      return result;
    }
    function offsetDate(date, days) {
      const result = localDate(date);
      result.setDate(result.getDate() + days);
      return result;
    }
    function dateInputValue(date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    function weekdayIndex(date) {
      const weekday = date.getDay();
      return weekday === 0 ? 7 : weekday;
    }
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    }
    function exceptionKey(lessonId, date) {
      return `${lessonId}:${date}`;
    }
    function getLessonsOnDate(date, excludedLessonId) {
      const weekday = weekdayIndex(new Date(`${date}T12:00:00`));
      const recurring = lessons.filter(item => !item.date && item.id !== excludedLessonId && item.day === weekday &&
        (!item.startDate || date >= item.startDate) && (!item.endDate || date <= item.endDate))
        .flatMap(item => {
          const exception = exceptions[exceptionKey(item.id, date)];
          if (exception === null || (exception && exception.cancelled)) return [];
          return [{ ...item, ...(exception || {}) }];
        });
      const singleDate = lessons.filter(item => item.date === date && item.id !== excludedLessonId);
      return [...recurring, ...singleDate];
    }
    function findScheduleConflict(candidate, scope, date, excludedLessonId) {
      if (scope === 'once') {
        const conflictingLesson = getLessonsOnDate(date, excludedLessonId)
          .find(item => item.slot === candidate.slot);
        return conflictingLesson ? { lesson: conflictingLesson, date } : null;
      }

      if (scope === 'range') {
        const firstDate = new Date(`${candidate.startDate}T12:00:00`);
        const startOffset = (candidate.day - weekdayIndex(firstDate) + 7) % 7;
        let occurrenceDate = dateInputValue(offsetDate(firstDate, startOffset));
        while (occurrenceDate <= candidate.endDate) {
          const conflictingLesson = getLessonsOnDate(occurrenceDate, excludedLessonId)
            .find(item => item.slot === candidate.slot);
          if (conflictingLesson) return { lesson: conflictingLesson, date: occurrenceDate };
          occurrenceDate = dateInputValue(offsetDate(new Date(`${occurrenceDate}T12:00:00`), 7));
        }
        return null;
      }

      const recurringConflict = lessons.find(item =>
        !item.date && item.id !== excludedLessonId &&
        item.day === candidate.day && item.slot === candidate.slot
      );
      if (recurringConflict) return { lesson: recurringConflict, recurring: true };

      const oneOffConflict = lessons.find(item =>
        item.date && item.id !== excludedLessonId &&
        weekdayIndex(new Date(`${item.date}T12:00:00`)) === candidate.day &&
        item.slot === candidate.slot
      );
      if (oneOffConflict) return { lesson: oneOffConflict, date: oneOffConflict.date };

      for (const [key, override] of Object.entries(exceptions)) {
        const separator = key.lastIndexOf(':');
        if (separator < 0) continue;
        const lessonId = key.slice(0, separator);
        const exceptionDate = key.slice(separator + 1);
        const weekday = weekdayIndex(new Date(`${exceptionDate}T12:00:00`));
        if (lessonId === excludedLessonId || weekday !== candidate.day ||
          !override || override.cancelled || override.slot !== candidate.slot) continue;
        const base = lessons.find(item => item.id === lessonId);
        if (base) return { lesson: { ...base, ...override }, date: exceptionDate };
      }
      return null;
    }
    function renderCalendar() {
      const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(calendarMonth);
      document.getElementById('calendarMonth').textContent =
        monthLabel.charAt(0).toLocaleUpperCase('vi-VN') + monthLabel.slice(1);
      const headings = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const firstDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1, 12);
      const gridStart = mondayOf(firstDate);
      const today = dateInputValue(new Date());
      const selected = dateInputValue(selectedDate);
      const headingHtml = headings.map(label => `<span class="calendar-weekday">${label}</span>`).join('');
      const daysHtml = Array.from({ length: 42 }, (_, index) => {
        const date = offsetDate(gridStart, index);
        const dateValue = dateInputValue(date);
        const outsideMonth = date.getMonth() !== calendarMonth.getMonth();
        const hasLessons = getLessonsOnDate(dateValue).length > 0;
        const classes = [
          'calendar-day',
          outsideMonth ? 'outside-month' : '',
          dateValue === today ? 'today' : '',
          dateValue === selected ? 'selected' : '',
          hasLessons ? 'has-lessons' : ''
        ].filter(Boolean).join(' ');
        return `<button class="${classes}" type="button" data-calendar-date="${dateValue}" aria-label="${weekdays[date.getDay()]}, ${dateFormat.format(date)}${hasLessons ? ', có lịch học' : ''}" aria-pressed="${dateValue === selected}">${date.getDate()}</button>`;
      }).join('');
      calendarGrid.innerHTML = headingHtml + daysHtml;
    }
    function render() {
      const monday = mondayOf(selectedDate);
      const sunday = offsetDate(monday, 6);
      const isDayView = viewMode.value === 'day';
      document.getElementById('scheduleSection').classList.toggle('day-view', isDayView);
      document.getElementById('weekLabel').textContent = isDayView
        ? `${weekdays[selectedDate.getDay()]}, ${dateFormat.format(selectedDate)}`
        : `${dateFormat.format(monday)} – ${dateFormat.format(sunday)}`;
      document.getElementById('scheduleSection').setAttribute('aria-label', isDayView ? 'Thời khóa biểu ngày' : 'Thời khóa biểu tuần');
      document.getElementById('lessonCount').previousElementSibling.textContent = isDayView ? 'Buổi học trong ngày' : 'Buổi học trong tuần';
      document.getElementById('todayLabel').textContent = `${weekdays[new Date().getDay()]}, ${new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}`;
      const visibleDays = isDayView
        ? [{ label: weekdays[selectedDate.getDay()], index: (selectedDate.getDay() + 6) % 7, date: selectedDate }]
        : days.map((label, index) => ({ label, index, date: offsetDate(monday, index) }));
      document.getElementById('scheduleHead').innerHTML = `<tr><th>Ca học</th>${visibleDays.map(day => `<th>${day.label}<span>${dateFormat.format(day.date)}</span></th>`).join('')}</tr>`;
      const className = filter.value;
      const visible = [];
      const occurrencesByDate = visibleDays.map(day => {
        const date = dateInputValue(day.date);
        const recurring = lessons.filter(item => !item.date && item.day === day.index + 1 &&
          (!item.startDate || date >= item.startDate) && (!item.endDate || date <= item.endDate) &&
          (!className || item.className === className)).flatMap(item => {
            const exception = exceptions[exceptionKey(item.id, date)];
            if (exception === null || (exception && exception.cancelled)) return [];
            return [{ ...item, ...(exception || {}), sourceId: item.id, occurrenceDate: date }];
          });
        const singleDate = lessons.filter(item => item.date === date &&
          (!className || item.className === className)).map(item => ({
            ...item, sourceId: item.id, occurrenceDate: date, isOneOff: true
          }));
        const occurrences = [...recurring, ...singleDate];
        visible.push(...occurrences);
        return occurrences;
      });
      body.innerHTML = slots.map((time, slot) => `<tr><td class="time">${time}</td>${visibleDays.map((_, index) => {
        const items = occurrencesByDate[index].filter(item => item.slot === slot);
        if (!items.length) return '<td class="empty">—</td>';
        return `<td>${items.map(item => `<article class="lesson ${item.type === 'practice' ? 'practice' : item.type === 'makeup' ? 'makeup' : item.type === 'holiday' ? 'holiday' : ''}">
          ${isAdminMode() ? `<button class="remove lesson-actions" type="button" data-remove="${escapeHtml(item.sourceId)}" data-date="${escapeHtml(item.occurrenceDate)}" aria-label="Hủy ${escapeHtml(item.course)} ngày ${escapeHtml(item.occurrenceDate)}">×</button>
          <button class="remove lesson-actions edit-action" type="button" data-edit="${escapeHtml(item.sourceId)}" data-date="${escapeHtml(item.occurrenceDate)}" aria-label="Sửa ${escapeHtml(item.course)} ngày ${escapeHtml(item.occurrenceDate)}">✎</button>` : ''}
          <strong>${escapeHtml(item.course)}</strong><span class="class-name">${escapeHtml(item.className)}</span>
          <span>${escapeHtml(item.teacher)}</span><span>Phòng ${escapeHtml(item.room)}</span>
        </article>`).join('')}</td>`;
      }).join('')}</tr>`).join('');
      document.getElementById('lessonCount').textContent = visible.length;
      document.getElementById('courseCount').textContent = new Set(visible.map(item => item.course)).size;
      document.getElementById('classCount').textContent = new Set(visible.map(item => item.className)).size;
      document.getElementById('dayCount').textContent = isDayView
        ? (visible.length ? 1 : 0)
        : new Set(visible.map(item => item.day)).size;
      const selected = filter.value;
      const classes = [...new Set(lessons.map(item => item.className))].sort();
      filter.innerHTML = '<option value="">Tất cả lớp</option>' + classes.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
      filter.value = classes.includes(selected) ? selected : '';
      renderLookup();
      renderCalendar();
    }
    function normalizeSearch(value) {
      return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi-VN').trim();
    }
    function nextLessonDate(item) {
      if (item.date) return item.date;
      const today = localDate(new Date());
      let anchor = item.startDate && item.startDate > dateInputValue(today)
        ? new Date(`${item.startDate}T12:00:00`)
        : today;
      let nextDate = offsetDate(anchor, (item.day - weekdayIndex(anchor) + 7) % 7);
      if (item.endDate && dateInputValue(nextDate) > item.endDate) {
        anchor = new Date(`${item.startDate}T12:00:00`);
        nextDate = offsetDate(anchor, (item.day - weekdayIndex(anchor) + 7) % 7);
      }
      let dateValue = dateInputValue(nextDate);
      while ((!item.endDate || dateValue <= item.endDate) &&
        !getLessonsOnDate(dateValue).some(occurrence => occurrence.id === item.id)) {
        nextDate = offsetDate(nextDate, 7);
        dateValue = dateInputValue(nextDate);
      }
      if (item.endDate && dateValue > item.endDate) return null;
      return dateValue;
    }
    function renderLookup() {
      const searchInput = document.getElementById('lessonSearch');
      const searchDate = document.getElementById('lessonSearchDate').value;
      const results = document.getElementById('lookupResults');
      const query = normalizeSearch(searchInput.value);
      if (!query && !searchDate) {
        results.innerHTML = '<p class="lookup-empty">Nhập từ khóa hoặc chọn ngày để tra cứu lịch học.</p>';
        return;
      }
      const matches = searchDate
        ? getLessonsOnDate(searchDate).filter(item =>
          !query || normalizeSearch([item.course, item.className, item.teacher, item.room].join(' ')).includes(query)
        ).map(item => ({ item, date: searchDate }))
        : lessons.filter(item =>
          normalizeSearch([item.course, item.className, item.teacher, item.room].join(' ')).includes(query)
        ).map(item => ({ item, date: nextLessonDate(item) }));
      if (!matches.length) {
        results.innerHTML = '<p class="lookup-empty">Không tìm thấy lịch học phù hợp.</p>';
        return;
      }
      results.innerHTML = matches.map(({ item, date }) => {
        const dateLabel = date
          ? new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            .format(new Date(`${date}T12:00:00`))
          : 'Chưa có ngày học';
        const period = searchDate ? dateLabel : item.date ? dateLabel : item.startDate
          ? `${date ? `Buổi gần nhất: ${dateLabel} · ` : 'Đã hết thời gian áp dụng · '}Lặp vào ${days[item.day - 1]} từ ${item.startDate} đến ${item.endDate}`
          : `Buổi gần nhất: ${dateLabel} · Lặp vào ${days[item.day - 1]} hàng tuần`;
        return `<article class="lookup-result">
          <div>
            <h3>${escapeHtml(item.course)} · ${escapeHtml(item.className)}</h3>
            <p>${escapeHtml(item.teacher)} · Phòng ${escapeHtml(item.room)}<br>${escapeHtml(period)} · ${escapeHtml(slots[item.slot])}</p>
          </div>
          <button class="control" type="button" data-lookup-date="${escapeHtml(date || '')}" ${date ? '' : 'disabled'}>Xem lịch</button>
        </article>`;
      }).join('');
    }
    function updateScopeFields() {
      const isOnce = scopeSelect.value === 'once';
      const isRange = scopeSelect.value === 'range';
      dateField.classList.toggle('hidden', !isOnce);
      dateRangeField.classList.toggle('hidden', !isRange);
      dayField.classList.toggle('hidden', isOnce);
      document.getElementById('lessonDate').disabled = isOnce && editing && !editing.isOneOff;
    }
    function closeModal() {
      modal.classList.remove('open');
      form.reset();
      editing = null;
      scopeSelect.options[0].disabled = false;
      scopeSelect.options[1].disabled = false;
      errorMessage.textContent = '';
    }
    function openAddLesson() {
      if (!isAdminMode()) {
        showScheduleNotice('Chỉ quản trị viên mới được thêm hoặc sửa lịch học.', true);
        return;
      }
      form.reset();
      editing = null;
      document.getElementById('modalTitle').textContent = 'Thêm buổi học';
      document.getElementById('saveLesson').textContent = 'Lưu buổi học';
      scopeSelect.value = 'range';
      deleteSeriesButton.hidden = true;
      const pickedDate = selectedDate;
      document.getElementById('lessonDate').value = dateInputValue(pickedDate);
      document.getElementById('startDate').value = dateInputValue(pickedDate);
      document.getElementById('endDate').value = dateInputValue(offsetDate(pickedDate, 27));
      document.getElementById('day').value = String(weekdayIndex(pickedDate));
      scopeSelect.options[0].disabled = false;
      scopeSelect.options[1].disabled = false;
      updateScopeFields();
      errorMessage.textContent = '';
      modal.classList.add('open');
      document.getElementById('course').focus();
    }
    function openEditLesson(lessonId, date) {
      if (!isAdminMode()) {
        showScheduleNotice('Chỉ quản trị viên mới được thêm hoặc sửa lịch học.', true);
        return;
      }
      const base = lessons.find(item => item.id === lessonId);
      if (!base) return;
      const isOneOff = Boolean(base.date);
      const exception = isOneOff ? null : exceptions[exceptionKey(lessonId, date)];
      const occurrence = { ...base, ...(exception || {}) };
      if (exception === null) return;

      editing = { id: lessonId, date, isOneOff };
      document.getElementById('modalTitle').textContent = 'Sửa buổi học';
      document.getElementById('saveLesson').textContent = 'Lưu thay đổi';
      form.elements.course.value = occurrence.course;
      form.elements.className.value = occurrence.className;
      form.elements.teacher.value = occurrence.teacher;
      form.elements.room.value = occurrence.room;
      form.elements.day.value = String(occurrence.day);
      form.elements.slot.value = String(occurrence.slot);
      form.elements.type.value = occurrence.type;
      document.getElementById('lessonDate').value = isOneOff ? base.date : date;
      document.getElementById('startDate').value = base.startDate || '';
      document.getElementById('endDate').value = base.endDate || '';
      scopeSelect.value = isOneOff ? 'once' : (base.startDate ? 'range' : 'once');
      scopeSelect.options[0].disabled = isOneOff;
      deleteSeriesButton.hidden = isOneOff;
      updateScopeFields();
      errorMessage.textContent = '';
      modal.classList.add('open');
      document.getElementById('course').focus();
    }
    scopeSelect.addEventListener('change', updateScopeFields);
    document.getElementById('previousWeek').addEventListener('click', () => { selectedDate = offsetDate(selectedDate, viewMode.value === 'day' ? -1 : -7); render(); });
    document.getElementById('nextWeek').addEventListener('click', () => { selectedDate = offsetDate(selectedDate, viewMode.value === 'day' ? 1 : 7); render(); });
    document.getElementById('currentWeek').addEventListener('click', () => { selectedDate = new Date(); render(); });
    viewMode.addEventListener('change', render);
    filter.addEventListener('change', render);
    document.getElementById('lessonSearch').addEventListener('input', renderLookup);
    document.getElementById('lessonSearchDate').addEventListener('change', renderLookup);
    document.getElementById('lookupResults').addEventListener('click', event => {
      const button = event.target.closest('[data-lookup-date]');
      if (!button || !button.dataset.lookupDate) return;
      const [year, month, day] = button.dataset.lookupDate.split('-').map(Number);
      selectedDate = new Date(year, month - 1, day, 12);
      calendarMonth = new Date(year, month - 1, 1, 12);
      render();
      document.getElementById('scheduleSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('previousMonth').addEventListener('click', () => {
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1, 12);
      renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1, 12);
      renderCalendar();
    });
    calendarGrid.addEventListener('click', event => {
      const dateButton = event.target.closest('[data-calendar-date]');
      if (!dateButton) return;
      const [year, month, day] = dateButton.dataset.calendarDate.split('-').map(Number);
      selectedDate = new Date(year, month - 1, day, 12);
      calendarMonth = new Date(year, month - 1, 1, 12);
      render();
    });
    document.getElementById('addLesson').addEventListener('click', openAddLesson);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelModal').addEventListener('click', closeModal);
    deleteSeriesButton.addEventListener('click', () => {
      if (!isAdminMode()) {
        showScheduleNotice('Chỉ quản trị viên mới được xóa lịch học.', true);
        return;
      }
      if (!editing || editing.isOneOff) return;
      const base = lessons.find(item => item.id === editing.id);
      if (!base || !window.confirm(`Xóa toàn bộ lịch lặp "${base.course}" của lớp ${base.className}?`)) return;
      const previousLessons = lessons;
      const previousExceptions = exceptions;
      lessons = lessons.filter(item => item.id !== editing.id);
      exceptions = Object.fromEntries(Object.entries(exceptions).filter(([key]) => !key.startsWith(`${editing.id}:`)));
      if (saveLessonsWithNotice(`Đã xóa toàn bộ lịch lặp "${base.course}" của lớp ${base.className}.`)) {
        closeModal();
        render();
        showScheduleNotice('Đã xóa lịch học và lưu thông báo.');
      } else {
        lessons = previousLessons;
        exceptions = previousExceptions;
      }
    });
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
    body.addEventListener('click', event => {
      const button = event.target.closest('[data-edit], [data-remove]');
      if (!button) return;
      if (!isAdminMode()) {
        showScheduleNotice('Chỉ quản trị viên mới được thay đổi lịch học.', true);
        return;
      }
      if (button.dataset.edit) {
        openEditLesson(button.dataset.edit, button.dataset.date);
        return;
      }
      const lesson = lessons.find(item => item.id === button.dataset.remove);
      const occurrenceDate = button.dataset.date;
      if (!lesson || !window.confirm(`Hủy buổi học "${lesson.course}" của lớp ${lesson.className} ngày ${occurrenceDate}? Các tuần khác sẽ được giữ nguyên.`)) return;
      const previousLessons = lessons;
      const previousExceptions = exceptions;
      if (lesson.date) {
        lessons = lessons.filter(item => item.id !== lesson.id);
      } else {
        exceptions = { ...exceptions, [exceptionKey(lesson.id, occurrenceDate)]: { cancelled: true } };
      }
      if (saveLessonsWithNotice(`Đã hủy buổi học "${lesson.course}" của lớp ${lesson.className} ngày ${occurrenceDate}.`)) {
        render();
        showScheduleNotice('Đã thay đổi lịch học và lưu thông báo.');
      }
      else {
        lessons = previousLessons;
        exceptions = previousExceptions;
      }
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      errorMessage.textContent = '';
      if (!isAdminMode()) {
        showScheduleNotice('Chỉ quản trị viên mới được thêm hoặc sửa lịch học.', true);
        closeModal();
        return;
      }
      const data = new FormData(form);
      const fields = {
        course: String(data.get('course')).trim(),
        className: String(data.get('className')).trim(),
        teacher: String(data.get('teacher')).trim(),
        room: String(data.get('room')).trim(),
        day: Number(data.get('day')),
        slot: Number(data.get('slot')),
        type: String(data.get('type'))
      };
      const scope = String(data.get('scope'));
      const date = document.getElementById('lessonDate').value;
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      if (!fields.course || !fields.className || !fields.teacher || !fields.room) {
        errorMessage.textContent = 'Vui lòng nhập đầy đủ thông tin buổi học.';
        return;
      }
      if (scope === 'once' && !editing?.isOneOff && !date) {
        errorMessage.textContent = 'Vui lòng chọn ngày học.';
        return;
      }
      if (scope === 'range') {
        if (!isValidDateValue(startDate) || !isValidDateValue(endDate)) {
          errorMessage.textContent = 'Vui lòng chọn ngày bắt đầu và ngày kết thúc hợp lệ.';
          return;
        }
        if (startDate > endDate) {
          errorMessage.textContent = 'Ngày kết thúc phải từ ngày bắt đầu trở đi.';
          return;
        }
        const firstRangeDate = new Date(`${startDate}T12:00:00`);
        const firstOccurrence = offsetDate(firstRangeDate,
          (fields.day - weekdayIndex(firstRangeDate) + 7) % 7);
        if (dateInputValue(firstOccurrence) > endDate) {
          errorMessage.textContent = `Khoảng ngày đã chọn không có ${days[fields.day - 1]}.`;
          return;
        }
      }
      const candidateDate = editing && !editing.isOneOff && scope === 'once'
        ? editing.date
        : (editing?.isOneOff || scope === 'once' ? date : null);
      const candidateDay = candidateDate
        ? weekdayIndex(new Date(`${candidateDate}T12:00:00`))
        : fields.day;
      const conflict = findScheduleConflict(
        { ...fields, day: candidateDay, startDate, endDate },
        scope,
        candidateDate,
        editing?.id
      );
      if (conflict) {
        const dateDescription = conflict.recurring
          ? `mỗi ${days[candidateDay - 1]}`
          : `ngày ${conflict.date}`;
        errorMessage.textContent =
          `Ca ${slots[fields.slot]} ${dateDescription} đã có môn "${conflict.lesson.course}" (${conflict.lesson.className}). Hãy chọn ca khác để tránh trùng lịch.`;
        return;
      }

      const previousLessons = lessons.map(item => ({ ...item }));
      const previousExceptions = { ...exceptions };
      const wasEditing = Boolean(editing);
      const changedCourse = fields.course;
      const changedClass = fields.className;
      let changeDescription;
      if (editing) {
        const index = lessons.findIndex(item => item.id === editing.id);
        if (index < 0) {
          errorMessage.textContent = 'Không tìm thấy buổi học cần sửa. Hãy đóng cửa sổ và tải lại lịch.';
          return;
        }
        const base = lessons[index];
        if (editing.isOneOff) {
          const oneOffDate = date || base.date;
          const weekday = weekdayIndex(new Date(`${oneOffDate}T12:00:00`));
          if (!oneOffDate) {
            errorMessage.textContent = 'Vui lòng chọn ngày học.';
            return;
          }
          lessons[index] = { ...base, ...fields, day: weekday, date: oneOffDate };
        } else if (scope === 'weekly') {
          lessons[index] = { ...base, ...fields };
          delete lessons[index].startDate;
          delete lessons[index].endDate;
          exceptions = { ...exceptions };
          delete exceptions[exceptionKey(base.id, editing.date)];
        } else if (scope === 'range') {
          lessons[index] = { ...base, ...fields, startDate, endDate };
          exceptions = { ...exceptions };
          delete exceptions[exceptionKey(base.id, editing.date)];
        } else {
          const exceptionDate = editing.date;
          const weekday = weekdayIndex(new Date(`${exceptionDate}T12:00:00`));
          const override = { ...base, ...fields, day: weekday };
          exceptions = { ...exceptions, [exceptionKey(base.id, exceptionDate)]: override };
        }
      } else if (scope === 'once') {
        const weekday = weekdayIndex(new Date(`${date}T12:00:00`));
        lessons.push({
          id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          ...fields,
          day: weekday,
          date
        });
      } else if (scope === 'range') {
        lessons.push({
          id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          ...fields,
          startDate,
          endDate
        });
      } else {
        lessons.push({
          id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          ...fields
        });
      }

      const lessonDescription = `"${changedCourse}" của lớp ${changedClass}`;
      if (wasEditing) {
        changeDescription = scope === 'once'
          ? `Đã sửa buổi học ${lessonDescription} ngày ${candidateDate || date}.`
          : `Đã cập nhật lịch học ${lessonDescription}${scope === 'range' ? ` từ ${startDate} đến ${endDate}` : ''}.`;
      } else {
        changeDescription = scope === 'once'
          ? `Đã thêm buổi học ${lessonDescription} ngày ${date}.`
          : `Đã thêm lịch học ${lessonDescription} vào ${days[fields.day - 1]} từ ${startDate} đến ${endDate}.`;
      }
      if (saveLessonsWithNotice(changeDescription)) {
        closeModal();
        render();
        showScheduleNotice('Đã lưu thay đổi lịch học và thông báo.');
      } else {
        lessons = previousLessons;
        exceptions = previousExceptions;
      }
    });
    render();
  
