import { TOKEN_KEY, USER_KEY, API_BASE_URL, RESERVATION_STATUS_MAP } from './js/config.js';
import { formatCurrency, formatDateTime, formatNumber, escapeHtml, userInitials, statusChip, tableStatusClass, orderStatusClass, paymentStatusClass, reservationStatusClass } from './js/utils.js';
import { api } from './js/api.js';
import { renderReservationsGrid } from './js/views/reservationsView.js';
import { renderOrdersGrid, generatePayOSQRUrl, getOrderTableInfo } from './js/views/ordersView.js';
import { renderTablesFloorGrid } from './js/views/tablesView.js';
import { renderProductsGrid } from './js/views/productsView.js';
import { renderUsersGrid } from './js/views/usersView.js';

const VIEW_META = {
  overview: {
    title: 'Dashboard',
    description: 'Theo dõi nhanh tình trạng hệ thống, doanh thu và số lượng bản ghi đang quản lý.'
  },
  users: {
    title: 'Người dùng',
    description: 'Quản lý tài khoản, vai trò, điểm tích lũy và trạng thái đăng nhập.'
  },
  categories: {
    title: 'Danh mục món',
    description: 'Tạo, sửa và xóa nhóm món ăn hiển thị trên menu.'
  },
  products: {
    title: 'Sản phẩm',
    description: 'Quản lý món ăn, giá bán, tồn kho, ảnh và liên kết danh mục.'
  },
  tables: {
    title: 'Bàn ăn',
    description: 'Theo dõi trạng thái bàn, nạp danh sách bàn hàng loạt và cập nhật nhanh trạng thái.'
  },
  reservations: {
    title: 'Đặt bàn',
    description: 'Theo dõi lịch đặt, xác nhận nhận bàn và hủy đặt bàn khi cần.'
  },
  orders: {
    title: 'Đơn hàng',
    description: 'Xem đơn chi tiết, đổi trạng thái, thanh toán và xóa đơn không hợp lệ.'
  },
  reviews: {
    title: 'Đánh giá',
    description: 'Duyệt phản hồi khách hàng và xóa đánh giá không phù hợp.'
  },
  stats: {
    title: 'Reports',
    description: 'Lọc theo ngày, tháng hoặc năm để xem tổng đơn và tổng doanh thu.'
  }
};

const NAV_ICONS = {
  overview: 'fa-gauge-high',
  users: 'fa-users',
  categories: 'fa-folder-open',
  products: 'fa-bowl-food',
  tables: 'fa-table',
  reservations: 'fa-calendar-check',
  orders: 'fa-receipt',
  reviews: 'fa-star',
  stats: 'fa-chart-line'
};

const ENTITY_CONFIGS = {
  users: {
    endpoint: '/api/users',
    searchKey: 'search',
    createLabel: 'Thêm người dùng',
    allowCreate: true,
    allowEdit: true,
    allowDelete: true,
    fields: [
      { name: 'fullName', label: 'Họ tên', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Số điện thoại', type: 'text', required: true },
      { name: 'username', label: 'Tên đăng nhập', type: 'text', required: true },
      { name: 'password', label: 'Mật khẩu', type: 'password', requiredOnCreate: true, helper: 'Bỏ trống khi chỉnh sửa người dùng hiện tại.' },
      { name: 'avatar', label: 'Avatar', type: 'image' },
      { name: 'points', label: 'Điểm tích lũy', type: 'number', min: 0 },
      { name: 'role', label: 'Vai trò', type: 'select', options: ['CUSTOMER', 'STAFF', 'KITCHEN', 'ADMIN'] },
      { name: 'status', label: 'Trạng thái', type: 'select', options: ['ACTIVE', 'BLOCKED'] }
    ],
    columns: [
      { label: 'Họ tên', render: row => row.fullName || '-' },
      { label: 'Tài khoản', render: row => row.username || '-' },
      { label: 'Liên hệ', render: row => [row.phone, row.email].filter(Boolean).join(' • ') || '-' },
      { label: 'Vai trò', render: row => statusChip(row.role, row.role) },
      { label: 'Trạng thái', render: row => statusChip(row.status, row.status) },
      { label: 'Điểm', render: row => formatNumber(row.points ?? 0) }
    ],
    payload: row => ({
      fullName: row.fullName || '',
      email: row.email || '',
      phone: row.phone || '',
      username: row.username || '',
      avatar: row.avatar || '',
      points: row.points ?? 0,
      role: row.role || 'CUSTOMER',
      status: row.status || 'ACTIVE'
    })
  },
  categories: {
    endpoint: '/api/categories',
    searchKey: 'search',
    createLabel: 'Thêm danh mục',
    allowCreate: true,
    allowEdit: true,
    allowDelete: true,
    fields: [
      { name: 'name', label: 'Tên danh mục', type: 'text', required: true },
      { name: 'description', label: 'Mô tả', type: 'textarea' },
      { name: 'image', label: 'Ảnh', type: 'image' }
    ],
    columns: [
      { label: 'Tên', render: row => row.name || '-' },
      { label: 'Mô tả', render: row => row.description || '-' },
      { label: 'Ảnh', render: row => row.image ? `<span class="badge-inline">Có ảnh</span>` : '<span class="muted">Chưa có</span>' },
      { label: 'Số món', render: row => formatNumber(row.productCount ?? 0) }
    ],
    payload: row => ({
      name: row.name || '',
      description: row.description || '',
      image: row.image || ''
    })
  },
  products: {
    endpoint: '/api/products',
    searchKey: 'search',
    createLabel: 'Thêm sản phẩm',
    allowCreate: true,
    allowEdit: true,
    allowDelete: true,
    fields: [
      { name: 'name', label: 'Tên món', type: 'text', required: true },
      { name: 'description', label: 'Mô tả', type: 'textarea' },
      { name: 'price', label: 'Giá bán', type: 'number', required: true, min: 0, step: '0.01' },
      { name: 'stock', label: 'Tồn kho', type: 'number', min: 0 },
      { name: 'isAvailable', label: 'Đang bán', type: 'checkbox' },
      { name: 'category_id', label: 'Danh mục', type: 'select', options: state => (state.data.categories || []).map(category => ({ value: category.id, label: `${category.name} (#${category.id})` })) },
      { name: 'image', label: 'Ảnh', type: 'image' }
    ],
    columns: [
      { label: 'Tên món', render: row => row.name || '-' },
      { label: 'Danh mục', render: row => categoryLabel(row.category_id) },
      { label: 'Giá', render: row => formatCurrency(row.price) },
      { label: 'Kho', render: row => formatNumber(row.stock ?? 0) },
      { label: 'Sẵn sàng', render: row => statusChip(row.isAvailable ? 'AVAILABLE' : 'BLOCKED', row.isAvailable ? 'Có' : 'Không') }
    ],
    payload: row => ({
      name: row.name || '',
      description: row.description || '',
      price: row.price ?? 0,
      stock: row.stock ?? 0,
      isAvailable: row.isAvailable !== false,
      category_id: row.category_id || state.data.categories?.[0]?.id || '',
      image: row.image || ''
    })
  },
  tables: {
    endpoint: '/api/tables',
    searchKey: 'search',
    createLabel: 'Thêm bàn ăn',
    allowCreate: true,
    allowEdit: true,
    allowDelete: true,
    fields: [
      { name: 'tableNumber', label: 'Số bàn', type: 'number', required: true, min: 1 },
      { name: 'capacity', label: 'Sức chứa (người)', type: 'number', required: true, min: 1, value: 4 },
      { name: 'qrCode', label: 'Mã QR Code Bàn', type: 'text', helper: 'Ví dụ: T1-001 (Bỏ trống tự tạo)' },
      { name: 'status', label: 'Trạng thái', type: 'select', options: ['AVAILABLE', 'OCCUPIED', 'BOOKED', 'CLEANING'] }
    ],
    columns: [
      { label: 'Số bàn', render: row => `#${row.tableNumber ?? row.id}` },
      { label: 'QR Code', render: row => row.qrCode || '-' },
      { label: 'Sức chứa', render: row => formatNumber(row.capacity ?? 0) },
      { label: 'Trạng thái', render: row => statusChip(tableStatusClass(row.calculatedStatus || row.status), row.calculatedStatus || row.status) },
      { label: 'Khách', render: row => row.guestCount ? formatNumber(row.guestCount) : '-' },
      { label: 'Thời gian dùng', render: row => row.timeUsed || '-' }
    ]
  },
  reservations: {
    endpoint: '/api/reservations',
    searchKey: 'search',
    createLabel: 'Thêm đặt bàn',
    allowCreate: true,
    allowEdit: false,
    allowDelete: false,
    customCreateMode: 'reservation',
    columns: [
      { label: 'Khách', render: row => row.guestName || '-' },
      { label: 'SĐT', render: row => row.guestPhone || '-' },
      { label: 'Thời gian', render: row => formatDateTime(row.reservationTime) },
      { label: 'Số khách', render: row => formatNumber(row.numberOfGuests ?? 0) },
      { label: 'Bàn', render: row => row.table?.tableNumber ? `#${row.table.tableNumber}` : row.table_id ? `#${row.table_id}` : '-' },
      { label: 'Trạng thái', render: row => RESERVATION_STATUS_MAP[String(row.status || 'PENDING').toUpperCase()] || statusChip(reservationStatusClass(row.status), row.status) }
    ]
  },
  orders: {
    endpoint: '/api/orders',
    searchKey: 'search',
    createLabel: 'Tạo đơn hàng',
    allowCreate: true,
    allowEdit: true,
    allowDelete: true,
    customCreateMode: 'order',
    columns: [
      { label: 'Mã đơn', render: row => `#${row.id}` },
      { label: 'Khách', render: row => row.User?.fullName || row.user_id ? `${row.User?.fullName || 'Khách'} (#${row.user_id})` : 'Khách vãng lai' },
      { 
        label: 'Bàn', 
        render: row => {
          const tInfo = getOrderTableInfo(row, state.data.tables);
          return `<span class="badge-inline" style="background:#e0f2fe; color:#004ac6; font-weight:700"><i class="fa-solid ${tInfo.isTakeaway ? 'fa-bag-shopping' : 'fa-chair'}"></i> ${tInfo.label}</span>`;
        } 
      },
      { label: 'Tổng tiền', render: row => formatCurrency(row.finalPrice ?? row.totalPrice) },
      { label: 'Thanh toán', render: row => statusChip(paymentStatusClass(row.paymentStatus), row.paymentStatus) },
      { label: 'Trạng thái', render: row => statusChip(orderStatusClass(row.status), row.status) }
    ]
  },
  reviews: {
    endpoint: '/api/reviews?page=1&limit=200',
    searchKey: 'search',
    createLabel: 'Làm mới danh sách',
    allowCreate: false,
    allowEdit: false,
    allowDelete: true,
    columns: [
      { label: 'Người đánh giá', render: row => row.user?.fullName || row.phone || '-' },
      { label: 'Món', render: row => row.dish_name || '-' },
      { label: 'Nội dung', render: row => row.content || '-' },
      { label: 'Số sao', render: row => '★'.repeat(row.rating || 0) },
      { label: 'Ngày tạo', render: row => formatDateTime(row.created_at || row.createdAt) }
    ]
  }
};

const app = document.getElementById('app');
const state = {
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: readJson(USER_KEY),
  activeView: 'overview',
  loading: false,
  modal: null,
  toast: [],
  data: {
    users: [],
    categories: [],
    products: [],
    tables: [],
    reservations: [],
    orders: [],
    reviews: [],
    stats: null
  },
  filters: {
    users: '',
    categories: '',
    products: '',
    tables: '',
    reservations: '',
    orders: '',
    reviews: ''
  },
  viewModes: {
    products: 'grid',
    categories: 'grid',
    tables: 'floor',
    reservations: 'cards',
    orders: 'cards',
    users: 'grid',
    reviews: 'cards'
  },
  activeTabs: {
    products: 'ALL',
    tables: 'ALL',
    reservations: 'ALL',
    orders: 'ALL',
    users: 'ALL',
    reviews: 'ALL'
  },
  statsQuery: {
    type: 'day',
    date: ''
  }
};

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function categoryLabel(categoryId) {
  const category = (state.data.categories || []).find(item => String(item.id) === String(categoryId));
  return category ? `${category.name} (#${category.id})` : categoryId ? `#${categoryId}` : '-';
}

function toast(type, title, text) {
  state.toast.push({ id: crypto.randomUUID(), type, title, text });
  render();
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    state.toast.shift();
    render();
  }, 3200);
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const result = await api('/api/upload/image', { method: 'POST', body: formData });
  return result.imageUrl;
}

function getRoleRoute(role) {
  const normalized = String(role || '').toUpperCase();
  if (normalized === 'ADMIN') return 'admin';
  if (normalized === 'STAFF') return 'staff';
  if (normalized === 'KITCHEN') return 'kitchen';
  return null;
}

function redirectByRole(role) {
  const route = getRoleRoute(role);
  const currentPath = window.location.pathname.split('/').pop()?.toLowerCase() || '';

  if (route === 'staff' && !currentPath.endsWith('staff.html')) {
    window.location.assign('./staff.html');
    return true;
  }

  if (route === 'kitchen' && !currentPath.endsWith('kitchen.html')) {
    window.location.assign('./kitchen.html');
    return true;
  }

  if (route === 'admin' && currentPath && !currentPath.endsWith('index.html')) {
    window.location.assign('./index.html');
    return true;
  }

  return false;
}

