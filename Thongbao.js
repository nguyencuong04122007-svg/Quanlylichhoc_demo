const adminModeKey = 'quanlylichhoc-demo-admin-mode';

function isAdminMode() {
  try {
    return localStorage.getItem(adminModeKey) === 'true';
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
    localStorage.setItem(adminModeKey, String(enableAdminMode));
  } catch (error) {
    console.error('Không thể đổi chế độ tài khoản:', error);
    window.alert('Không thể lưu chế độ tài khoản. Hãy bật lưu trữ phiên của trình duyệt rồi thử lại.');
    return;
  }
  updateAdminModeUI();
});

try {
  const activeUser = sessionStorage.getItem(authKey);
  if (!activeUser) {
    window.location.replace('index.html');
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
  window.location.replace('index.html');
}

document.getElementById('logoutButton').addEventListener('click', () => {
  try {
    sessionStorage.removeItem(authKey);
    localStorage.removeItem(adminModeKey);
  } catch (error) {
    console.error('Không thể kết thúc phiên đăng nhập:', error);
    window.alert('Không thể đăng xuất. Hãy thử tải lại trang.');
    return;
  }
  window.location.href = 'index.html';
});