async function boot() {
  if (!state.token) {
    render();
    return;
  }

  const role = String(state.user?.role || '').toUpperCase();
  if (role === 'CUSTOMER') {
    toast('danger', 'Tài khoản không đủ quyền', 'Vui lòng đăng nhập bằng tài khoản quản trị để sử dụng trang quản trị.');
    clearAuth();
    render();
    return;
  }

  if (redirectByRole(role)) {
    return;
  }

  state.loading = true;
  render();

  try {
    await loadAllData();
    if (!['ADMIN', 'STAFF'].includes(role)) {
      toast('danger', 'Tài khoản không đủ quyền', 'Vui lòng đăng nhập bằng tài khoản ADMIN hoặc STAFF để sử dụng trang quản trị.');
      clearAuth();
      render();
      return;
    }
    render();
  } catch (error) {
    handleAuthError(error);
  } finally {
    state.loading = false;
    render();
  }
}

async function loadAllData() {
  const role = String(state.user?.role || '').toUpperCase();
  const statsQuery = new URLSearchParams();
  statsQuery.set('type', state.statsQuery.type);
  if (state.statsQuery.date) {
    statsQuery.set('date', state.statsQuery.date);
  }

  const requests = {
    categories: api('/api/categories'),
    products: api('/api/products'),
    tables: api('/api/tables'),
    reservations: api('/api/reservations'),
    orders: api('/api/orders'),
    reviews: api('/api/reviews?page=1&limit=200')
  };

  if (role === 'ADMIN') {
    requests.users = api('/api/users');
    requests.stats = api(`/api/stats?${statsQuery.toString()}`);
  }

  const entries = await Promise.all(
    Object.entries(requests).map(async ([key, promise]) => {
      try {
        return [key, await promise];
      } catch (error) {
        return [key, { __error: error.message }];
      }
    })
  );

  for (const [key, value] of entries) {
    state.data[key] = value;
  }
  if (Array.isArray(state.data.tables)) {
    window.__tablesList = state.data.tables;
  }
  if (Array.isArray(state.data.orders)) {
    window.__ordersList = state.data.orders;
  }
  if (Array.isArray(state.data.reservations)) {
    window.__reservationsList = state.data.reservations;
  }
}

function clearAuth() {
  state.token = '';
  state.user = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function persistAuth(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function handleAuthError(error) {
  if (error?.status === 401 || error?.status === 403) {
    clearAuth();
    toast('danger', 'Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại bằng tài khoản quản trị.');
    render();
    return;
  }
  toast('danger', 'Lỗi tải dữ liệu', error.message || 'Không thể tải dữ liệu quản trị.');
}

function render() {
  if (!state.token) {
    app.innerHTML = renderLogin();
    bindLogin();
    renderToasts();
    return;
  }

  const role = String(state.user?.role || '').toUpperCase();
  if (!['ADMIN', 'STAFF'].includes(role)) {
    app.innerHTML = renderNonAdmin();
    renderToasts();
    return;
  }

  const sidebarSections = role === 'ADMIN'
    ? [
        ['Tổng quan', ['overview']],
        ['Quản lý thực đơn', ['products', 'categories']],
        ['Phục vụ & đặt bàn', ['tables', 'reservations', 'orders']],
        ['Khách hàng', ['users', 'reviews']],
        ['Báo cáo', ['stats']]
      ]
    : [
        ['Tổng quan', ['overview']],
        ['Quản lý thực đơn', ['products', 'categories']],
        ['Phục vụ & đặt bàn', ['tables', 'reservations', 'orders']],
        ['Khách hàng', ['reviews']]
      ];

  app.innerHTML = `
    <div class="admin-new-shell">
      <aside class="admin-sidebar-shell">
        <div class="admin-brand-box">
          <div class="admin-brand-badge">
            <div class="admin-brand-logo-wrap">
              <img src="/uploads/logo.png" alt="FutureSushi Logo" class="admin-brand-logo" onerror="this.onerror=null; this.src='uploads/logo.png';" />
            </div>
            <div>
              <h1 class="admin-brand-title">FutureSushi</h1>
              <p class="admin-brand-subtitle">Hệ Thống Quản Lý</p>
            </div>
          </div>
          <div class="admin-system-status">
            <span class="status-pulse-dot"></span>
            <span>Hệ thống trực tuyến</span>
          </div>
        </div>

        <nav class="admin-sidebar-nav" aria-label="Navigation">
          ${sidebarSections.map(([title, views]) => renderSidebarGroup(title, views)).join('')}
        </nav>

        <div class="admin-sidebar-profile">
          <div class="admin-profile-avatar">${escapeHtml(userInitials(state.user))}</div>
          <div class="admin-profile-copy">
            <div class="admin-profile-name">${escapeHtml(state.user?.fullName || state.user?.username || 'Admin')}</div>
            <div class="admin-profile-role">${escapeHtml(state.user?.role || 'ADMIN')}</div>
          </div>
          <button class="admin-logout-button" data-action="logout" title="Đăng xuất khỏi hệ thống">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </aside>

      <main class="admin-content-shell">
        <header class="admin-topbar-shell">
          <div class="admin-topbar-left">
            <div class="admin-breadcrumb">
              <span>Trang chủ</span>
              <i class="fa-solid fa-chevron-right"></i>
              <strong class="current">${escapeHtml(VIEW_META[state.activeView].title)}</strong>
            </div>
          </div>

          <div class="admin-search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Tìm kiếm nhanh hệ thống..." value="${escapeHtml(state.filters[state.activeView] || '')}" data-action="search-input" data-view="${state.activeView}" />
          </div>

          <div class="admin-topbar-right">
            <div class="admin-live-clock">
              <i class="fa-regular fa-clock"></i>
              <span>${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="admin-noti-btn" title="Thông báo hệ thống">
              <i class="fa-solid fa-bell"></i>
              <span class="noti-badge"></span>
            </div>
            <div class="admin-topbar-divider"></div>
            <button class="admin-header-cta" data-action="switch-view" data-view="orders">
              <i class="fa-solid fa-bolt"></i>
              POS Gọi Món
            </button>
          </div>
        </header>

        <section class="admin-main-content">
          ${renderActiveView()}
        </section>
      </main>
    </div>
    ${renderModal()}
    <div class="toast-stack">${state.toast.map(renderToast).join('')}</div>
  `;

  bindGlobalEvents();
}

function renderNonAdmin() {
  return `
    <div class="auth-screen">
      <div class="auth-bg-ambient">
        <div class="auth-blob auth-blob-1"></div>
        <div class="auth-blob auth-blob-2"></div>
      </div>
      <section class="auth-card auth-card-warning" style="text-align:center">
        <div class="auth-warning-icon">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h1 class="auth-title">Tài khoản không đủ quyền</h1>
        <p class="auth-copy">Trang này chỉ mở cho tài khoản có vai trò <strong>ADMIN</strong> hoặc <strong>STAFF</strong>. Vui lòng đăng nhập lại bằng tài khoản phù hợp.</p>
        <button class="btn btn-primary btn-login-submit" data-action="logout" style="margin-top:1.2rem;">
          <i class="fa-solid fa-right-from-bracket"></i> Đăng xuất tài khoản
        </button>
      </section>
    </div>
  `;
}

function renderLogin() {
  return `
    <div class="auth-screen">
      <div class="auth-bg-ambient">
        <div class="auth-blob auth-blob-1"></div>
        <div class="auth-blob auth-blob-2"></div>
      </div>
      
      <section class="auth-card">
        <div class="auth-brand-logo">
          <img src="/uploads/logo.png" alt="FutureSushi Logo" onerror="this.onerror=null; this.src='uploads/logo.png';" />
        </div>
        
        <div class="auth-header">
          <h1 class="auth-title">Đăng nhập quản trị</h1>
          <p class="auth-copy">Vui lòng nhập tài khoản để truy cập hệ thống FutureSushi</p>
        </div>

        <form class="auth-form" data-form="login">
          <div class="field">
            <label for="account">Tên đăng nhập hoặc Số điện thoại</label>
            <div class="input-wrapper">
              <input id="account" name="account" type="text" autocomplete="username" required placeholder="Tên đăng nhập / SĐT..." />
              <i class="fa-solid fa-user input-icon"></i>
            </div>
          </div>

          <div class="field">
            <label for="password">Mật khẩu</label>
            <div class="input-wrapper">
              <input id="password" name="password" type="password" autocomplete="current-password" required placeholder="Mật khẩu..." />
              <i class="fa-solid fa-lock input-icon"></i>
              <button type="button" class="btn-toggle-password" id="toggle-pw" title="Ẩn/Hiện mật khẩu">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>

          <div class="auth-options">
            <label class="remember-me">
              <input type="checkbox" id="remember" checked />
              <span>Ghi nhớ phiên đăng nhập</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary btn-login-submit">
            <span>Đăng nhập</span>
            <i class="fa-solid fa-arrow-right"></i>
          </button>

          <div class="auth-footer-security">
            <i class="fa-solid fa-shield-halved"></i> System Secured • FutureSushi Management Suite
          </div>
        </form>
      </section>
    </div>
  `;
}



function renderSidebarGroup(title, views) {
  return `
    <section class="admin-sidebar-section">
      <div class="admin-sidebar-section-title">${escapeHtml(title)}</div>
      ${views.map(view => navItem(view)).join('')}
    </section>
  `;
}

function navItem(view) {
  const active = state.activeView === view ? 'active' : '';
  const labelMap = {
    overview: 'Trang tổng quan',
    users: 'Người dùng',
    categories: 'Danh mục món',
    products: 'Quản lý món ăn',
    tables: 'Quản lý bàn',
    reservations: 'Đặt bàn trước',
    orders: 'Quản lý đơn hàng',
    reviews: 'Đánh giá khách',
    stats: 'Báo cáo doanh thu'
  };

  let countBadge = '';
  if (view === 'orders') {
    const pending = (state.data.orders || []).filter(o => String(o.status).toUpperCase() === 'PENDING').length;
    if (pending > 0) countBadge = `<span class="nav-badge badge-rose">${pending} mới</span>`;
  } else if (view === 'reservations') {
    const pending = (state.data.reservations || []).filter(r => String(r.status).toUpperCase() === 'PENDING').length;
    if (pending > 0) countBadge = `<span class="nav-badge badge-amber">${pending} chờ</span>`;
  } else if (view === 'tables') {
    const occupied = (state.data.tables || []).filter(t => String(t.calculatedStatus || t.status).toUpperCase() === 'OCCUPIED').length;
    if (occupied > 0) countBadge = `<span class="nav-badge badge-blue">${occupied} có khách</span>`;
  }

  return `
    <button class="nav-item ${active}" data-action="switch-view" data-view="${view}">
      <span class="nav-item-main">
        <span class="nav-icon-box"><i class="fa-solid ${NAV_ICONS[view]}"></i></span>
        <span class="nav-label">${labelMap[view]}</span>
      </span>
      ${countBadge}
    </button>
  `;
}

function renderActiveView() {
  if (state.loading) {
    return `
      <section class="panel loading-state">
        <div class="spinner"></div>
        <p>Đang tải dữ liệu quản trị...</p>
      </section>
    `;
  }

  if (state.activeView === 'overview') {
    return renderOverview();
  }

  if (state.activeView === 'stats') {
    return renderStats();
  }

  return renderEntityView(state.activeView);
}

function renderOverview() {
  const stats = state.data.stats || {};
  const recentOrders = Array.isArray(state.data.orders) ? state.data.orders.slice(0, 5) : [];
  const totalOrdersCount = (state.data.orders || []).filter(o => String(o.status).toUpperCase() !== 'CANCELLED').length;
  const cancelledOrdersCount = (state.data.orders || []).filter(o => String(o.status).toUpperCase() === 'CANCELLED').length;
  const cancellationRate = totalOrdersCount > 0 ? ((cancelledOrdersCount / totalOrdersCount) * 100).toFixed(1) : '0.0';

  return `
    <!-- Smart Real-Time Alert Widget Strip -->
    <section class="smart-alerts-strip" style="display:grid; gap:0.75rem; margin-bottom:1.25rem">
      <div style="background:linear-gradient(90deg, #fff7d6 0%, #ffedd5 100%); border:1px solid #fed7aa; border-radius:16px; padding:0.8rem 1.1rem; display:flex; align-items:center; justify-content:space-between">
        <div style="display:flex; align-items:center; gap:0.75rem">
          <span style="background:#f97316; color:white; width:34px; height:34px; border-radius:10px; display:grid; place-items:center; font-size:1rem"><i class="fa-solid fa-triangle-exclamation"></i></span>
          <div>
            <strong style="color:#9a3412; font-size:0.92rem">Cảnh báo tồn kho: Món "Bò Bít Tết Sốt Tiêu" sắp hết (còn 2 suất trong bếp)</strong>
            <div style="font-size:0.8rem; color:#c2410c">Vui lòng cập nhật nguyên liệu hoặc chuyển trạng thái tạm ngưng bán</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-small" data-action="switch-view" data-view="products"><i class="fa-solid fa-boxes-stacked"></i> Kiểm tra kho</button>
      </div>

      <div style="background:linear-gradient(90deg, #f0fdf4 0%, #dcfce7 100%); border:1px solid #bbf7d0; border-radius:16px; padding:0.8rem 1.1rem; display:flex; align-items:center; justify-content:space-between">
        <div style="display:flex; align-items:center; gap:0.75rem">
          <span style="background:#16a34a; color:white; width:34px; height:34px; border-radius:10px; display:grid; place-items:center; font-size:1rem"><i class="fa-solid fa-clock-rotate-left"></i></span>
          <div>
            <strong style="color:#166534; font-size:0.92rem">Cảnh báo bàn: Bàn #4 đang ngưng dọn dẹp > 20 phút</strong>
            <div style="font-size:0.8rem; color:#15803d">Nhắc nhở nhân viên dọn dẹp để sẵn sàng đón lượt khách mới</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-small" data-action="switch-view" data-view="tables"><i class="fa-solid fa-chair"></i> Sơ đồ bàn</button>
      </div>
    </section>

    <!-- Top Action Bar & Date Range Selector -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem; background:#ffffff; padding:0.85rem 1.2rem; border-radius:18px; border:1px solid rgba(115,118,134,0.16)">
      <div style="display:flex; align-items:center; gap:0.6rem">
        <strong style="font-size:0.95rem; color:#111c2d"><i class="fa-solid fa-filter text-accent"></i> Thời gian báo cáo:</strong>
        <select class="inline-input" style="width:auto; font-weight:700">
          <option selected>Hôm nay (2-8-2026)</option>
          <option>7 ngày gần nhất</option>
          <option>30 ngày qua</option>
          <option>Quý 3 / 2026</option>
          <option>Tùy chọn khoảng ngày (Date Range)...</option>
        </select>
      </div>
      <div style="display:flex; gap:0.5rem">
        <button class="btn btn-secondary btn-small" onclick="alert('Đang xuất báo cáo Excel tổng quan...')"><i class="fa-solid fa-file-excel text-success"></i> Xuất Excel</button>
        <button class="btn btn-secondary btn-small" onclick="alert('Đang tạo báo cáo PDF tổng quan...')"><i class="fa-solid fa-file-pdf text-danger"></i> Xuất PDF</button>
      </div>
    </div>

    <!-- Enhanced KPI Summary Cards with Comparison Trends -->
    <section class="dashboard-kpis">
      <article class="dashboard-kpi-card">
        <div class="dashboard-kpi-header">
          <span class="dashboard-kpi-icon"><i class="fa-solid fa-money-bill-wave"></i></span>
          <span class="dashboard-kpi-trend up" title="So với tháng trước">+15.4%</span>
        </div>
        <div class="dashboard-kpi-label">Doanh thu tổng quan</div>
        <div class="dashboard-kpi-value">${formatCurrency(stats?.totalRevenue || 0)}</div>
        <div style="font-size:0.75rem; color:#5f748d; margin-top:0.4rem">▲ +${formatCurrency(12500000)} so với cùng kỳ tháng trước</div>
      </article>

      <article class="dashboard-kpi-card">
        <div class="dashboard-kpi-header">
          <span class="dashboard-kpi-icon"><i class="fa-solid fa-cart-shopping"></i></span>
          <span class="dashboard-kpi-trend up" title="So với tháng trước">+8.2%</span>
        </div>
        <div class="dashboard-kpi-label">Tổng đơn hoàn thành</div>
        <div class="dashboard-kpi-value">${formatNumber(totalOrdersCount)} đơn</div>
        <div style="font-size:0.75rem; color:#5f748d; margin-top:0.4rem">Tỷ lệ hủy đơn: <strong style="color:#b91c1c">${cancellationRate}%</strong></div>
      </article>

      <article class="dashboard-kpi-card">
        <div class="dashboard-kpi-header">
          <span class="dashboard-kpi-icon"><i class="fa-solid fa-chair"></i></span>
          <span class="dashboard-kpi-trend neutral">Live 85%</span>
        </div>
        <div class="dashboard-kpi-label">Bàn đang có khách</div>
        <div class="dashboard-kpi-value">${formatNumber((state.data.tables || []).filter(t => (t.calculatedStatus || t.status) === 'OCCUPIED').length)} / ${formatNumber(state.data.tables?.length || 0)} bàn</div>
        <div style="font-size:0.75rem; color:#5f748d; margin-top:0.4rem">Công suất phục vụ tối ưu</div>
      </article>

      <article class="dashboard-kpi-card">
        <div class="dashboard-kpi-header">
          <span class="dashboard-kpi-icon"><i class="fa-solid fa-people-group"></i></span>
          <span class="dashboard-kpi-trend up">+12%</span>
        </div>
        <div class="dashboard-kpi-label">Khách hàng thành viên</div>
        <div class="dashboard-kpi-value">${formatNumber(state.data.users?.length || 0)} người</div>
        <div style="font-size:0.75rem; color:#5f748d; margin-top:0.4rem">Tỷ lệ khách quay lại (Retention): <strong>68%</strong></div>
      </article>
    </section>

    <!-- Peak Hours & Revenue Distribution Grid -->
    <section class="dashboard-grid-two">
      <!-- Revenue Trend Chart -->
      <article class="dashboard-panel chart-panel">
        <div class="dashboard-panel-header">
          <div>
            <h3 class="dashboard-panel-title">Phân tích doanh thu & Khung giờ cao điểm</h3>
            <p class="dashboard-panel-copy">Biểu đồ giờ cao điểm (Peak Hours 11h-13h & 18h-21h)</p>
          </div>
          <select class="dashboard-filter-select">
            <option>7 ngày qua</option>
            <option>30 ngày qua</option>
            <option>Năm nay</option>
          </select>
        </div>
        <div class="dashboard-chart-wrap">
          <div class="dashboard-chart-grid"></div>
          <div class="dashboard-chart-line"></div>
          <div class="dashboard-chart-dot"></div>
        </div>
        <div class="dashboard-chart-days">
          <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
        </div>
      </article>

      <!-- Peak Hours Heatmap Distribution -->
      <article class="dashboard-panel donut-panel">
        <div class="dashboard-panel-header compact">
          <div>
            <h3 class="dashboard-panel-title">Món ăn bán chạy theo danh mục</h3>
            <p class="dashboard-panel-copy">Tỷ lệ đóng góp doanh thu</p>
          </div>
        </div>
        <div class="dashboard-donut-wrap">
          <div class="dashboard-donut-ring">
            <div class="dashboard-donut-center">
              <div class="dashboard-donut-number">${formatNumber(state.data.products?.length || 0)}</div>
              <div class="dashboard-donut-note">Món bán ra</div>
            </div>
          </div>
        </div>
        <div class="dashboard-donut-legend">
          <div class="dashboard-donut-item"><span class="dot primary"></span><span>Món chính</span><strong>540</strong></div>
          <div class="dashboard-donut-item"><span class="dot secondary"></span><span>Đồ uống</span><strong>300</strong></div>
          <div class="dashboard-donut-item"><span class="dot amber"></span><span>Tráng miệng</span><strong>360</strong></div>
        </div>
      </article>
    </section>

    <!-- Recent Orders & Store QR Code Grid -->
    <section class="dashboard-grid-bottom">
      <article class="dashboard-panel table-panel">
        <div class="dashboard-panel-header">
          <div>
            <h3 class="dashboard-panel-title">Đơn hàng gần đây</h3>
            <p class="dashboard-panel-copy">Cập nhật realtime từ POS & Mobile QR</p>
          </div>
          <button class="dashboard-link-btn" data-action="switch-view" data-view="orders">Xem tất cả</button>
        </div>
        <div class="dashboard-table-wrap">
          <table class="dashboard-orders-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Vị trí / Bàn</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th class="right">Tổng tiền</th>
              </tr>
            </thead>
            <tbody>
              ${recentOrders.map(order => {
                const tInfo = getOrderTableInfo(order, state.data.tables);
                return `
                <tr>
                  <td>#${escapeHtml(order.id)}</td>
                  <td>${escapeHtml(order.User?.fullName || order.user_id ? (order.User?.fullName || `#${order.user_id}`) : 'Khách vãng lai')}</td>
                  <td><span class="badge-inline" style="background:#e0f2fe; color:#004ac6; font-weight:700"><i class="fa-solid ${tInfo.isTakeaway ? 'fa-bag-shopping' : 'fa-chair'}"></i> ${tInfo.label}</span></td>
                  <td>${escapeHtml(formatDateTime(order.createdAt || order.created_at))}</td>
                  <td>${statusChip(orderStatusClass(order.status), order.status)}</td>
                  <td class="right">${formatCurrency(order.finalPrice ?? order.totalPrice)}</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </article>

      <article class="dashboard-panel qr-panel">
        <div class="dashboard-panel-header compact">
          <div>
            <h3 class="dashboard-panel-title">Mã QR Gọi Món Tại Bàn</h3>
          </div>
        </div>
        <div class="dashboard-qr-box">
          <div class="dashboard-qr-code"><i class="fa-solid fa-qrcode"></i></div>
        </div>
        <div class="dashboard-qr-copy">AppDatMon QR Ordering</div>
        <div class="dashboard-qr-helper">Quét để gọi món và thanh toán ngay tại bàn</div>
        <div class="dashboard-qr-actions">
          <button class="btn btn-primary" onclick="alert('Đang tải mã QR tổng quan...')">Tải xuống</button>
          <button class="btn btn-secondary" onclick="alert('Đã sao chép đường dẫn QR!')">Chia sẻ</button>
        </div>
        <div class="dashboard-qr-status">
          <span>Trạng thái QR Menu</span>
          <span class="dashboard-qr-status-pill">🟢 Online Live</span>
        </div>
      </article>
    </section>

  `;
}

function renderStats() {
  const stats = state.data.stats || {};
  const products = state.data.products || [];
  const topProducts = products.slice(0, 5);

  return `
    <section class="entity-page-header">
      <div>
        <h3 class="entity-page-title">Báo cáo & Thống kê</h3>
        <p class="entity-page-copy">Lọc theo ngày, tháng hoặc năm để xem tổng đơn hàng, doanh thu và các món ăn bán chạy nhất.</p>
      </div>
      <div class="entity-page-actions">
        <button class="btn btn-secondary" data-action="stats-reset"><i class="fa-solid fa-rotate-right" style="margin-right:0.4rem"></i>Đặt lại bộ lọc</button>
      </div>
    </section>

    <section class="stats-shell" style="display:grid; gap:1.25rem">
      <article class="dashboard-panel">
        <form class="stats-filters" data-form="stats-filter" style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap">
          <div class="field" style="min-width: 160px; margin:0">
            <label for="statsType">Kiểu thống kê</label>
            <select id="statsType" name="type">
              <option value="day" ${state.statsQuery.type === 'day' ? 'selected' : ''}>Theo ngày</option>
              <option value="month" ${state.statsQuery.type === 'month' ? 'selected' : ''}>Theo tháng</option>
              <option value="year" ${state.statsQuery.type === 'year' ? 'selected' : ''}>Theo năm</option>
            </select>
          </div>
          <div class="field" style="min-width: 220px; margin:0">
            <label for="statsDate">Ngày tham chiếu</label>
            <input id="statsDate" name="date" type="date" value="${escapeHtml(state.statsQuery.date)}" />
          </div>
          <div class="view-actions" style="align-self:end">
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-filter" style="margin-right:0.4rem"></i>Áp dụng bộ lọc</button>
          </div>
        </form>
      </article>

      <div class="kpi-summary-strip">
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon blue"><i class="fa-solid fa-chart-line"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Loại báo cáo</span>
            <span class="kpi-mini-value" style="text-transform:capitalize">${escapeHtml(stats.type || state.statsQuery.type)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon green"><i class="fa-solid fa-money-bill-trend-up"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Tổng doanh thu</span>
            <span class="kpi-mini-value">${formatCurrency(stats.totalRevenue || 0)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon amber"><i class="fa-solid fa-box-archive"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Tổng đơn hoàn thành</span>
            <span class="kpi-mini-value">${formatNumber(stats.totalOrders || 0)} đơn</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon purple"><i class="fa-solid fa-calculator"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">TB / Đơn hàng</span>
            <span class="kpi-mini-value">${formatCurrency(stats.totalOrders ? (stats.totalRevenue / stats.totalOrders) : 0)}</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid-two">
        <article class="dashboard-panel">
          <div class="dashboard-panel-header">
            <div>
              <h3 class="dashboard-panel-title">Chi tiết báo cáo doanh thu</h3>
              <p class="dashboard-panel-copy">Thời gian: ${escapeHtml(formatDateTime(stats.startDate || ''))} — ${escapeHtml(formatDateTime(stats.endDate || ''))}</p>
            </div>
          </div>
          <div class="info-list">
            <div class="info-row">
              <strong>Số đơn hàng hợp lệ</strong>
              <span class="badge-inline" style="background:#e7eeff; color:#004ac6">${formatNumber(stats.totalOrders || 0)} đơn</span>
            </div>
            <div class="info-row">
              <strong>Tổng doanh thu ghi nhận</strong>
              <strong style="color:#2faa66; font-size:1.1rem">${formatCurrency(stats.totalRevenue || 0)}</strong>
            </div>
            <div class="info-row">
              <strong>Mốc thời gian bắt đầu</strong>
              <span>${escapeHtml(formatDateTime(stats.startDate || ''))}</span>
            </div>
            <div class="info-row">
              <strong>Mốc thời gian kết thúc</strong>
              <span>${escapeHtml(formatDateTime(stats.endDate || ''))}</span>
            </div>
          </div>
        </article>

        <article class="dashboard-panel">
          <div class="dashboard-panel-header">
            <div>
              <h3 class="dashboard-panel-title">Món ăn nổi bật</h3>
              <p class="dashboard-panel-copy">Top thực đơn bán chạy trong hệ thống</p>
            </div>
          </div>
          <div class="top-products-list">
            ${topProducts.map((p, idx) => `
              <div class="top-product-item">
                <span class="top-product-rank">#${idx + 1}</span>
                <span class="top-product-name">${escapeHtml(p.name)}</span>
                <span class="top-product-val">${formatCurrency(p.price)}</span>
              </div>
            `).join('')}
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderEntityView(view) {
  const config = ENTITY_CONFIGS[view];
  const rawRecords = state.data[view];
  const records = getFilteredRecords(view, rawRecords);
  const mode = state.viewModes[view] || 'grid';

  return `
    <section class="entity-page-header">
      <div>
        <h3 class="entity-page-title">${escapeHtml(VIEW_META[view].title)}</h3>
        <p class="entity-page-copy">${escapeHtml(VIEW_META[view].description)}</p>
      </div>
      <div class="entity-page-actions">
        ${config.allowCreate ? `<button class="btn btn-primary" data-action="create-record" data-view="${view}"><i class="fa-solid fa-plus" style="margin-right:0.4rem"></i>${escapeHtml(config.createLabel)}</button>` : ''}
      </div>
    </section>

    ${renderViewKpiSummary(view, rawRecords)}

    <section class="entity-toolbar-redesigned">
      ${renderViewFilterTabs(view, rawRecords)}
      
      <div style="display:flex; align-items:center; gap:0.8rem; margin-left:auto">
        <div class="admin-search-box" style="min-width:240px">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="search" placeholder="Tìm kiếm nhanh..." value="${escapeHtml(state.filters[view] || '')}" data-action="search-input" data-view="${view}" />
        </div>
        <div class="view-mode-toggle">
          <button class="view-mode-btn ${mode === 'grid' || mode === 'cards' || mode === 'floor' ? 'active' : ''}" data-action="toggle-view-mode" data-view="${view}" data-mode="grid" title="Dạng Thẻ / Sơ đồ">
            <i class="fa-solid fa-border-all"></i>
          </button>
          <button class="view-mode-btn ${mode === 'table' ? 'active' : ''}" data-action="toggle-view-mode" data-view="${view}" data-mode="table" title="Dạng Bảng">
            <i class="fa-solid fa-list"></i>
          </button>
        </div>
      </div>
    </section>

    <section class="entity-content-body">
      ${renderViewContent(view, records, mode)}
    </section>
  `;
}

function renderViewKpiSummary(view, rawData) {
  const list = Array.isArray(rawData) ? rawData : (rawData?.reviews || []);
  if (!list) return '';

  if (view === 'products') {
    const total = list.length;
    const available = list.filter(p => p.isAvailable).length;
    const outOfStock = list.filter(p => (p.stock ?? 0) <= 0).length;
    const avgPrice = total > 0 ? Math.round(list.reduce((acc, p) => acc + Number(p.price || 0), 0) / total) : 0;

    return `
      <div class="kpi-summary-strip">
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon blue"><i class="fa-solid fa-bowl-food"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Tổng món ăn</span>
            <span class="kpi-mini-value">${formatNumber(total)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon green"><i class="fa-solid fa-circle-check"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Đang kinh doanh</span>
            <span class="kpi-mini-value">${formatNumber(available)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon rose"><i class="fa-solid fa-box-open"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Hết tồn kho</span>
            <span class="kpi-mini-value">${formatNumber(outOfStock)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon amber"><i class="fa-solid fa-tag"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Giá trung bình</span>
            <span class="kpi-mini-value">${formatCurrency(avgPrice)}</span>
          </div>
        </div>
      </div>
    `;
  }

  if (view === 'categories') {
    const total = list.length;
    const totalDishes = (state.data.products || []).length;
    return `
      <div class="kpi-summary-strip">
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon blue"><i class="fa-solid fa-folder-open"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Tổng danh mục</span>
            <span class="kpi-mini-value">${formatNumber(total)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon green"><i class="fa-solid fa-utensils"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Tổng số món liên kết</span>
            <span class="kpi-mini-value">${formatNumber(totalDishes)}</span>
          </div>
        </div>
      </div>
    `;
  }

  if (view === 'tables') {
    const total = list.length;
    const available = list.filter(t => String(t.calculatedStatus || t.status).toUpperCase() === 'AVAILABLE').length;
    const occupied = list.filter(t => String(t.calculatedStatus || t.status).toUpperCase() === 'OCCUPIED').length;
    const booked = list.filter(t => String(t.calculatedStatus || t.status).toUpperCase() === 'BOOKED').length;

    return `
      <div class="kpi-summary-strip">
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon blue"><i class="fa-solid fa-table"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Tổng số bàn</span>
            <span class="kpi-mini-value">${formatNumber(total)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon green"><i class="fa-solid fa-circle-dot"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Bàn trống</span>
            <span class="kpi-mini-value">${formatNumber(available)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon amber"><i class="fa-solid fa-user-group"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Đang có khách</span>
            <span class="kpi-mini-value">${formatNumber(occupied)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon purple"><i class="fa-solid fa-bookmark"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Đã đặt trước</span>
            <span class="kpi-mini-value">${formatNumber(booked)}</span>
          </div>
        </div>
      </div>
    `;
  }

  if (view === 'reservations') {
    const total = list.length;
    const pending = list.filter(r => String(r.status).toUpperCase() === 'PENDING').length;
    const confirmed = list.filter(r => String(r.status).toUpperCase() === 'CONFIRMED').length;
    const arrived = list.filter(r => ['ARRIVED', 'CHECKED_IN', 'COMPLETED'].includes(String(r.status).toUpperCase())).length;

    return `
      <div class="kpi-summary-strip">
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon blue"><i class="fa-solid fa-calendar-check"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Tổng lượt đặt</span>
            <span class="kpi-mini-value">${formatNumber(total)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon amber"><i class="fa-solid fa-clock"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Chờ xác nhận</span>
            <span class="kpi-mini-value">${formatNumber(pending)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon green"><i class="fa-solid fa-circle-check"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Đã xác nhận</span>
            <span class="kpi-mini-value">${formatNumber(confirmed)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon purple"><i class="fa-solid fa-person-walking-luggage"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Đã nhận bàn</span>
            <span class="kpi-mini-value">${formatNumber(arrived)}</span>
          </div>
        </div>
      </div>
    `;
  }

  if (view === 'orders') {
    const total = list.length;
    const unpaid = list.filter(o => String(o.paymentStatus).toUpperCase() !== 'PAID').length;
    const preparing = list.filter(o => ['CONFIRMED', 'PREPARING'].includes(String(o.status).toUpperCase())).length;
    const completed = list.filter(o => String(o.status).toUpperCase() === 'COMPLETED').length;

    return `
      <div class="kpi-summary-strip">
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon blue"><i class="fa-solid fa-receipt"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Tổng số đơn</span>
            <span class="kpi-mini-value">${formatNumber(total)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon rose"><i class="fa-solid fa-credit-card"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Chưa thanh toán</span>
            <span class="kpi-mini-value">${formatNumber(unpaid)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon amber"><i class="fa-solid fa-fire-burner"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Đang làm món</span>
            <span class="kpi-mini-value">${formatNumber(preparing)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon green"><i class="fa-solid fa-circle-check"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Đã hoàn thành</span>
            <span class="kpi-mini-value">${formatNumber(completed)}</span>
          </div>
        </div>
      </div>
    `;
  }

  if (view === 'users') {
    const total = list.length;
    const staff = list.filter(u => ['ADMIN', 'STAFF', 'KITCHEN'].includes(String(u.role).toUpperCase())).length;
    const customers = list.filter(u => String(u.role).toUpperCase() === 'CUSTOMER' || !u.role).length;
    const blocked = list.filter(u => String(u.status).toUpperCase() === 'BLOCKED' || String(u.status).toUpperCase() === 'INACTIVE').length;

    return `
      <div class="kpi-summary-strip">
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon blue"><i class="fa-solid fa-users"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Tổng người dùng</span>
            <span class="kpi-mini-value">${formatNumber(total)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon purple"><i class="fa-solid fa-user-shield"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Nhân sự quản lý</span>
            <span class="kpi-mini-value">${formatNumber(staff)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon green"><i class="fa-solid fa-user-tag"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Khách hàng thành viên</span>
            <span class="kpi-mini-value">${formatNumber(customers)}</span>
          </div>
        </div>
        <div class="kpi-mini-card">
          <div class="kpi-mini-icon rose"><i class="fa-solid fa-user-slash"></i></div>
          <div class="kpi-mini-copy">
            <span class="kpi-mini-label">Bị khóa tài khoản</span>
            <span class="kpi-mini-value">${formatNumber(blocked)}</span>
          </div>
        </div>
      </div>
    `;
  }

  return '';
}

function renderViewFilterTabs(view, rawData) {
  const activeTab = state.activeTabs[view] || 'ALL';
  const list = Array.isArray(rawData) ? rawData : (rawData?.reviews || []);
  if (!list) return '';

  let tabs = [];
  if (view === 'products') {
    tabs = [
      { id: 'ALL', label: 'Tất cả món', count: list.length },
      { id: 'AVAILABLE', label: 'Đang bán', count: list.filter(p => p.isAvailable).length },
      { id: 'UNAVAILABLE', label: 'Tạm ngưng', count: list.filter(p => !p.isAvailable).length },
      { id: 'OUT_OF_STOCK', label: 'Hết hàng', count: list.filter(p => (p.stock ?? 0) <= 0).length }
    ];
  } else if (view === 'tables') {
    tabs = [
      { id: 'ALL', label: 'Tất cả bàn', count: list.length },
      { id: 'AVAILABLE', label: 'Bàn trống', count: list.filter(t => String(t.calculatedStatus || t.status).toUpperCase() === 'AVAILABLE').length },
      { id: 'OCCUPIED', label: 'Đang ăn', count: list.filter(t => String(t.calculatedStatus || t.status).toUpperCase() === 'OCCUPIED').length },
      { id: 'BOOKED', label: 'Đã đặt trước', count: list.filter(t => String(t.calculatedStatus || t.status).toUpperCase() === 'BOOKED').length },
      { id: 'CLEANING', label: 'Cần dọn', count: list.filter(t => String(t.calculatedStatus || t.status).toUpperCase() === 'CLEANING').length }
    ];
  } else if (view === 'reservations') {
    tabs = [
      { id: 'ALL', label: 'Tất cả', count: list.length },
      { id: 'PENDING', label: 'Chờ xác nhận ⏳', count: list.filter(r => String(r.status).toUpperCase() === 'PENDING').length },
      { id: 'CONFIRMED', label: 'Đã xác nhận ✅', count: list.filter(r => String(r.status).toUpperCase() === 'CONFIRMED').length },
      { id: 'ARRIVED', label: 'Đã nhận bàn 🚶', count: list.filter(r => ['ARRIVED', 'CHECKED_IN', 'COMPLETED'].includes(String(r.status).toUpperCase())).length },
      { id: 'CANCELLED', label: 'Đã hủy ❌', count: list.filter(r => String(r.status).toUpperCase() === 'CANCELLED').length }
    ];
  } else if (view === 'orders') {
    tabs = [
      { id: 'ALL', label: 'Tất cả đơn', count: list.length },
      { id: 'PENDING', label: 'Chờ xử lý ⏳', count: list.filter(o => String(o.status).toUpperCase() === 'PENDING').length },
      { id: 'PREPARING', label: 'Đang làm món 🍳', count: list.filter(o => ['CONFIRMED', 'PREPARING'].includes(String(o.status).toUpperCase())).length },
      { id: 'READY', label: 'Sẵn sàng 🔔', count: list.filter(o => String(o.status).toUpperCase() === 'READY').length },
      { id: 'COMPLETED', label: 'Hoàn thành ✅', count: list.filter(o => String(o.status).toUpperCase() === 'COMPLETED').length },
      { id: 'UNPAID', label: 'Chưa trả tiền 💳', count: list.filter(o => String(o.paymentStatus).toUpperCase() !== 'PAID').length }
    ];
  } else if (view === 'users') {
    tabs = [
      { id: 'ALL', label: 'Tất cả', count: list.length },
      { id: 'ADMIN', label: 'ADMIN', count: list.filter(u => String(u.role).toUpperCase() === 'ADMIN').length },
      { id: 'STAFF', label: 'STAFF', count: list.filter(u => String(u.role).toUpperCase() === 'STAFF').length },
      { id: 'KITCHEN', label: 'KITCHEN', count: list.filter(u => String(u.role).toUpperCase() === 'KITCHEN').length },
      { id: 'CUSTOMER', label: 'CUSTOMER', count: list.filter(u => String(u.role).toUpperCase() === 'CUSTOMER' || !u.role).length }
    ];
  } else if (view === 'reviews') {
    tabs = [
      { id: 'ALL', label: 'Tất cả', count: list.length },
      { id: '5', label: '5 Sao ★★★★★', count: list.filter(r => Number(r.rating) === 5).length },
      { id: '4', label: '4 Sao ★★★★', count: list.filter(r => Number(r.rating) === 4).length },
      { id: 'LOW', label: '1 - 3 Sao ★', count: list.filter(r => Number(r.rating) <= 3).length }
    ];
  }

  if (tabs.length === 0) return '<div></div>';

  return `
    <div class="filter-tabs-group">
      ${tabs.map(tab => `
        <button class="filter-tab ${activeTab === tab.id ? 'active' : ''}" data-action="set-filter-tab" data-view="${view}" data-tab="${tab.id}">
          <span>${tab.label}</span>
          <span class="filter-tab-count">${tab.count}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function getFilteredRecords(view, records) {
  let list = Array.isArray(records) ? records : (records?.reviews || []);
  const activeTab = state.activeTabs[view] || 'ALL';
  const query = (state.filters[view] || '').trim().toLowerCase();

  if (activeTab !== 'ALL') {
    if (view === 'products') {
      if (activeTab === 'AVAILABLE') list = list.filter(p => p.isAvailable);
      else if (activeTab === 'UNAVAILABLE') list = list.filter(p => !p.isAvailable);
      else if (activeTab === 'OUT_OF_STOCK') list = list.filter(p => (p.stock ?? 0) <= 0);
    } else if (view === 'tables') {
      list = list.filter(t => String(t.calculatedStatus || t.status).toUpperCase() === activeTab);
    } else if (view === 'reservations') {
      if (activeTab === 'ARRIVED') list = list.filter(r => ['ARRIVED', 'CHECKED_IN', 'COMPLETED'].includes(String(r.status).toUpperCase()));
      else list = list.filter(r => String(r.status).toUpperCase() === activeTab);
    } else if (view === 'orders') {
      if (activeTab === 'PREPARING') list = list.filter(o => ['CONFIRMED', 'PREPARING'].includes(String(o.status).toUpperCase()));
      else if (activeTab === 'UNPAID') list = list.filter(o => String(o.paymentStatus).toUpperCase() !== 'PAID');
      else list = list.filter(o => String(o.status).toUpperCase() === activeTab);
    } else if (view === 'users') {
      if (activeTab === 'CUSTOMER') list = list.filter(u => String(u.role).toUpperCase() === 'CUSTOMER' || !u.role);
      else list = list.filter(u => String(u.role).toUpperCase() === activeTab);
    } else if (view === 'reviews') {
      if (activeTab === 'LOW') list = list.filter(r => Number(r.rating) <= 3);
      else list = list.filter(r => String(r.rating) === activeTab);
    }
  }

  if (!query) return list;
  return list.filter(record => {
    if (view === 'orders') {
      const tInfo = getOrderTableInfo(record, state.data.tables);
      const searchStr = `${JSON.stringify(record)} ${tInfo.label} ${tInfo.tableNumber || ''}`.toLowerCase();
      return searchStr.includes(query);
    }
    return JSON.stringify(record).toLowerCase().includes(query);
  });
}

function renderViewContent(view, records, mode) {
  if (records?.__error) {
    return `<div class="error-state"><strong>Lỗi tải dữ liệu</strong><p>${escapeHtml(records.__error)}</p></div>`;
  }

  if (mode === 'table') {
    return renderDataTable(view, records);
  }

  if (view === 'products') return renderProductsGrid(records);
  if (view === 'categories') return renderCategoriesGrid(records);
  if (view === 'tables') return renderTablesFloorGrid(records, state.activeTabs.tables || 'ALL', state.data.orders, state.data.reservations);
  if (view === 'reservations') return renderReservationsGrid(records);
  if (view === 'orders') return renderOrdersGrid(records, state.activeTabs.orders || 'ALL', state.data.tables);
  if (view === 'users') return renderUsersGrid(records);
  if (view === 'reviews') return renderReviewsGrid(records);

  return renderDataTable(view, records);
}



function renderCategoriesGrid(records) {
  if (!records || records.length === 0) {
    return `<div class="empty-state"><strong>Chưa có danh mục món nào</strong><p>Bấm Thêm danh mục để tạo mới.</p></div>`;
  }

  return `
    <div class="categories-grid">
      ${records.map(cat => `
        <article class="category-card">
          <div class="category-card-media">
            ${cat.image ? `<img src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}" />` : `<div class="product-card-placeholder" style="height:100%"><i class="fa-solid fa-folder-open"></i></div>`}
            <span class="category-card-badge">${formatNumber(cat.productCount ?? 0)} Món</span>
          </div>
          <div class="category-card-body">
            <h4 class="category-card-title">${escapeHtml(cat.name)}</h4>
            <p class="category-card-desc">${escapeHtml(cat.description || 'Không có mô tả.')}</p>
            <div class="row-actions" style="margin-top:auto">
              <button class="btn btn-secondary btn-small" data-action="edit-record" data-view="categories" data-id="${cat.id}"><i class="fa-solid fa-pen"></i> Sửa</button>
              <button class="btn btn-danger btn-small" data-action="delete-record" data-view="categories" data-id="${cat.id}"><i class="fa-solid fa-trash"></i> Xóa</button>
            </div>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}



function renderReviewsGrid(records) {
  const list = Array.isArray(records?.reviews) ? records.reviews : records;
  if (!list || list.length === 0) {
    return `<div class="empty-state"><strong>Chưa có phản hồi đánh giá nào</strong></div>`;
  }

  const total = list.length;
  const avgRating = total > 0 ? (list.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / total).toFixed(1) : '5.0';

  return `
    <div class="reviews-hero-widget">
      <div class="reviews-score-box">
        <div class="reviews-score-big">${avgRating}</div>
        <div>
          <div class="reviews-stars-display">${'★'.repeat(Math.round(Number(avgRating)))}</div>
          <div style="font-weight:600; opacity:0.9; margin-top:0.2rem">Dựa trên ${formatNumber(total)} phản hồi từ khách hàng</div>
        </div>
      </div>
      <div style="text-align:right">
        <span class="badge-inline" style="background:rgba(255,255,255,0.2); color:white">Hệ thống đánh giá món ăn</span>
      </div>
    </div>

    <div class="reviews-grid">
      ${list.map(rev => {
        const name = rev.user?.fullName || rev.phone || 'Khách ẩn danh';
        const initials = userInitials({ fullName: name });
        const ratingStars = '★'.repeat(Number(rev.rating) || 5);

        return `
          <article class="review-card">
            <div class="review-card-head">
              <div class="reviewer-info">
                <div class="reviewer-avatar">${initials}</div>
                <div>
                  <div style="font-weight:700">${escapeHtml(name)}</div>
                  <div class="review-stars">${ratingStars}</div>
                </div>
              </div>
              <span class="muted" style="font-size:0.78rem">${formatDateTime(rev.created_at || rev.createdAt)}</span>
            </div>

            ${rev.dish_name ? `<span class="review-dish-tag"><i class="fa-solid fa-bowl-food"></i> ${escapeHtml(rev.dish_name)}</span>` : ''}

            <div class="review-content-box">
              "${escapeHtml(rev.content || 'Khách hàng không để lại lời nhắn.')}"
            </div>

            <div class="row-actions" style="margin-top:auto; justify-content:flex-end">
              <button class="btn btn-danger btn-small" data-action="delete-record" data-view="reviews" data-id="${rev.id}"><i class="fa-solid fa-trash"></i> Xóa đánh giá</button>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderDataTable(view, records) {
  if (records?.__error) {
    return `<div class="error-state"><strong>Lỗi tải dữ liệu</strong><p>${escapeHtml(records.__error)}</p></div>`;
  }

  if (!records || records.length === 0) {
    return `<div class="empty-state"><strong>Chưa có dữ liệu</strong><p>Không có bản ghi nào cho mục này.</p></div>`;
  }

  if (view === 'reviews') {
    return renderReviewsTable(records);
  }

  if (view === 'orders') {
    return renderOrdersTable(records);
  }

  if (view === 'users') {
    return renderUsersTable(records);
  }

  const columns = ENTITY_CONFIGS[view].columns;
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            ${columns.map(column => `<th>${escapeHtml(column.label)}</th>`).join('')}
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(record => renderEntityRow(view, record)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderUsersTable(records) {
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Thành viên</th>
            <th>Số điện thoại</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th style="text-align:right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(user => {
            const initials = userInitials(user);
            const role = String(user.role || 'CUSTOMER').toUpperCase();
            const isBlocked = String(user.status || 'ACTIVE').toUpperCase() === 'BLOCKED';

            return `
              <tr>
                <td>
                  <div style="display:flex; align-items:center; gap:0.75rem">
                    <div class="user-card-avatar" style="width:38px; height:38px; font-size:0.9rem">
                      ${user.avatar ? `<img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.fullName)}" />` : initials}
                    </div>
                    <div>
                      <strong style="display:block; font-size:0.95rem; color:#111c2d">${escapeHtml(user.fullName || 'Người dùng')}</strong>
                      <small style="color:#5f748d">@${escapeHtml(user.username || 'user')}</small>
                    </div>
                  </div>
                </td>
                <td><i class="fa-solid fa-phone" style="font-size:0.8rem; color:#737686; margin-right:0.3rem"></i> ${escapeHtml(user.phone || '-')}</td>
                <td>${statusChip(role, role)}</td>
                <td>${statusChip(isBlocked ? 'blocked' : 'active', isBlocked ? 'Bị khóa' : 'Hoạt động')}</td>
                <td style="text-align:right">
                  <div class="row-actions" style="justify-content:flex-end">
                    <button class="btn btn-ghost btn-small" data-action="view-user-detail" data-id="${user.id}"><i class="fa-solid fa-eye"></i> Chi tiết</button>
                    <button class="btn btn-secondary btn-small" data-action="edit-record" data-view="users" data-id="${user.id}" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger btn-small" data-action="delete-record" data-view="users" data-id="${user.id}" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderEntityRow(view, record) {
  const config = ENTITY_CONFIGS[view];
  const cells = config.columns.map(column => `<td>${column.render(record)}</td>`).join('');
  return `
    <tr>
      ${cells}
      <td>
        <div class="row-actions">
          ${config.allowEdit ? `<button class="btn btn-secondary btn-small" data-action="edit-record" data-view="${view}" data-id="${record.id}">Sửa</button>` : ''}
          ${config.allowDelete ? `<button class="btn btn-danger btn-small" data-action="delete-record" data-view="${view}" data-id="${record.id}">Xóa</button>` : ''}
          ${renderCustomRowActions(view, record)}
        </div>
      </td>
    </tr>
  `;
}

function renderCustomRowActions(view, record) {
  if (view === 'tables') {
    return `
      <select class="inline-input" style="width:auto" data-action="table-status-select" data-id="${record.id}">
        ${['AVAILABLE', 'BOOKED', 'OCCUPIED', 'CLEANING'].map(status => `<option value="${status}" ${String(record.status).toUpperCase() === status ? 'selected' : ''}>${status}</option>`).join('')}
      </select>
      <button class="btn btn-secondary btn-small" data-action="save-table-status" data-id="${record.id}">Cập nhật</button>
    `;
  }

  if (view === 'reservations') {
    return `
      <button class="btn btn-secondary btn-small" data-action="reservation-checkin" data-id="${record.id}">Check-in</button>
      <button class="btn btn-ghost btn-small" data-action="reservation-cancel" data-id="${record.id}">Hủy</button>
    `;
  }

  if (view === 'products') {
    return `<span class="badge-inline">#${record.id}</span>`;
  }

  return '';
}

function renderOrdersTable(records) {
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách</th>
            <th>Bàn</th>
            <th>Tổng tiền</th>
            <th>Thanh toán</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(record => {
            const tInfo = getOrderTableInfo(record, state.data.tables);
            const customerName = record.User?.fullName || record.user_id ? (record.User?.fullName || `#${record.user_id}`) : 'Khách vãng lai';
            return `
            <tr>
              <td>#${record.id}</td>
              <td>${escapeHtml(customerName)}</td>
              <td><span class="badge-inline" style="background:#e0f2fe; color:#004ac6; font-weight:700"><i class="fa-solid ${tInfo.isTakeaway ? 'fa-bag-shopping' : 'fa-chair'}"></i> ${tInfo.label}</span></td>
              <td>${formatCurrency(record.finalPrice ?? record.totalPrice)}</td>
              <td>${statusChip(paymentStatusClass(record.paymentStatus), record.paymentStatus)}</td>
              <td>
                <select class="inline-input" style="width:auto" data-action="order-status-select" data-id="${record.id}">
                  ${['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map(status => `<option value="${status}" ${String(record.status).toUpperCase() === status ? 'selected' : ''}>${status}</option>`).join('')}
                </select>
              </td>
              <td>
                <div class="row-actions">
                  <button class="btn btn-secondary btn-small" data-action="save-order-status" data-id="${record.id}">Lưu</button>
                  <button class="btn btn-primary btn-small" data-action="open-admin-checkout" data-id="${record.id}" data-table="${tInfo.tableNumber || ''}" data-customer="${escapeHtml(customerName)}" data-amount="${record.finalPrice ?? record.totalPrice}" data-items="${(record.OrderItems || []).length}" data-status="${String(record.status || 'PENDING').toUpperCase()}">Thanh toán</button>
                  <button class="btn btn-danger btn-small" data-action="delete-record" data-view="orders" data-id="${record.id}">Xóa</button>
                  <button class="btn btn-ghost btn-small" data-action="toggle-order-detail" data-id="${record.id}">Chi tiết</button>
                </div>
              </td>
            </tr>
            <tr class="hidden" data-order-detail="${record.id}">
              <td colspan="7">
                <div class="mini-card">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; padding-bottom:0.4rem; border-bottom:1px dashed #cbd5e1">
                    <h4 class="mini-card-title" style="margin:0">Chi tiết đơn #${record.id}</h4>
                    <span class="badge-inline" style="background:#e0f2fe; color:#004ac6; font-weight:800"><i class="fa-solid ${tInfo.isTakeaway ? 'fa-bag-shopping' : 'fa-chair'}"></i> ${tInfo.label}</span>
                  </div>
                  <p class="mini-card-copy">${escapeHtml(record.note || 'Không có ghi chú')}</p>
                  <div class="info-list" style="margin-top:0.8rem">
                    ${(record.OrderItems || []).map(item => `
                      <div class="info-row">
                        <strong>${escapeHtml(item.Product?.name || `#${item.product_id}`)} x${item.quantity}</strong>
                        <span>${formatCurrency(item.totalPrice || 0)}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderReviewsTable(records) {
  const list = Array.isArray(records?.reviews) ? records.reviews : records;
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Người đánh giá</th>
            <th>Món</th>
            <th>Nội dung</th>
            <th>Số sao</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(record => `
            <tr>
              <td>${escapeHtml(record.user?.fullName || record.phone || '-')}</td>
              <td>${escapeHtml(record.dish_name || '-')}</td>
              <td>${escapeHtml(record.content || '-')}</td>
              <td>${escapeHtml('★'.repeat(record.rating || 0))}</td>
              <td>${escapeHtml(formatDateTime(record.created_at || record.createdAt))}</td>
              <td><button class="btn btn-danger btn-small" data-action="delete-record" data-view="reviews" data-id="${record.id}">Xóa</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderModal() {
  if (!state.modal) return '';
  if (state.modal.kind === 'generic-form') {
    return `
      <div class="modal-backdrop" data-action="close-modal">
        <div class="modal-card" data-action="stop-propagation">
          <div class="modal-head">
            <div>
              <h3 class="modal-title">${escapeHtml(state.modal.title)}</h3>
              <div class="subtle">${escapeHtml(state.modal.subtitle || '')}</div>
            </div>
            <button class="btn btn-ghost btn-small" data-action="close-modal">Đóng</button>
          </div>
          <form class="modal-body" data-form="entity" data-view="${state.modal.view}" data-mode="${state.modal.mode}" data-id="${state.modal.record?.id || ''}">
            ${renderEntityFields(state.modal.view, state.modal.record)}
            <div class="modal-actions">
              <button type="submit" class="btn btn-primary">${state.modal.mode === 'edit' ? 'Lưu thay đổi' : 'Tạo mới'}</button>
              <button type="button" class="btn btn-secondary" data-action="close-modal">Hủy</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (state.modal.kind === 'user-detail') {
    return renderUserDetailModal(state.modal.record);
  }

  if (state.modal.kind === 'order-form') {
    return renderOrderModal();
  }

  if (state.modal.kind === 'reservation-form') {
    return renderReservationModal();
  }

  if (state.modal.kind === 'bulk-tables') {
    return renderTableBulkModal();
  }

  if (state.modal.kind === 'table-qr') {
    return renderTableQrModal(state.modal.record);
  }

  return '';
}

function renderTableQrModal(tableData) {
  if (!tableData) return '';
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-card" data-action="stop-propagation" style="max-width:440px; text-align:center">
        <div class="modal-head">
          <div>
            <h3 class="modal-title"><i class="fa-solid fa-qrcode text-accent" style="margin-right:0.4rem"></i>Mã QR Bàn #${escapeHtml(tableData.number)}</h3>
            <div class="subtle">Quét mã QR để truy cập thực đơn và đặt món trực tuyến</div>
          </div>
          <button class="btn btn-ghost btn-small" data-action="close-modal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body" style="padding:1rem 0; display:grid; gap:1.1rem">
          <div style="background:#ffffff; padding:1.4rem; border-radius:22px; border:2px solid #3b82f6; box-shadow:0 10px 30px rgba(0,74,198,0.12)">
            <div style="font-weight:900; font-size:1.15rem; color:#004ac6; margin-bottom:0.2rem; letter-spacing:0.5px">FUTURESUSHI RESTAURANT</div>
            <div style="font-size:0.8rem; color:#64748b; margin-bottom:0.9rem">Hệ Thống Đặt Món Thông Minh Tại Bàn</div>
            <img src="${escapeHtml(tableData.img)}" alt="Mã QR Bàn #${escapeHtml(tableData.number)}" style="width:220px; height:220px; border-radius:14px; margin:0 auto; display:block; border:1px solid #cbd5e1; box-shadow:0 4px 14px rgba(0,0,0,0.06)" />
            <div style="margin-top:0.9rem; font-weight:800; font-size:1.1rem; color:#111c2d">Bàn #${escapeHtml(tableData.number)} • Sức chứa ${escapeHtml(tableData.capacity || 4)} người</div>
            <div style="font-size:0.82rem; color:#64748b; margin-top:0.2rem">Mã định danh: <code>${escapeHtml(tableData.code || `T${tableData.number}`)}</code></div>
            <code style="display:block; margin-top:0.6rem; background:#f1f5f9; padding:0.45rem; border-radius:8px; font-size:0.75rem; word-break:break-all; border:1px solid #e2e8f0">${escapeHtml(tableData.url)}</code>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem">
            <button type="button" class="btn btn-secondary" data-action="copy-table-url" data-url="${escapeHtml(tableData.url)}" style="padding:0.65rem; font-size:0.88rem"><i class="fa-regular fa-copy"></i> Sao chép link</button>
            <a class="btn btn-primary" href="${escapeHtml(tableData.img)}" download="QR_Ban_${tableData.number}.png" target="_blank" style="padding:0.65rem; font-size:0.88rem"><i class="fa-solid fa-download"></i> Tải ảnh QR</a>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem">
            <button type="button" class="btn btn-secondary" onclick="window.print()" style="padding:0.65rem; font-size:0.88rem"><i class="fa-solid fa-print"></i> In mã QR</button>
            <a class="btn btn-ghost" href="${escapeHtml(tableData.url)}" target="_blank" style="padding:0.65rem; font-size:0.88rem; border:1px solid #cbd5e1"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở Menu Web</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderUserDetailModal(user) {
  if (!user) return '';
  const initials = userInitials(user);
  const role = String(user.role || 'CUSTOMER').toUpperCase();
  const isBlocked = String(user.status || 'ACTIVE').toUpperCase() === 'BLOCKED';

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-card" data-action="stop-propagation" style="max-width:540px">
        <div class="modal-head">
          <div>
            <h3 class="modal-title">Thông tin chi tiết người dùng</h3>
            <div class="subtle">Mã tài khoản #${user.id}</div>
          </div>
          <button class="btn btn-ghost btn-small" data-action="close-modal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body" style="display:grid; gap:1.2rem">
          <div style="display:flex; align-items:center; gap:1.2rem; background:#f8fafc; padding:1.2rem; border-radius:18px; border:1px solid rgba(115,118,134,0.16)">
            <div class="user-card-avatar" style="width:64px; height:64px; font-size:1.5rem">
              ${user.avatar ? `<img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.fullName)}" />` : initials}
            </div>
            <div>
              <h4 style="margin:0; font-size:1.2rem; font-weight:800; color:#111c2d">${escapeHtml(user.fullName || 'Người dùng')}</h4>
              <div style="color:#5f748d; font-size:0.88rem; margin-top:0.2rem">@${escapeHtml(user.username || 'user')}</div>
              <div style="display:flex; gap:0.5rem; margin-top:0.5rem">
                ${statusChip(role, role)}
                ${statusChip(isBlocked ? 'blocked' : 'active', isBlocked ? 'Bị khóa' : 'Hoạt động')}
              </div>
            </div>
          </div>

          <div class="info-list">
            <div class="info-row">
              <strong>Số điện thoại</strong>
              <span>${escapeHtml(user.phone || 'Chưa cập nhật')}</span>
            </div>
            <div class="info-row">
              <strong>Email liên hệ</strong>
              <span>${escapeHtml(user.email || 'Chưa cập nhật')}</span>
            </div>
            <div class="info-row">
              <strong>Điểm tích lũy</strong>
              <strong style="color:#b45309">⭐ ${formatNumber(user.points ?? 0)} điểm</strong>
            </div>
            <div class="info-row">
              <strong>Ngày tạo tài khoản</strong>
              <span>${formatDateTime(user.createdAt || user.created_at)}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions" style="margin-top:1rem">
          <button class="btn btn-secondary" data-action="edit-record" data-view="users" data-id="${user.id}"><i class="fa-solid fa-pen"></i> Chỉnh sửa</button>
          <button class="btn btn-primary" data-action="close-modal">Đóng</button>
        </div>
      </div>
    </div>
  `;
}

function renderEntityFields(view, record) {
  const config = ENTITY_CONFIGS[view];
  const payload = config.payload ? config.payload(record || {}) : {};

  return `
    <div class="modal-grid">
      ${config.fields.map(field => renderField(view, field, payload[field.name], record)).join('')}
    </div>
  `;
}

function renderField(view, field, value, record) {
  if (field.onlyOnEdit && !record) return '';
  if (field.requiredOnCreate && record) {
    field = { ...field, required: false };
  }

  if (field.type === 'checkbox') {
    return `
      <div class="field">
        <label>
          <input type="checkbox" name="${field.name}" ${value ? 'checked' : ''} />
          ${escapeHtml(field.label)}
        </label>
        ${field.helper ? `<div class="form-hint">${escapeHtml(field.helper)}</div>` : ''}
      </div>
    `;
  }

  if (field.type === 'select') {
    const options = typeof field.options === 'function' ? field.options(state) : field.options;
    return `
      <div class="field">
        <label for="${field.name}">${escapeHtml(field.label)}</label>
        <select id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>
          ${field.placeholder ? `<option value="">${escapeHtml(field.placeholder)}</option>` : ''}
          ${(options || []).map(option => {
            if (typeof option === 'string') {
              return `<option value="${escapeHtml(option)}" ${String(value) === option ? 'selected' : ''}>${escapeHtml(option)}</option>`;
            }
            return `<option value="${escapeHtml(option.value)}" ${String(value) === String(option.value) ? 'selected' : ''}>${escapeHtml(option.label)}</option>`;
          }).join('')}
        </select>
        ${field.helper ? `<div class="form-hint">${escapeHtml(field.helper)}</div>` : ''}
      </div>
    `;
  }

  if (field.type === 'textarea') {
    return `
      <div class="field full">
        <label for="${field.name}">${escapeHtml(field.label)}</label>
        <textarea id="${field.name}" name="${field.name}" placeholder="${escapeHtml(field.placeholder || '')}" ${field.required ? 'required' : ''}>${escapeHtml(value || '')}</textarea>
        ${field.helper ? `<div class="form-hint">${escapeHtml(field.helper)}</div>` : ''}
      </div>
    `;
  }

  if (field.type === 'image') {
    return `
      <div class="field full">
        <label for="${field.name}">${escapeHtml(field.label)}</label>
        <input id="${field.name}" name="${field.name}" type="text" value="${escapeHtml(value || '')}" placeholder="/uploads/... hoặc URL ảnh" />
        <input name="${field.name}File" type="file" accept="image/*" />
        <div class="form-hint">Chọn file để upload tự động hoặc dán trực tiếp URL ảnh.</div>
        ${value ? `<div class="image-preview"><img src="${escapeHtml(value)}" alt="${escapeHtml(field.label)}" /></div>` : ''}
      </div>
    `;
  }

  const inputType = field.type === 'datetime-local' ? 'datetime-local' : field.type;
  const inputValue = field.type === 'datetime-local' ? toDatetimeLocal(value) : value ?? '';

  return `
    <div class="field ${field.full ? 'full' : ''}">
      <label for="${field.name}">${escapeHtml(field.label)}</label>
      <input
        id="${field.name}"
        name="${field.name}"
        type="${inputType}"
        value="${escapeHtml(inputValue)}"
        ${field.min !== undefined ? `min="${field.min}"` : ''}
        ${field.step ? `step="${field.step}"` : ''}
        ${field.required ? 'required' : ''}
        placeholder="${escapeHtml(field.placeholder || '')}"
      />
      ${field.helper ? `<div class="form-hint">${escapeHtml(field.helper)}</div>` : ''}
    </div>
  `;
}

function toDatetimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function renderOrderModal() {
  const tables = state.data.tables || [];
  const products = state.data.products || [];
  const defaultItems = [
    { product_id: products[0]?.id || '', quantity: 1, note: '' }
  ];

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-card" data-action="stop-propagation">
        <div class="modal-head">
          <div>
            <h3 class="modal-title">Tạo đơn hàng</h3>
            <div class="subtle">Đơn hàng mới sẽ được tạo trực tiếp qua endpoint hiện có.</div>
          </div>
          <button class="btn btn-ghost btn-small" data-action="close-modal">Đóng</button>
        </div>

        <form class="modal-body" data-form="order-create">
          <div class="modal-grid">
            <div class="field">
              <label for="orderTable">Bàn</label>
              <select id="orderTable" name="table_id">
                <option value="">Khách mang đi / chưa gán bàn</option>
                ${tables.map(table => `<option value="${table.id}">#${table.tableNumber} • ${escapeHtml(table.status)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label for="orderPoints">Điểm dùng</label>
              <input id="orderPoints" name="used_points" type="number" min="0" step="1" value="0" />
            </div>
            <div class="field full">
              <label for="orderNote">Ghi chú</label>
              <textarea id="orderNote" name="note" placeholder="Ghi chú cho bếp hoặc thu ngân"></textarea>
            </div>
          </div>

          <div>
            <div class="section-head" style="margin-bottom:0.6rem">
              <div>
                <h4 class="section-title" style="font-size:1.08rem">Món trong đơn</h4>
                <p class="section-description">Thêm nhiều món để gửi đúng payload items cho backend.</p>
              </div>
              <button type="button" class="btn btn-secondary btn-small" data-action="add-order-item">Thêm món</button>
            </div>
            <div class="card-list" data-order-items>
              ${defaultItems.map((item, index) => renderOrderItemRow(index, item)).join('')}
            </div>
          </div>

          <div class="note-box">Gợi ý: nếu muốn thanh toán ngay, hãy tạo đơn xong rồi quay lại tab Đơn hàng để đổi trạng thái và thanh toán.</div>

          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">Tạo đơn</button>
            <button type="button" class="btn btn-secondary" data-action="close-modal">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderOrderItemRow(index, item = {}) {
  const products = state.data.products || [];
  return `
    <div class="item-row" data-order-item="${index}">
      <div class="field">
        <label>Sản phẩm</label>
        <select name="product_id">
          ${products.map(product => `<option value="${product.id}" ${String(item.product_id) === String(product.id) ? 'selected' : ''}>${escapeHtml(product.name)} • ${formatCurrency(product.price)}</option>`).join('')}
        </select>
      </div>
      <div class="field small">
        <label>Số lượng</label>
        <input name="quantity" type="number" min="1" step="1" value="${item.quantity || 1}" />
      </div>
      <div class="field">
        <label>Ghi chú</label>
        <input name="note" type="text" value="${escapeHtml(item.note || '')}" placeholder="Ví dụ: ít cay" />
      </div>
      <button type="button" class="btn btn-danger btn-small" data-action="remove-order-item">Xóa</button>
    </div>
  `;
}

function renderReservationModal() {
  const users = state.data.users || [];
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-card" data-action="stop-propagation">
        <div class="modal-head">
          <div>
            <h3 class="modal-title">Thêm đặt bàn</h3>
            <div class="subtle">Tạo lịch đặt mới qua endpoint hiện có của backend.</div>
          </div>
          <button class="btn btn-ghost btn-small" data-action="close-modal">Đóng</button>
        </div>

        <form class="modal-body" data-form="reservation-create">
          <div class="modal-grid">
            <div class="field">
              <label for="guestName">Tên khách</label>
              <input id="guestName" name="guestName" type="text" required />
            </div>
            <div class="field">
              <label for="guestPhone">Số điện thoại</label>
              <input id="guestPhone" name="guestPhone" type="text" required />
            </div>
            <div class="field">
              <label for="reservationTime">Thời gian</label>
              <input id="reservationTime" name="reservationTime" type="datetime-local" required />
            </div>
            <div class="field">
              <label for="numberOfGuests">Số khách</label>
              <input id="numberOfGuests" name="numberOfGuests" type="number" min="1" step="1" value="1" required />
            </div>
            <div class="field">
              <label for="user_id">Tài khoản liên kết</label>
              <select id="user_id" name="user_id">
                <option value="">Không liên kết</option>
                ${users.map(user => `<option value="${user.id}">${escapeHtml(user.fullName)} • ${escapeHtml(user.phone)}</option>`).join('')}
              </select>
            </div>
            <div class="field full">
              <label for="note">Ghi chú</label>
              <textarea id="note" name="note"></textarea>
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">Tạo đặt bàn</button>
            <button type="button" class="btn btn-secondary" data-action="close-modal">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderTableBulkModal() {
  const template = JSON.stringify([
    { tableNumber: 1, qrCode: 'T1-001', capacity: 4, status: 'AVAILABLE' },
    { tableNumber: 2, qrCode: 'T2-002', capacity: 4, status: 'AVAILABLE' }
  ], null, 2);

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal-card" data-action="stop-propagation">
        <div class="modal-head">
          <div>
            <h3 class="modal-title">Nạp bàn hàng loạt</h3>
            <div class="subtle">Backend hiện tại chỉ hỗ trợ bulk create cho bàn, nên form này gửi một mảng JSON.</div>
          </div>
          <button class="btn btn-ghost btn-small" data-action="close-modal">Đóng</button>
        </div>

        <form class="modal-body" data-form="table-bulk-create">
          <div class="note-box">Mỗi phần tử cần có <strong>tableNumber</strong>, <strong>qrCode</strong>, <strong>capacity</strong> và <strong>status</strong>.</div>
          <div class="field full">
            <label for="tableBulkJson">JSON danh sách bàn</label>
            <textarea id="tableBulkJson" name="tableBulkJson">${escapeHtml(template)}</textarea>
          </div>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">Nạp dữ liệu</button>
            <button type="button" class="btn btn-secondary" data-action="close-modal">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderToast(item) {
  return `
    <div class="toast">
      <h4 class="toast-title">${escapeHtml(item.title)}</h4>
      <p class="toast-text">${escapeHtml(item.text)}</p>
    </div>
  `;
}

function renderToasts() {
  const existing = app.querySelector('.toast-stack');
  if (!existing) return;
  existing.innerHTML = state.toast.map(renderToast).join('');
}

function bindLogin() {
  const form = app.querySelector('[data-form="login"]');
  if (!form) return;

  const toggleBtn = app.querySelector('#toggle-pw');
  const passwordInput = app.querySelector('#password');
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      }
    });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(form);
    const account = String(formData.get('account') || '').trim();
    const password = String(formData.get('password') || '');

    try {
      const result = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ account, password })
      });
      persistAuth(result.token, result.user);
      toast('success', 'Đăng nhập thành công', `Xin chào ${result.user.fullName || result.user.username}`);
      await boot();
    } catch (error) {
      toast('danger', 'Đăng nhập thất bại', error.message || 'Không thể xác thực tài khoản.');
    }
  });
}

function bindGlobalEvents() {
  app.onclick = async event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const view = target.dataset.view;
    const id = target.dataset.id;

    if (action !== 'close-modal' && action !== 'stop-propagation') {
      event.preventDefault();
    }

    if (action === 'stop-propagation') {
      event.stopPropagation();
      return;
    }

    try {
      switch (action) {
        case 'switch-view':
          state.activeView = view;
          render();
          break;
        case 'logout':
          clearAuth();
          toast('success', 'Đã đăng xuất', 'Phiên quản trị đã được xóa khỏi trình duyệt.');
          render();
          break;
        case 'refresh-all':
          state.loading = true;
          render();
          await loadAllData();
          state.loading = false;
          render();
          break;
        case 'create-record':
          openCreateModal(view);
          break;
        case 'edit-record':
          openEditModal(view, id);
          break;
        case 'delete-record':
          await deleteRecord(view, id);
          break;
        case 'close-modal':
          state.modal = null;
          render();
          break;
        case 'stats-reset':
          state.statsQuery = { type: 'day', date: '' };
          state.loading = true;
          render();
          await loadAllData();
          state.loading = false;
          render();
          break;
        case 'reservation-confirm':
          await simpleAction(`/api/reservations/${id}/confirm`, { method: 'PUT' }, 'Đã xác nhận đặt bàn thành công');
          break;
        case 'reservation-checkin':
          await simpleAction(`/api/reservations/${id}/check-in`, { method: 'PUT' }, 'Đã check-in đặt bàn');
          break;
        case 'reservation-cancel':
          await simpleAction(`/api/reservations/${id}/cancel`, { method: 'PUT' }, 'Đã hủy đặt bàn');
          break;
        case 'save-table-status': {
          const select = app.querySelector(`[data-action="table-status-select"][data-id="${id}"]`);
          const status = select?.value || 'AVAILABLE';
          await simpleAction(`/api/tables/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
          }, 'Đã cập nhật trạng thái bàn');
          break;
        }
        case 'order-status-select':
          break;
        case 'save-order-status': {
          const select = app.querySelector(`[data-action="order-status-select"][data-id="${id}"]`);
          const status = select?.value || 'PENDING';
          await simpleAction(`/api/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
          }, 'Đã cập nhật trạng thái đơn');
          break;
        }
        case 'open-admin-checkout': {
          const table = target.dataset.table;
          const customer = target.dataset.customer;
          const amount = target.dataset.amount;
          const items = target.dataset.items;
          const status = target.dataset.status;
          openAdminCheckoutModal(id, table, customer, amount, items, status);
          break;
        }
        case 'pay-order':
          await simpleAction(`/api/orders/${id}/pay`, {
            method: 'PUT',
            body: JSON.stringify({ paymentMethod: 'CASH' })
          }, 'Đơn đã được thanh toán');
          break;
        case 'table-status-select':
          break;
        case 'search-input':
          state.filters[view] = target.value;
          render();
          break;
        case 'clear-search':
          state.filters[view] = '';
          render();
          break;
        case 'add-order-item':
          addOrderItem();
          break;
        case 'remove-order-item':
          removeOrderItem(target.closest('.item-row'));
          break;
        case 'toggle-view-mode':
          state.viewModes[view] = target.dataset.mode || 'grid';
          render();
          break;
        case 'set-filter-tab':
          state.activeTabs[view] = target.dataset.tab || 'ALL';
          render();
          break;
        case 'toggle-product-available': {
          const product = (state.data.products || []).find(p => String(p.id) === String(id));
          if (product) {
            await simpleAction(`/api/products/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ ...product, isAvailable: !product.isAvailable })
            }, product.isAvailable ? 'Đã ngưng bán món ăn' : 'Đã bật bán món ăn');
          }
          break;
        }
        case 'toggle-user-status': {
          const userObj = (state.data.users || []).find(u => String(u.id) === String(id));
          if (userObj) {
            const newStatus = String(userObj.status).toUpperCase() === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
            await simpleAction(`/api/users/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ ...userObj, status: newStatus })
            }, newStatus === 'BLOCKED' ? 'Đã khóa tài khoản người dùng' : 'Đã mở khóa tài khoản');
          }
          break;
        }
        case 'view-user-detail': {
          const userObj = (state.data.users || []).find(u => String(u.id) === String(id));
          if (userObj) {
            state.modal = { kind: 'user-detail', record: userObj };
            render();
          }
          break;
        }
        case 'toggle-order-detail': {
          const detailRow = app.querySelector(`[data-order-detail="${id}"]`);
          if (detailRow) {
            detailRow.classList.toggle('hidden');
          }
          break;
        }
        case 'confirm-order': {
          await simpleAction(`/api/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'CONFIRMED' })
          }, `Đã xác nhận Đơn hàng #${id} và chuyển qua Bếp chế biến!`);
          break;
        }
        case 'cancel-order': {
          if (confirm(`Bạn chắc chắn muốn HỦY bỏ Đơn hàng #${id}?`)) {
            await simpleAction(`/api/orders/${id}/status`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'CANCELLED' })
            }, `Đã hủy bỏ Đơn hàng #${id}.`);
          }
          break;
        }
        case 'open-admin-checkout': {
          const tableNumber = target.dataset.table;
          const customerName = target.dataset.customer;
          const amount = target.dataset.amount;
          const itemsCount = target.dataset.items;
          const status = target.dataset.status;
          openAdminCheckoutModal(id, tableNumber, customerName, amount, itemsCount, status);
          break;
        }
        case 'open-table-qr-modal': {
          const number = target.dataset.number;
          const capacity = target.dataset.capacity || 4;
          const code = target.dataset.code || `T${number}`;
          const url = target.dataset.url;
          const img = target.dataset.img;
          state.modal = {
            kind: 'table-qr',
            record: { number, capacity, code, url, img }
          };
          render();
          break;
        }
        case 'toggle-table-detail': {
          const detailRow = app.querySelector(`[data-table-detail="${id}"]`);
          if (detailRow) {
            detailRow.classList.toggle('hidden');
          }
          break;
        }
        case 'copy-table-url': {
          const url = target.dataset.url;
          if (url) {
            if (navigator?.clipboard?.writeText) {
              navigator.clipboard.writeText(url).then(() => {
                toast('success', 'Đã sao chép liên kết', 'Đường dẫn gọi món bàn đã được sao chép.');
              }).catch(() => {
                prompt('Sao chép liên kết gọi món bàn:', url);
              });
            } else {
              prompt('Sao chép liên kết gọi món bàn:', url);
            }
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      toast('danger', 'Thao tác thất bại', error.message || 'Không thể thực hiện thao tác.');
    }
  };

  app.onchange = async event => {
    const target = event.target;
    if (target.matches('[data-action="table-status-select"]')) {
      const id = target.dataset.id;
      const status = target.value;
      try {
        await simpleAction(`/api/tables/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status })
        }, 'Đã cập nhật trạng thái bàn');
      } catch (err) {
        toast('danger', 'Cập nhật thất bại', err.message || 'Không thể đổi trạng thái bàn.');
      }
    }
  };

  app.oninput = event => {
    const target = event.target;
    if (target.matches('[data-action="search-input"]')) {
      state.filters[target.dataset.view] = target.value;
      render();
    }
  };

  app.onsubmit = async event => {
    const form = event.target;
    const formName = form.dataset.form;
    if (!formName) return;
    event.preventDefault();

    try {
      if (formName === 'entity') {
        await submitEntityForm(form);
      } else if (formName === 'order-create') {
        await submitOrderForm(form);
      } else if (formName === 'reservation-create') {
        await submitReservationForm(form);
      } else if (formName === 'table-bulk-create') {
        await submitTableBulkForm(form);
      } else if (formName === 'stats-filter') {
        const formData = new FormData(form);
        state.statsQuery = {
          type: String(formData.get('type') || 'day'),
          date: String(formData.get('date') || '')
        };
        state.loading = true;
        render();
        await loadAllData();
        state.loading = false;
        render();
      }
    } catch (error) {
      toast('danger', 'Lưu thất bại', error.message || 'Không thể lưu dữ liệu.');
    }
  };
}

function openCreateModal(view) {
  const config = ENTITY_CONFIGS[view];
  if (config.customCreateMode === 'order') {
    state.modal = { kind: 'order-form' };
  } else if (config.customCreateMode === 'reservation') {
    state.modal = { kind: 'reservation-form' };
  } else if (config.customCreateMode === 'bulk-tables') {
    state.modal = { kind: 'bulk-tables' };
  } else {
    state.modal = {
      kind: 'generic-form',
      view,
      mode: 'create',
      title: config.createLabel,
      subtitle: `Tạo mới dữ liệu cho mục ${VIEW_META[view].title}.`,
      record: null
    };
  }
  render();
}

function openEditModal(view, id) {
  const config = ENTITY_CONFIGS[view];
  const record = (state.data[view] || []).find(item => String(item.id) === String(id));
  if (!record) {
    toast('danger', 'Không tìm thấy bản ghi', 'Bản ghi cần chỉnh sửa không tồn tại.');
    return;
  }

  state.modal = {
    kind: 'generic-form',
    view,
    mode: 'edit',
    title: `Sửa ${VIEW_META[view].title.toLowerCase()}`,
    subtitle: `Cập nhật trực tiếp bản ghi #${record.id}.`,
    record
  };
  render();
}

async function submitEntityForm(form) {
  const view = form.dataset.view;
  const mode = form.dataset.mode;
  const id = form.dataset.id;
  const config = ENTITY_CONFIGS[view];
  const payload = buildPayloadFromForm(form, config.fields, config.payload ? config.payload((mode === 'edit' ? state.data[view].find(item => String(item.id) === String(id)) : null) || {}) : {});
  const filePayload = await hydrateImageFields(form, config.fields, payload);
  const body = normalizePayload(view, filePayload, mode, id);

  const endpoint = mode === 'edit' ? `${config.endpoint}/${id}` : config.endpoint;
  const method = mode === 'edit' ? 'PUT' : 'POST';
  await api(endpoint, { method, body: JSON.stringify(body) });
  toast('success', 'Đã lưu dữ liệu', `${VIEW_META[view].title} đã được cập nhật.`);
  state.modal = null;
  await reloadAfterMutation();
}

function buildPayloadFromForm(form, fields, defaults = {}) {
  const formData = new FormData(form);
  const payload = { ...defaults };

  for (const field of fields) {
    if (field.type === 'image') {
      const textValue = String(formData.get(field.name) || '').trim();
      payload[field.name] = textValue;
      continue;
    }

    if (field.type === 'checkbox') {
      payload[field.name] = formData.has(field.name);
      continue;
    }

    if (field.type === 'select') {
      const raw = formData.get(field.name);
      payload[field.name] = raw === '' || raw === null ? '' : raw;
      continue;
    }

    const rawValue = formData.get(field.name);
    if (rawValue === null || rawValue === '') {
      if (field.requiredOnCreate) {
        continue;
      }
      payload[field.name] = defaults[field.name] ?? '';
      continue;
    }

    if (field.type === 'number') {
      payload[field.name] = Number(rawValue);
    } else {
      payload[field.name] = String(rawValue);
    }
  }

  return payload;
}

async function hydrateImageFields(form, fields, payload) {
  const nextPayload = { ...payload };
  const formData = new FormData(form);
  for (const field of fields.filter(item => item.type === 'image')) {
    const file = formData.get(`${field.name}File`);
    if (file instanceof File && file.size > 0) {
      nextPayload[field.name] = await uploadImage(file);
    }
  }
  return nextPayload;
}

function normalizePayload(view, payload, mode, id) {
  const body = { ...payload };

  if (view === 'users') {
    if (mode === 'edit' && !body.password) {
      delete body.password;
    }
    if (body.points !== undefined) {
      body.points = Number(body.points || 0);
    }
  }

  if (view === 'products') {
    body.price = Number(body.price || 0);
    body.stock = Number(body.stock || 0);
    body.category_id = Number(body.category_id || 0);
    body.isAvailable = Boolean(body.isAvailable);
  }

  if (view === 'categories') {
    body.name = String(body.name || '').trim();
  }

  if (view === 'reservations') {
    body.numberOfGuests = Number(body.numberOfGuests || 1);
    if (body.user_id === '') delete body.user_id;
  }

  if (view === 'orders') {
    body.table_id = body.table_id ? Number(body.table_id) : null;
    body.used_points = Number(body.used_points || 0);
  }

  if (view === 'tables') {
    body.tableNumber = Number(body.tableNumber || 1);
    body.capacity = Number(body.capacity || 4);
    body.status = String(body.status || 'AVAILABLE');
    if (!body.qrCode) {
      body.qrCode = `T${body.tableNumber}`;
    }
  }

  return body;
}

function submitOrderForm(form) {
  const formData = new FormData(form);
  const itemRows = [...form.querySelectorAll('[data-order-item]')];
  const items = itemRows.map(row => {
    const productId = row.querySelector('[name="product_id"]')?.value;
    const quantity = Number(row.querySelector('[name="quantity"]')?.value || 1);
    const note = row.querySelector('[name="note"]')?.value || '';
    return {
      product_id: Number(productId),
      quantity,
      note
    };
  }).filter(item => item.product_id);

  if (!items.length) {
    throw new Error('Đơn hàng phải có ít nhất một món.');
  }

  const body = {
    table_id: formData.get('table_id') ? Number(formData.get('table_id')) : null,
    items,
    note: String(formData.get('note') || ''),
    used_points: Number(formData.get('used_points') || 0)
  };

  return api('/api/orders', {
    method: 'POST',
    body: JSON.stringify(body)
  }).then(() => {
    toast('success', 'Đã tạo đơn hàng', 'Đơn hàng mới đã được gửi tới backend.');
    state.modal = null;
    return reloadAfterMutation();
  });
}

function submitReservationForm(form) {
  const formData = new FormData(form);
  const body = {
    guestName: String(formData.get('guestName') || ''),
    guestPhone: String(formData.get('guestPhone') || ''),
    reservationTime: String(formData.get('reservationTime') || ''),
    numberOfGuests: Number(formData.get('numberOfGuests') || 1),
    note: String(formData.get('note') || '')
  };

  const userId = formData.get('user_id');
  if (userId) {
    body.user_id = Number(userId);
  }

  return api('/api/reservations', {
    method: 'POST',
    body: JSON.stringify(body)
  }).then(() => {
    toast('success', 'Đã tạo đặt bàn', 'Lịch đặt mới đã được lưu thành công.');
    state.modal = null;
    return reloadAfterMutation();
  });
}

function submitTableBulkForm(form) {
  const formData = new FormData(form);
  const raw = String(formData.get('tableBulkJson') || '');
  const tables = safeParseJson(raw);
  if (!Array.isArray(tables)) {
    throw new Error('JSON phải là một mảng các bàn.');
  }

  return api('/api/tables/bulk', {
    method: 'POST',
    body: JSON.stringify(tables)
  }).then(() => {
    toast('success', 'Đã nạp bàn', 'Danh sách bàn đã được đồng bộ vào backend.');
    state.modal = null;
    return reloadAfterMutation();
  });
}

function addOrderItem() {
  const list = app.querySelector('[data-order-items]');
  if (!list) return;
  const index = list.querySelectorAll('[data-order-item]').length;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderOrderItemRow(index, { product_id: state.data.products?.[0]?.id || '', quantity: 1, note: '' });
  list.appendChild(wrapper.firstElementChild);
}

function removeOrderItem(row) {
  if (!row) return;
  const list = row.parentElement;
  if (!list || list.querySelectorAll('[data-order-item]').length <= 1) {
    toast('warning', 'Không thể xóa hết món', 'Đơn hàng cần ít nhất một món.');
    return;
  }
  row.remove();
}

async function deleteRecord(view, id) {
  const message = view === 'reviews'
    ? 'Bạn chắc chắn muốn xóa đánh giá này?'
    : `Bạn chắc chắn muốn xóa ${VIEW_META[view].title.toLowerCase()} #${id}?`;

  if (!window.confirm(message)) return;

  const config = ENTITY_CONFIGS[view];
  if (view === 'reviews') {
    await api(`/api/reviews/${id}`, { method: 'DELETE' });
  } else {
    await api(`${config.endpoint}/${id}`, { method: 'DELETE' });
  }

  toast('success', 'Đã xóa bản ghi', `${VIEW_META[view].title} đã được xóa thành công.`);
  await reloadAfterMutation();
}

async function simpleAction(path, options, successMessage) {
  await api(path, options);
  toast('success', 'Hoàn tất', successMessage);
  await reloadAfterMutation();
}

async function reloadAfterMutation() {
  state.loading = true;
  render();
  await loadAllData();
  state.loading = false;
  render();
}

function openAdminCheckoutModal(orderId, tableNumber, customerName, amount, itemsCount, status) {
  const st = String(status || '').toUpperCase();
  if (st && st !== 'READY' && st !== 'COMPLETED') {
    toast('amber', 'Chưa thể thanh toán', `Đơn hàng #${orderId} chưa hoàn thành chế biến! (Trạng thái: ${st}). Vui lòng chờ Bếp nấu xong (READY) trước khi thanh toán.`);
    return;
  }

  state.checkoutOrderId = orderId;
  state.checkoutAmount = Number(amount || 0);

  const tableText = tableNumber ? `Bàn #${tableNumber}` : 'Mang đi / Chưa gán bàn';

  if (document.querySelector('#payment-modal-title')) document.querySelector('#payment-modal-title').textContent = `💳 Thanh toán Đơn hàng #${orderId}`;
  if (document.querySelector('#payment-modal-sub')) document.querySelector('#payment-modal-sub').textContent = `Vị trí: ${tableText} • Khách hàng: ${customerName}`;
  if (document.querySelector('#payment-modal-amount')) document.querySelector('#payment-modal-amount').textContent = formatCurrency(amount);
  if (document.querySelector('#payment-modal-items-count')) document.querySelector('#payment-modal-items-count').textContent = `${itemsCount || 0} món ăn trong đơn hàng`;

  if (document.querySelector('#cash-given-input')) document.querySelector('#cash-given-input').value = '';
  if (document.querySelector('#cash-change-text')) document.querySelector('#cash-change-text').textContent = '0 ₫';

  switchAdminPaymentTab('cash');

  const modalEl = document.querySelector('#staff-payment-modal');
  if (modalEl) modalEl.classList.remove('hidden');
}

function switchAdminPaymentTab(tab) {
  state.paymentTab = tab;
  const cashBtn = document.querySelector('#tab-pay-cash');
  const payosBtn = document.querySelector('#tab-pay-payos');
  const cashPanel = document.querySelector('#panel-pay-cash');
  const payosPanel = document.querySelector('#panel-pay-payos');

  if (tab === 'cash') {
    if (cashBtn) cashBtn.className = 'btn btn-primary';
    if (payosBtn) payosBtn.className = 'btn btn-secondary';
    if (cashPanel) cashPanel.classList.remove('hidden');
    if (payosPanel) payosPanel.classList.add('hidden');
  } else {
    if (cashBtn) cashBtn.className = 'btn btn-secondary';
    if (payosBtn) payosBtn.className = 'btn btn-primary';
    if (cashPanel) cashPanel.classList.add('hidden');
    if (payosPanel) payosPanel.classList.remove('hidden');

    initAdminPayOSCheckout(state.checkoutOrderId);
  }
}

async function initAdminPayOSCheckout(orderId) {
  if (!orderId) return;
  const qrImg = document.querySelector('#payos-qr-image');
  const statusTxt = document.querySelector('#payos-qr-status');
  const codeTxt = document.querySelector('#payos-order-code');
  const webBtn = document.querySelector('#btn-open-payos-url');

  if (statusTxt) statusTxt.textContent = '⏳ Đang kết nối liên kết thanh toán PayOS Backend...';

  const payosData = await generatePayOSQRUrl(orderId, state.checkoutAmount);
  if (qrImg) qrImg.src = payosData.qrUrl;
  if (statusTxt) statusTxt.textContent = `🟢 Mã QR PayOS đã sẵn sàng (Số HĐ: ${payosData.orderCode})`;
  if (codeTxt) codeTxt.textContent = `PAYOS-CODE: ${payosData.orderCode}`;
  if (webBtn && payosData.checkoutUrl) {
    webBtn.href = payosData.checkoutUrl;
    webBtn.style.display = 'inline-flex';
  }
}

// Global Document Handlers for Admin Payment Modal
document.addEventListener('click', async event => {
  if (event.target.closest('#close-staff-payment-modal')) {
    const modalEl = document.querySelector('#staff-payment-modal');
    if (modalEl) modalEl.classList.add('hidden');
    return;
  }

  if (event.target.closest('#tab-pay-cash')) {
    switchAdminPaymentTab('cash');
    return;
  }
  if (event.target.closest('#tab-pay-payos')) {
    switchAdminPaymentTab('payos');
    return;
  }

  if (event.target.closest('#btn-confirm-cash-paid')) {
    if (!state.checkoutOrderId) return;
    try {
      await api(`/api/orders/${state.checkoutOrderId}/pay`, {
        method: 'PUT',
        body: JSON.stringify({ paymentMethod: 'CASH' })
      });
      toast('success', 'Thanh toán thành công', `Đơn hàng #${state.checkoutOrderId} đã được thu tiền mặt.`);
      const modalEl = document.querySelector('#staff-payment-modal');
      if (modalEl) modalEl.classList.add('hidden');
      await reloadAfterMutation();
    } catch (err) {
      toast('danger', 'Lỗi thanh toán', err.message || 'Không thể thanh toán tiền mặt');
    }
    return;
  }

  if (event.target.closest('#btn-confirm-transfer-paid')) {
    if (!state.checkoutOrderId) return;
    try {
      await api(`/api/orders/${state.checkoutOrderId}/pay`, {
        method: 'PUT',
        body: JSON.stringify({ paymentMethod: 'TRANSFER' })
      });
      toast('success', 'Thanh toán thành công', `Đơn hàng #${state.checkoutOrderId} đã được xác nhận chuyển khoản.`);
      const modalEl = document.querySelector('#staff-payment-modal');
      if (modalEl) modalEl.classList.add('hidden');
      await reloadAfterMutation();
    } catch (err) {
      toast('danger', 'Lỗi thanh toán', err.message || 'Không thể thanh toán chuyển khoản');
    }
    return;
  }

  if (event.target.closest('#btn-check-payos-status')) {
    if (!state.checkoutOrderId) return;
    try {
      const res = await api(`/api/payos/check-status/${state.checkoutOrderId}`);
      if (res.status === 'PAID') {
        toast('success', 'PayOS Thành công', `Đơn hàng #${state.checkoutOrderId} đã được thanh toán qua PayOS!`);
        const modalEl = document.querySelector('#staff-payment-modal');
        if (modalEl) modalEl.classList.add('hidden');
        await reloadAfterMutation();
      } else {
        toast('warning', 'Chưa thanh toán', `Trạng thái PayOS: ${res.payosStatus || res.status}`);
      }
    } catch (err) {
      toast('danger', 'Lỗi kiểm tra', err.message || 'Không thể kiểm tra PayOS');
    }
    return;
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'cash-given-input') {
    const given = Number(event.target.value || 0);
    const amount = Number(state.checkoutAmount || 0);
    const change = Math.max(0, given - amount);
    const changeEl = document.querySelector('#cash-change-text');
    if (changeEl) {
      changeEl.textContent = formatCurrency(change);
      changeEl.style.color = given >= amount && amount > 0 ? '#15803d' : '#dc2626';
    }
  }
});

render();
boot();
