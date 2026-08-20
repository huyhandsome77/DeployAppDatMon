const API_BASE_URL = (window.ADMIN_API_BASE_URL || localStorage.getItem('appdatmon_admin_api_base') || 'http://localhost:3000').replace(/\/$/, '');
const TOKEN_KEY = 'appdatmon_admin_token';

let state = {
  orders: [],
  tables: [],
  users: [],
  reservations: [],
  orderFilter: 'ALL',
  reservationFilter: 'ALL',
  userSearchQuery: '',
  checkoutOrderId: null,
  checkoutAmount: 0,
  paymentTab: 'cash'
};

// Generic API Client with Auth Header Integration
function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers }).then(async res => {
    const raw = await res.text();
    const body = raw ? JSON.parse(raw) : null;
    if (!res.ok) {
      const error = new Error(body?.message || body?.error || raw || 'Thao tác thất bại');
      error.status = res.status;
      throw error;
    }
    return body;
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getOrderTableInfo(order, tables = []) {
  if (!order) {
    return {
      tableNumber: null,
      label: 'Mang đi',
      isTakeaway: true,
      displayBadge: '<span class="order-table-chip takeaway"><i class="fa-solid fa-bag-shopping"></i> Mang đi</span>'
    };
  }

  // 1. Direct object associations
  const directNum = order.RestaurantTable?.tableNumber ?? order.table?.tableNumber ?? order.tableNumber;
  if (directNum !== undefined && directNum !== null && directNum !== '') {
    return {
      tableNumber: directNum,
      label: `Bàn #${directNum}`,
      isTakeaway: false,
      displayBadge: `<span class="order-table-chip"><i class="fa-solid fa-chair"></i> Bàn #${directNum}</span>`
    };
  }

  // 2. Lookup in tables list (by table_id or matching id/tableNumber)
  const tableId = order.table_id ?? order.tableId ?? order.RestaurantTable?.id ?? order.table?.id;
  if (tableId !== undefined && tableId !== null && tableId !== '') {
    const tableList = Array.isArray(tables) && tables.length ? tables : (state.tables || []);
    const matchedTable = tableList.find(t => String(t.id) === String(tableId) || String(t.tableNumber) === String(tableId));
    if (matchedTable && (matchedTable.tableNumber !== undefined && matchedTable.tableNumber !== null)) {
      return {
        tableNumber: matchedTable.tableNumber,
        label: `Bàn #${matchedTable.tableNumber}`,
        isTakeaway: false,
        displayBadge: `<span class="order-table-chip"><i class="fa-solid fa-chair"></i> Bàn #${matchedTable.tableNumber}</span>`
      };
    }
    return {
      tableNumber: tableId,
      label: `Bàn #${tableId}`,
      isTakeaway: false,
      displayBadge: `<span class="order-table-chip"><i class="fa-solid fa-chair"></i> Bàn #${tableId}</span>`
    };
  }

  return {
    tableNumber: null,
    label: 'Mang đi',
    isTakeaway: true,
    displayBadge: '<span class="order-table-chip takeaway"><i class="fa-solid fa-bag-shopping"></i> Mang đi</span>'
  };
}

function statusChip(typeClass, label) {
  return `<span class="badge-inline ${typeClass}">${escapeHtml(label)}</span>`;
}

function paymentStatusClass(status) {
  switch (String(status).toUpperCase()) {
    case 'PAID': return 'badge-success';
    case 'UNPAID': return 'badge-warning';
    case 'REFUNDED': return 'badge-danger';
    default: return 'badge-neutral';
  }
}

function orderStatusClass(status) {
  switch (String(status).toUpperCase()) {
    case 'PENDING': return 'badge-warning';
    case 'CONFIRMED':
    case 'PREPARING': return 'badge-info';
    case 'READY': return 'badge-primary';
    case 'COMPLETED': return 'badge-success';
    case 'CANCELLED': return 'badge-danger';
    default: return 'badge-neutral';
  }
}

function renderOrderFilterTabs(records) {
  const tabsContainer = document.querySelector('#order-filter-pills');
  if (!tabsContainer) return;

  const list = Array.isArray(records) ? records : [];
  const activeTab = state.orderFilter || 'ALL';

  const tabs = [
    { id: 'ALL', label: 'Tất cả đơn', count: list.length },
    { id: 'PENDING', label: 'Chờ xử lý ⏳', count: list.filter(o => String(o.status).toUpperCase() === 'PENDING').length },
    { id: 'PREPARING', label: 'Đang làm món 🍳', count: list.filter(o => ['CONFIRMED', 'PREPARING'].includes(String(o.status).toUpperCase())).length },
    { id: 'READY', label: 'Sẵn sàng 🔔', count: list.filter(o => String(o.status).toUpperCase() === 'READY').length },
    { id: 'COMPLETED', label: 'Hoàn thành ✅', count: list.filter(o => String(o.status).toUpperCase() === 'COMPLETED').length },
    { id: 'UNPAID', label: 'Chưa trả tiền 💳', count: list.filter(o => String(o.paymentStatus).toUpperCase() !== 'PAID').length }
  ];

  tabsContainer.innerHTML = tabs.map(tab => `
    <button class="filter-tab ${activeTab === tab.id ? 'active' : ''}" data-order-filter="${tab.id}">
      <span>${tab.label}</span>
      <span class="filter-tab-count">${tab.count}</span>
    </button>
  `).join('');
}

// 1. Quản lý Đơn hàng: Render Enterprise Order Cards Grid (Template chuẩn Admin)
function renderOrdersGrid(records) {
  const container = document.querySelector('#staff-orders-grid');
  if (!container) return;

  renderOrderFilterTabs(state.orders);

  const list = Array.isArray(records) ? records : [];
  const activeFilter = state.orderFilter || 'ALL';
  const query = (state.userSearchQuery || '').trim().toLowerCase();

  let filtered = list;
  if (activeFilter && activeFilter !== 'ALL') {
    filtered = list.filter(o => {
      const st = String(o.status || '').toUpperCase();
      const pst = String(o.paymentStatus || '').toUpperCase();
      if (activeFilter === 'PREPARING') return ['CONFIRMED', 'PREPARING'].includes(st);
      if (activeFilter === 'UNPAID') return pst !== 'PAID';
      return st === activeFilter;
    });
  }

  if (query) {
    filtered = filtered.filter(order => {
      const tInfo = getOrderTableInfo(order, state.tables);
      const str = `${JSON.stringify(order)} ${tInfo.label} ${tInfo.tableNumber || ''}`.toLowerCase();
      return str.includes(query);
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><strong>Không tìm thấy đơn hàng nào ở trạng thái này</strong></div>`;
    return;
  }

  container.innerHTML = filtered.map(order => {
    const tableInfo = getOrderTableInfo(order, state.tables);
    const customerName = order.User?.fullName || (order.user_id ? `Khách #${order.user_id}` : 'Khách vãng lai');
    const rawStatus = String(order.status || 'PENDING').toUpperCase();
    const paymentStatus = String(order.paymentStatus || 'UNPAID').toUpperCase();
    const items = order.OrderItems || [];
    const itemsCount = items.reduce((acc, item) => acc + (item.quantity || 1), 0);

    let stepIdx = 0;
    if (rawStatus === 'CONFIRMED' || rawStatus === 'PREPARING') stepIdx = 1;
    if (rawStatus === 'READY') stepIdx = 2;
    if (rawStatus === 'COMPLETED') stepIdx = 3;

    return `
      <article class="order-card">
        <div class="order-card-head">
          <div class="order-id-badge">
            <i class="fa-solid fa-receipt"></i> Đơn #${order.id}
          </div>
          ${tableInfo.displayBadge}
        </div>

        <div class="order-customer-info">
          <div><i class="fa-solid fa-user"></i> <strong>${escapeHtml(customerName)}</strong></div>
          <span class="muted">${formatDateTime(order.createdAt || order.created_at)}</span>
        </div>

        <div class="order-stepper">
          <div class="order-stepper-line"></div>
          <div class="order-step ${stepIdx >= 0 ? 'done' : ''}" title="Nhận đơn"><i class="fa-solid fa-check"></i></div>
          <div class="order-step ${stepIdx >= 1 ? 'done' : ''}" title="Đang chế biến"><i class="fa-solid fa-fire"></i></div>
          <div class="order-step ${stepIdx >= 2 ? 'done' : ''}" title="Sẵn sàng"><i class="fa-solid fa-bell"></i></div>
          <div class="order-step ${stepIdx >= 3 ? 'done' : ''}" title="Hoàn thành"><i class="fa-solid fa-flag-checkered"></i></div>
        </div>

        <div class="order-summary-box">
          <div>
            <span class="muted" style="font-size:0.82rem; display:block">Số món: <strong>${itemsCount} phần</strong></span>
            ${statusChip(paymentStatusClass(paymentStatus), paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán')}
          </div>
          <div class="order-total-price">${formatCurrency(order.finalPrice ?? order.totalPrice)}</div>
        </div>

        <!-- Action Buttons Row -->
        <div class="row-actions" style="gap:0.45rem; justify-content:space-between; align-items:center">
          ${rawStatus === 'PENDING' ? `
            <button type="button" class="btn btn-primary btn-small" data-action="confirm-order" data-id="${order.id}" style="font-weight:700; flex:1; padding:0.45rem 0.75rem" title="Xác nhận đơn và chuyển qua Bếp">
              <i class="fa-solid fa-check"></i> Xác nhận
            </button>
            <button type="button" class="btn btn-danger btn-small" data-action="cancel-order" data-id="${order.id}" style="font-weight:700; padding:0.45rem 0.75rem" title="Hủy bỏ đơn hàng">
              <i class="fa-solid fa-ban"></i> Hủy đơn
            </button>
          ` : (rawStatus === 'CONFIRMED' || rawStatus === 'PREPARING') ? `
            <div class="status-chip status-pending" style="flex:1; justify-content:center; padding:0.45rem 0.75rem; border-radius:10px; font-weight:700; font-size:0.83rem">
              <i class="fa-solid fa-fire text-rose"></i> Bếp đang chế biến...
            </div>
          ` : rawStatus === 'READY' ? `
            <button type="button" class="btn btn-primary btn-small" data-action="open-checkout-modal" data-id="${order.id}" data-table="${tableInfo.tableNumber || ''}" data-customer="${escapeHtml(customerName)}" data-amount="${order.finalPrice ?? order.totalPrice}" data-items="${itemsCount}" data-status="${rawStatus}" style="font-weight:800; flex:1; padding:0.45rem 0.75rem; background:linear-gradient(135deg, #15803d, #16a34a)" title="Món đã sẵn sàng! Bấm để thu tiền">
              <i class="fa-solid fa-credit-card"></i> Thu tiền
            </button>
          ` : rawStatus === 'COMPLETED' ? `
            <div class="status-chip status-completed" style="flex:1; justify-content:center; padding:0.45rem 0.75rem; border-radius:10px; font-weight:700; font-size:0.83rem">
              <i class="fa-solid fa-circle-check"></i> Đã hoàn thành & Thanh toán
            </div>
          ` : `
            <div class="status-chip status-cancelled" style="flex:1; justify-content:center; padding:0.45rem 0.75rem; border-radius:10px; font-weight:700; font-size:0.83rem">
              <i class="fa-solid fa-ban"></i> Đơn đã hủy
            </div>
          `}
          <button type="button" class="btn btn-ghost btn-small" data-action="toggle-order-detail" data-id="${order.id}" style="padding:0.45rem 0.65rem" title="Xem chi tiết đơn"><i class="fa-solid fa-chevron-down"></i></button>
        </div>

        <div class="mini-card hidden" data-order-detail="${order.id}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; padding-bottom:0.4rem; border-bottom:1px dashed #cbd5e1">
            <div><strong>Vị trí phục vụ:</strong> <span class="badge-inline" style="background:#e0f2fe; color:#004ac6; font-weight:800"><i class="fa-solid ${tableInfo.isTakeaway ? 'fa-bag-shopping' : 'fa-chair'}"></i> ${tableInfo.label}</span></div>
            <div><i class="fa-solid fa-user"></i> <strong>${escapeHtml(customerName)}</strong></div>
          </div>
          <h4 class="mini-card-title">Ghi chú: ${escapeHtml(order.note || 'Không có')}</h4>
          <div class="info-list" style="margin-top:0.6rem">
            ${items.map(item => `
              <div class="info-row" style="padding:0.4rem 0.6rem">
                <span>${escapeHtml(item.Product?.name || `#${item.product_id}`)} x${item.quantity}</span>
                <strong>${formatCurrency(item.totalPrice || 0)}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// 2. Quản lý Bàn: Render Interactive Grid (Template Order Card & Hiển thị Mã QR)
function renderTablesGrid(tables) {
  const container = document.querySelector('#staff-tables-grid');
  if (!container) return;

  const list = Array.isArray(tables) ? tables : [];
  if (list.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#64748b; padding:2rem">Chưa có dữ liệu bàn ăn</div>`;
    return;
  }

  const statusMap = {
    AVAILABLE: { label: '🟢 Bàn trống', cssClass: 'st-available' },
    BOOKED: { label: '🔵 Đặt trước', cssClass: 'st-booked' },
    OCCUPIED: { label: '🟡 Đang ăn', cssClass: 'st-occupied' },
    CLEANING: { label: '🟣 Cần dọn', cssClass: 'st-cleaning' }
  };

  const now = new Date();
  const allOrders = state.orders || [];
  const allRes = state.reservations || [];
  const baseUrl = window.location.origin.includes('http') ? window.location.origin : 'http://localhost:3000';

  container.innerHTML = list.map(table => {
    const st = String(table.calculatedStatus || table.status || 'AVAILABLE').toUpperCase();
    const info = statusMap[st] || statusMap.AVAILABLE;

    // Active UNPAID order lookup
    const tableIdStr = String(table.id);
    const tableNumStr = String(table.tableNumber);
    const activeOrder = allOrders.find(o => {
      const oTableId = String(o.table_id ?? o.tableId ?? o.RestaurantTable?.id ?? o.table?.id ?? '');
      const oTableNum = String(o.RestaurantTable?.tableNumber ?? o.table?.tableNumber ?? o.tableNumber ?? '');
      const matches = (oTableId === tableIdStr || oTableNum === tableNumStr) && (oTableId !== '' || oTableNum !== '');
      const isUnpaid = String(o.paymentStatus || 'UNPAID').toUpperCase() !== 'PAID';
      const notDone = !['COMPLETED', 'CANCELLED'].includes(String(o.status || '').toUpperCase());
      return matches && isUnpaid && notDone;
    });

    // Active reservation lookup
    const activeRes = allRes.find(r => {
      const rTableId = String(r.table_id ?? r.table?.id ?? '');
      const rTableNum = String(r.table?.tableNumber ?? '');
      const matches = (rTableId === tableIdStr || rTableNum === tableNumStr) && (rTableId !== '' || rTableNum !== '');
      return matches && ['PENDING', 'CONFIRMED'].includes(String(r.status || '').toUpperCase());
    });

    let customerDisplay = 'Bàn sẵn sàng đón khách';
    let customerIcon = 'fa-chair';
    let durationText = '';

    if (st === 'OCCUPIED') {
      customerIcon = 'fa-user-group';
      if (activeOrder) {
        customerDisplay = activeOrder.User?.fullName || (activeOrder.user_id ? `Khách #${activeOrder.user_id}` : 'Khách tại bàn');
      } else if (activeRes) {
        customerDisplay = activeRes.guestName || activeRes.User?.fullName || 'Khách đặt trước';
      } else {
        customerDisplay = 'Khách đang dùng bữa';
      }

      const startTime = table.occupiedSince ? new Date(table.occupiedSince) : (activeOrder?.createdAt ? new Date(activeOrder.createdAt) : null);
      if (startTime && !isNaN(startTime)) {
        const diffMins = Math.max(0, Math.floor((now - startTime) / 60000));
        const timeStr = diffMins >= 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}p` : `${diffMins}p`;
        durationText = `⏱️ ${timeStr}`;
      } else if (table.timeUsed) {
        durationText = `⏱️ ${table.timeUsed}`;
      } else {
        durationText = '⏱️ Đang phục vụ';
      }
    } else if (st === 'BOOKED') {
      customerIcon = 'fa-calendar-check';
      if (activeRes) {
        customerDisplay = `${activeRes.guestName || 'Khách đặt'} (${activeRes.numberOfGuests || table.capacity || 2} khách)`;
        durationText = `📅 ${formatDateTime(activeRes.reservationTime)}`;
      } else {
        customerDisplay = 'Đã có lịch hẹn đặt trước';
        durationText = '📅 Đã đặt trước';
      }
    } else if (st === 'CLEANING') {
      customerIcon = 'fa-broom';
      customerDisplay = 'Chờ nhân viên dọn dẹp vệ sinh';
      durationText = '🟣 Cần dọn';
    } else {
      customerIcon = 'fa-circle-check';
      customerDisplay = `Bàn trống • Sức chứa ${table.capacity || 4} chỗ`;
      durationText = '🟢 Sẵn sàng';
    }

    let stepIdx = 0;
    if (st === 'AVAILABLE') stepIdx = 0;
    if (st === 'BOOKED') stepIdx = 1;
    if (st === 'OCCUPIED') stepIdx = 2;
    if (st === 'CLEANING') stepIdx = 3;

    const qrCodeString = table.qrCode || `TABLE_${table.tableNumber}`;
    const targetUrl = `${baseUrl}/customer/menu.html?qr=${encodeURIComponent(qrCodeString)}&table=${table.tableNumber}&tableId=${table.id}`;
    const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(targetUrl)}`;

    const orderItems = activeOrder?.OrderItems || [];
    const itemsCount = orderItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const orderTotal = activeOrder ? (activeOrder.finalPrice ?? activeOrder.totalPrice) : 0;
    const paymentStatus = activeOrder ? String(activeOrder.paymentStatus || 'UNPAID').toUpperCase() : 'NONE';
    const orderStatus = activeOrder ? String(activeOrder.status || 'PENDING').toUpperCase() : '';

    return `
      <article class="order-card table-card-premium status-border-${st.toLowerCase()}">
        <div class="order-card-head">
          <div class="order-id-badge">
            <i class="fa-solid fa-chair"></i> Bàn #${table.tableNumber}
          </div>
          <span class="table-pill-clean ${info.cssClass}">
            ${info.label}
          </span>
        </div>

        <div class="order-customer-info">
          <div style="display:flex; align-items:center; gap:0.4rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:65%">
            <i class="fa-solid ${customerIcon}" style="color:#004ac6"></i>
            <strong style="font-size:0.92rem; color:#111c2d">${escapeHtml(customerDisplay)}</strong>
          </div>
          <span class="muted" style="font-size:0.8rem; font-weight:700">${escapeHtml(durationText)}</span>
        </div>

        <div class="order-stepper table-stepper" title="Tiến trình trạng thái bàn">
          <div class="order-stepper-line"></div>
          <div class="order-step ${stepIdx >= 0 ? 'done' : ''}" title="Trống (Sẵn sàng)"><i class="fa-solid fa-chair"></i></div>
          <div class="order-step ${stepIdx >= 1 ? 'done' : ''}" title="Đặt trước (Booked)"><i class="fa-solid fa-calendar-check"></i></div>
          <div class="order-step ${stepIdx >= 2 ? 'done' : ''}" title="Đang ăn (Occupied)"><i class="fa-solid fa-utensils"></i></div>
          <div class="order-step ${stepIdx >= 3 ? 'done' : ''}" title="Cần dọn (Cleaning)"><i class="fa-solid fa-broom"></i></div>
        </div>

        ${activeOrder ? `
          <div class="order-summary-box">
            <div>
              <span class="muted" style="font-size:0.82rem; display:block">Đơn #${activeOrder.id} • <strong>${itemsCount} món</strong></span>
              ${statusChip(paymentStatusClass(paymentStatus), 'Chưa thanh toán')}
            </div>
            <div class="order-total-price">${formatCurrency(orderTotal)}</div>
          </div>
        ` : ''}

        <div class="row-actions" style="gap:0.4rem; justify-content:space-between; align-items:center">
          <select data-action="change-table-status" data-id="${table.id}" class="table-quick-select" style="font-weight:700; flex:1" title="Đổi trạng thái bàn (Hệ thống sẽ tự động lưu)">
            <option value="AVAILABLE" ${st === 'AVAILABLE' ? 'selected' : ''}>🟢 Bàn trống</option>
            <option value="BOOKED" ${st === 'BOOKED' ? 'selected' : ''}>🔵 Đặt trước</option>
            <option value="OCCUPIED" ${st === 'OCCUPIED' ? 'selected' : ''}>🟡 Đang ăn</option>
            <option value="CLEANING" ${st === 'CLEANING' ? 'selected' : ''}>🟣 Cần dọn</option>
          </select>

          <button class="btn btn-primary btn-small" data-action="open-table-qr-modal" data-number="${table.tableNumber}" data-capacity="${table.capacity || 4}" data-code="${escapeHtml(qrCodeString)}" data-url="${escapeHtml(targetUrl)}" data-img="${qrImageSrc}" style="font-weight:800; padding:0.4rem 0.75rem" title="Mở mã QR bàn">
            <i class="fa-solid fa-qrcode"></i> QR Bàn
          </button>

          ${activeOrder && paymentStatus !== 'PAID' && ['READY', 'COMPLETED'].includes(orderStatus) ? `
            <button class="btn btn-primary btn-small" data-action="open-checkout-modal" data-id="${activeOrder.id}" data-table="${table.tableNumber}" data-customer="${escapeHtml(customerDisplay)}" data-amount="${orderTotal}" data-items="${itemsCount}" data-status="${orderStatus}" style="font-weight:800; background:#15803d" title="Thanh toán đơn hàng">
              <i class="fa-solid fa-credit-card"></i> Thu tiền
            </button>
          ` : ''}

          <button class="btn btn-ghost btn-small" data-action="toggle-staff-table-detail" data-id="${table.id}" title="Xem chi tiết bàn"><i class="fa-solid fa-chevron-down"></i></button>
        </div>

        <div class="mini-card hidden" data-staff-table-detail="${table.id}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; padding-bottom:0.4rem; border-bottom:1px dashed #cbd5e1">
            <div><strong>Mã Bàn:</strong> <span class="badge-inline" style="background:#e0f2fe; color:#004ac6; font-weight:800"><i class="fa-solid fa-chair"></i> Bàn #${table.tableNumber}</span></div>
            <div style="font-size:0.82rem; color:#64748b">👥 Sức chứa: <strong>${table.capacity || 4} người</strong></div>
          </div>

          ${activeOrder ? `
            <div style="margin-top:0.4rem">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem">
                <h4 class="mini-card-title" style="margin:0"><i class="fa-solid fa-receipt"></i> Đơn hàng #${activeOrder.id} (${itemsCount} món)</h4>
                <span class="badge-inline" style="font-size:0.75rem; background:#f1f5f9">${activeOrder.status}</span>
              </div>
              <div class="info-list" style="max-height:160px; overflow-y:auto">
                ${orderItems.map(item => `
                  <div class="info-row" style="padding:0.3rem 0.5rem">
                    <span>${escapeHtml(item.Product?.name || `#${item.product_id}`)} x${item.quantity}</span>
                    <strong>${formatCurrency(item.totalPrice || 0)}</strong>
                  </div>
                `).join('')}
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; padding-top:0.4rem; border-top:1px solid #f1f5f9">
                <strong style="font-size:0.85rem">Tổng tiền đơn:</strong>
                <strong style="color:#004ac6; font-size:1rem">${formatCurrency(orderTotal)}</strong>
              </div>
            </div>
          ` : activeRes ? `
            <div style="margin-top:0.4rem">
              <h4 class="mini-card-title" style="margin:0 0 0.4rem 0"><i class="fa-solid fa-calendar-check"></i> Thông tin đặt bàn trước</h4>
              <div class="info-list">
                <div class="info-row" style="padding:0.3rem 0.5rem"><span>Khách đặt:</span><strong>${escapeHtml(activeRes.guestName || '-')}</strong></div>
                <div class="info-row" style="padding:0.3rem 0.5rem"><span>Điện thoại:</span><strong>${escapeHtml(activeRes.guestPhone || '-')}</strong></div>
                <div class="info-row" style="padding:0.3rem 0.5rem"><span>Thời gian hẹn:</span><strong>${formatDateTime(activeRes.reservationTime)}</strong></div>
                <div class="info-row" style="padding:0.3rem 0.5rem"><span>Số khách:</span><strong>${activeRes.numberOfGuests || table.capacity || 2} người</strong></div>
              </div>
            </div>
          ` : `
            <div style="font-size:0.84rem; color:#64748b; padding:0.4rem 0; text-align:center">
              <i class="fa-solid fa-circle-check text-success"></i> Bàn đang trống và sẵn sàng đón khách
            </div>
          `}
        </div>
      </article>
    `;
  }).join('');
}

// 3. Quản lý Đặt bàn: Filter Pills & Render Reservations Table
function renderReservationFilterPills() {
  const container = document.querySelector('#reservation-filter-pills');
  if (!container) return;

  const raw = state.reservations || [];
  const counts = {
    ALL: raw.length,
    PENDING: raw.filter(r => String(r.status).toUpperCase() === 'PENDING').length,
    CONFIRMED: raw.filter(r => String(r.status).toUpperCase() === 'CONFIRMED').length,
    CHECKED_IN: raw.filter(r => String(r.status).toUpperCase() === 'CHECKED_IN').length,
    CANCELLED: raw.filter(r => String(r.status).toUpperCase() === 'CANCELLED').length
  };

  const pills = [
    { id: 'ALL', label: 'Tất cả', count: counts.ALL },
    { id: 'PENDING', label: '⏳ Chờ duyệt', count: counts.PENDING },
    { id: 'CONFIRMED', label: '⚡ Đã xác nhận', count: counts.CONFIRMED },
    { id: 'CHECKED_IN', label: '📌 Đã nhận bàn', count: counts.CHECKED_IN },
    { id: 'CANCELLED', label: '❌ Đã hủy', count: counts.CANCELLED }
  ];

  container.innerHTML = pills.map(p => {
    const active = state.reservationFilter === p.id;
    return `
      <button class="filter-tab ${active ? 'active' : ''}" data-action="filter-reservation" data-status="${p.id}">
        <span>${p.label}</span>
        <span class="filter-tab-count">${p.count}</span>
      </button>
    `;
  }).join('');
}

function renderReservationsTable(records) {
  const allRows = Array.isArray(records) ? records : (state.reservations || []);

  // Update KPI counters
  const confirmedEl = document.querySelector('#metric-res-confirmed');
  const checkedEl = document.querySelector('#metric-res-checked');
  const pendingEl = document.querySelector('#metric-res-pending');
  if (confirmedEl) confirmedEl.textContent = allRows.filter(r => String(r.status).toUpperCase() === 'CONFIRMED').length;
  if (checkedEl) checkedEl.textContent = allRows.filter(r => String(r.status).toUpperCase() === 'CHECKED_IN').length;
  if (pendingEl) pendingEl.textContent = allRows.filter(r => String(r.status).toUpperCase() === 'PENDING').length;

  renderReservationFilterPills();

  // Filter rows based on active reservationFilter
  let rows = allRows;
  if (state.reservationFilter && state.reservationFilter !== 'ALL') {
    rows = rows.filter(r => String(r.status).toUpperCase() === state.reservationFilter);
  }

  const gridContainer = document.querySelector('#reservations-cards-grid');
  const tbody = document.querySelector('#reservations-table tbody');
  const now = new Date();

  // Render Grid Cards if container exists
  if (gridContainer) {
    if (rows.length === 0) {
      gridContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:#64748b" class="empty-state">Không tìm thấy lịch đặt bàn nào phù hợp</div>`;
    } else {
      gridContainer.innerHTML = rows.map(res => {
        const tableNumber = res.RestaurantTable?.tableNumber || res.table_id || '-';
        const customerName = res.User?.fullName || res.guestName || res.customerName || (res.user_id ? `#${res.user_id}` : 'Khách vãng lai');
        const phone = res.User?.phone || res.guestPhone || res.phone || '-';
        const status = String(res.status || 'PENDING').toUpperCase();

        const statusBadgeMap = {
          CONFIRMED: '<span class="res-status-badge st-confirmed"><i class="fa-solid fa-bolt"></i> Đã xác nhận</span>',
          CHECKED_IN: '<span class="res-status-badge st-checked-in"><i class="fa-solid fa-user-check"></i> Đã nhận bàn</span>',
          ARRIVED: '<span class="res-status-badge st-checked-in"><i class="fa-solid fa-user-check"></i> Đã nhận bàn</span>',
          CANCELLED: '<span class="res-status-badge st-cancelled"><i class="fa-solid fa-xmark"></i> Đã hủy</span>',
          PENDING: '<span class="res-status-badge st-pending"><i class="fa-solid fa-clock"></i> Chờ duyệt</span>'
        };

        const resDate = new Date(res.reservationTime);
        const diffMins = !isNaN(resDate) ? (now - resDate) / 60000 : null;

        let confirmBtnHtml = '';
        let checkinBtnHtml = '';
        let cancelBtnHtml = '';

        if (status === 'PENDING') {
          confirmBtnHtml = `<button class="btn btn-primary btn-small res-action-btn" data-action="confirm-reservation" data-id="${res.id}" title="Xác nhận đơn đặt bàn"><i class="fa-solid fa-check"></i> Duyệt</button>`;
          if (diffMins !== null && diffMins >= -30 && diffMins <= 30) {
            checkinBtnHtml = `<button class="btn btn-primary btn-small res-action-btn" data-action="checkin-reservation" data-id="${res.id}" title="Nhận bàn cho khách"><i class="fa-solid fa-user-check"></i> Nhận bàn</button>`;
          }
          cancelBtnHtml = `<button class="btn btn-danger btn-small res-action-btn" data-action="cancel-reservation" data-id="${res.id}" title="Hủy lịch đặt bàn"><i class="fa-solid fa-xmark"></i> Hủy</button>`;
        } else if (status === 'CONFIRMED') {
          if (diffMins !== null) {
            if (diffMins >= -30 && diffMins <= 30) {
              checkinBtnHtml = `<button class="btn btn-primary btn-small res-action-btn" data-action="checkin-reservation" data-id="${res.id}" title="Nhận bàn cho khách"><i class="fa-solid fa-user-check"></i> Nhận bàn</button>`;
            } else if (diffMins < -30) {
              checkinBtnHtml = `<span class="res-disabled-pill" title="Chỉ mở nút Nhận bàn trong khoảng 30 phút trước hoặc 30 phút sau giờ đặt bàn (${formatDateTime(res.reservationTime)})"><i class="fa-solid fa-clock"></i> Chưa tới giờ</span>`;
            } else {
              checkinBtnHtml = `<span class="res-disabled-pill" title="Đã trễ quá 30 phút so với giờ đặt bàn (${formatDateTime(res.reservationTime)})"><i class="fa-solid fa-triangle-exclamation"></i> Quá 30p</span>`;
            }
          } else {
            checkinBtnHtml = `<button class="btn btn-primary btn-small res-action-btn" data-action="checkin-reservation" data-id="${res.id}"><i class="fa-solid fa-user-check"></i> Nhận bàn</button>`;
          }
          cancelBtnHtml = `<button class="btn btn-danger btn-small res-action-btn" data-action="cancel-reservation" data-id="${res.id}" title="Hủy lịch đặt bàn"><i class="fa-solid fa-xmark"></i> Hủy</button>`;
        }

        return `
          <article class="reservation-card">
            <div class="reservation-header">
              <div class="guest-info">
                <div class="guest-avatar">
                  ${customerName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div class="guest-name">#${res.id} • ${escapeHtml(customerName)}</div>
                  <div class="guest-phone"><i class="fa-solid fa-phone"></i> ${escapeHtml(phone)}</div>
                </div>
              </div>
              ${statusBadgeMap[status] || status}
            </div>

            <div class="reservation-meta">
              <div class="res-meta-item">
                <span class="res-meta-label">Thời gian hẹn</span>
                <span class="res-meta-value"><i class="fa-regular fa-clock text-primary"></i> ${formatDateTime(res.reservationTime)}</span>
              </div>
              <div class="res-meta-item">
                <span class="res-meta-label">Vị trí & Khách</span>
                <span class="res-meta-value"><i class="fa-solid fa-chair text-amber"></i> Bàn #${tableNumber} • 👥 ${res.numberOfGuests || 1} người</span>
              </div>
            </div>

            ${res.note ? `<div class="res-note-box"><i class="fa-solid fa-quote-left"></i><span>"${escapeHtml(res.note)}"</span></div>` : ''}

            <div class="row-actions" style="margin-top:auto; display:flex; gap:0.5rem; justify-content:flex-end; align-items:center">
              ${confirmBtnHtml}
              ${checkinBtnHtml}
              ${cancelBtnHtml}
            </div>
          </article>
        `;
      }).join('');
    }
  }

  // Render Table if tbody exists
  if (tbody) {
    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:#64748b">Không tìm thấy lịch đặt bàn nào phù hợp</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(res => {
      const tableNumber = res.RestaurantTable?.tableNumber || res.table_id || '-';
      const customerName = res.User?.fullName || res.guestName || res.customerName || (res.user_id ? `#${res.user_id}` : 'Khách vãng lai');
      const phone = res.User?.phone || res.guestPhone || res.phone || '-';
      const status = String(res.status || 'PENDING').toUpperCase();

      const statusBadgeMap = {
        CONFIRMED: '<span class="res-status-badge st-confirmed"><i class="fa-solid fa-bolt"></i> Đã xác nhận</span>',
        CHECKED_IN: '<span class="res-status-badge st-checked-in"><i class="fa-solid fa-user-check"></i> Đã nhận bàn</span>',
        ARRIVED: '<span class="res-status-badge st-checked-in"><i class="fa-solid fa-user-check"></i> Đã nhận bàn</span>',
        CANCELLED: '<span class="res-status-badge st-cancelled"><i class="fa-solid fa-xmark"></i> Đã hủy</span>',
        PENDING: '<span class="res-status-badge st-pending"><i class="fa-solid fa-clock"></i> Chờ duyệt</span>'
      };

      const resDate = new Date(res.reservationTime);
      const diffMins = !isNaN(resDate) ? (now - resDate) / 60000 : null;

      let confirmBtnHtml = '';
      let checkinBtnHtml = '';
      let cancelBtnHtml = '';

      if (status === 'PENDING') {
        confirmBtnHtml = `<button class="btn btn-primary btn-small res-action-btn" data-action="confirm-reservation" data-id="${res.id}" title="Xác nhận đơn đặt bàn"><i class="fa-solid fa-check"></i> Duyệt</button>`;
        if (diffMins !== null && diffMins >= -30 && diffMins <= 30) {
          checkinBtnHtml = `<button class="btn btn-primary btn-small res-action-btn" data-action="checkin-reservation" data-id="${res.id}" title="Nhận bàn cho khách"><i class="fa-solid fa-user-check"></i> Nhận bàn</button>`;
        }
        cancelBtnHtml = `<button class="btn btn-danger btn-small res-action-btn" data-action="cancel-reservation" data-id="${res.id}" title="Hủy lịch đặt bàn"><i class="fa-solid fa-xmark"></i> Hủy</button>`;
      } else if (status === 'CONFIRMED') {
        if (diffMins !== null) {
          if (diffMins >= -30 && diffMins <= 30) {
            checkinBtnHtml = `<button class="btn btn-primary btn-small res-action-btn" data-action="checkin-reservation" data-id="${res.id}" title="Nhận bàn cho khách"><i class="fa-solid fa-user-check"></i> Nhận bàn</button>`;
          } else if (diffMins < -30) {
            checkinBtnHtml = `<span class="res-disabled-pill" title="Chỉ mở nút Nhận bàn trong khoảng 30 phút trước hoặc 30 phút sau giờ đặt bàn (${res.reservationTime})"><i class="fa-solid fa-clock"></i> Chưa tới giờ</span>`;
          } else {
            checkinBtnHtml = `<span class="res-disabled-pill" title="Đã trễ quá 30 phút so với giờ đặt bàn (${res.reservationTime})"><i class="fa-solid fa-triangle-exclamation"></i> Quá 30p</span>`;
          }
        } else {
          checkinBtnHtml = `<button class="btn btn-primary btn-small res-action-btn" data-action="checkin-reservation" data-id="${res.id}"><i class="fa-solid fa-user-check"></i> Nhận bàn</button>`;
        }
        cancelBtnHtml = `<button class="btn btn-danger btn-small res-action-btn" data-action="cancel-reservation" data-id="${res.id}" title="Hủy lịch đặt bàn"><i class="fa-solid fa-xmark"></i> Hủy</button>`;
      }

      return `
        <tr>
          <td><strong>#${res.id}</strong></td>
          <td><strong>${escapeHtml(customerName)}</strong></td>
          <td>${escapeHtml(phone)}</td>
          <td><strong>Bàn #${tableNumber}</strong></td>
          <td><strong>${res.numberOfGuests || 1} người</strong></td>
          <td>${escapeHtml(res.reservationTime || '-')}</td>
          <td>${statusBadgeMap[status] || status}</td>
          <td style="text-align:right">
            <div style="display:flex; gap:0.4rem; justify-content:flex-end; align-items:center">
              ${confirmBtnHtml}
              ${checkinBtnHtml}
              ${cancelBtnHtml}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
}

// 4. Tích điểm & Quản lý điểm khách hàng
function renderVipUsers(users) {
  const container = document.querySelector('#vip-users-list') || document.querySelector('#staff-vip-users-list');
  if (!container) return;

  const list = Array.isArray(users) ? users : [];
  const query = (state.userSearchQuery || '').trim().toLowerCase();

  let filtered = list;
  if (query) {
    filtered = filtered.filter(u =>
      (u.fullName || '').toLowerCase().includes(query) ||
      (u.phone || '').includes(query) ||
      (u.username || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      String(u.id).includes(query)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:2.5rem 1rem; color:#64748b; background:#ffffff">
          <i class="fa-solid fa-coins" style="font-size:2rem; color:#cbd5e1; margin-bottom:0.5rem; display:block"></i>
          <span style="font-weight:700; color:#334155; font-size:0.95rem">Không tìm thấy khách hàng nào phù hợp</span>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = filtered.map(user => {
    const points = Number(user.points || 0);
    const initials = (user.fullName || user.username || 'U').slice(0, 2).toUpperCase();

    return `
      <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.15s ease">
        <td style="padding:1rem; font-weight:700; color:#64748b">#${user.id}</td>
        <td style="padding:1rem">
          <div style="display:flex; align-items:center; gap:0.75rem">
            <div style="width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg,#004ac6,#3b82f6); color:#fff; font-weight:800; font-size:0.9rem; display:flex; align-items:center; justify-content:center; flex-shrink:0">
              ${initials}
            </div>
            <div>
              <strong style="display:block; color:#0f172a; font-size:0.95rem">${escapeHtml(user.fullName || user.username)}</strong>
              ${user.fullName && user.username ? `<span style="font-size:0.75rem; color:#94a3b8">@${escapeHtml(user.username)}</span>` : ''}
            </div>
          </div>
        </td>
        <td style="padding:1rem; color:#334155; font-size:0.9rem">
          <i class="fa-solid fa-phone" style="color:#94a3b8; font-size:0.8rem; margin-right:0.3rem"></i>
          <strong>${escapeHtml(user.phone || '-')}</strong>
        </td>
        <td style="padding:1rem; color:#64748b; font-size:0.88rem">
          ${escapeHtml(user.email || '-')}
        </td>
        <td style="padding:0.75rem 1rem">
          <div style="display:inline-flex; align-items:center; gap:0.4rem">
            <button class="btn btn-secondary btn-small" data-action="open-point-modal" data-type="add" data-id="${user.id}" data-name="${escapeHtml(user.fullName || user.username)}" data-phone="${escapeHtml(user.phone || '')}" data-current="${points}" title="Mở hộp thoại cộng điểm" style="font-weight:700; padding:0.35rem 0.65rem; font-size:0.82rem; color:#15803d; background:#dcfce7; border-color:#bbf7d0">
              <i class="fa-solid fa-plus"></i> Cộng điểm
            </button>
            <button class="btn btn-secondary btn-small" data-action="open-point-modal" data-type="deduct" data-id="${user.id}" data-name="${escapeHtml(user.fullName || user.username)}" data-phone="${escapeHtml(user.phone || '')}" data-current="${points}" title="Mở hộp thoại trừ điểm" style="font-weight:700; padding:0.35rem 0.65rem; font-size:0.82rem; color:#b91c1c; background:#fee2e2; border-color:#fecaca" ${points <= 0 ? 'disabled style="opacity:0.4; cursor:not-allowed"' : ''}>
              <i class="fa-solid fa-minus"></i> Trừ điểm
            </button>
          </div>
        </td>
        <td style="padding:1rem; text-align:right">
          <span style="display:inline-flex; align-items:center; gap:0.35rem; background:#eff6ff; border:1px solid #bfdbfe; color:#004ac6; padding:0.35rem 0.85rem; border-radius:999px; font-weight:800; font-size:0.95rem">
            <i class="fa-solid fa-coins text-amber" style="color:#d97706"></i>
            ${formatNumber(points)} <span style="font-size:0.8rem; font-weight:700">p</span>
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function setModalPointType(type) {
  const typeInput = document.querySelector('#modal-point-type');
  const btnAdd = document.querySelector('#toggle-type-add');
  const btnDeduct = document.querySelector('#toggle-type-deduct');
  if (typeInput) typeInput.value = type;

  if (type === 'add') {
    if (btnAdd) {
      btnAdd.style.background = '#ffffff';
      btnAdd.style.color = '#15803d';
      btnAdd.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
    }
    if (btnDeduct) {
      btnDeduct.style.background = 'transparent';
      btnDeduct.style.color = '#64748b';
      btnDeduct.style.boxShadow = 'none';
    }
  } else {
    if (btnAdd) {
      btnAdd.style.background = 'transparent';
      btnAdd.style.color = '#64748b';
      btnAdd.style.boxShadow = 'none';
    }
    if (btnDeduct) {
      btnDeduct.style.background = '#ffffff';
      btnDeduct.style.color = '#b91c1c';
      btnDeduct.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
    }
  }
  updateModalPointPreview();
}

function updateModalPointPreview() {
  const userId = document.querySelector('#modal-point-user-id')?.value;
  const type = document.querySelector('#modal-point-type')?.value || 'add';
  const val = parseInt(document.querySelector('#modal-point-input')?.value || '0', 10);
  const previewEl = document.querySelector('#modal-point-preview');
  if (!previewEl) return;

  const user = state.users.find(u => String(u.id) === String(userId));
  const current = user ? Number(user.points || 0) : 0;

  if (isNaN(val) || val <= 0) {
    previewEl.innerHTML = `${formatNumber(current)} p`;
    previewEl.style.color = '#004ac6';
    return;
  }

  if (type === 'add') {
    const after = current + val;
    previewEl.innerHTML = `<span style="color:#64748b">${formatNumber(current)}</span> <i class="fa-solid fa-arrow-right" style="font-size:0.75rem; color:#94a3b8"></i> <span style="color:#15803d; font-weight:900">${formatNumber(after)} p (+${formatNumber(val)})</span>`;
  } else {
    const after = Math.max(0, current - val);
    previewEl.innerHTML = `<span style="color:#64748b">${formatNumber(current)}</span> <i class="fa-solid fa-arrow-right" style="font-size:0.75rem; color:#94a3b8"></i> <span style="color:#b91c1c; font-weight:900">${formatNumber(after)} p (-${formatNumber(val)})</span>`;
  }
}

// 5. Render Metric Strip Summary
function renderMetrics(orders, tables, reservations) {
  const oList = Array.isArray(orders) ? orders : [];
  const tList = Array.isArray(tables) ? tables : [];
  const rList = Array.isArray(reservations) ? reservations : [];

  const pending = oList.filter(o => String(o.status).toUpperCase() === 'PENDING').length;
  const empty = tList.filter(t => String(t.calculatedStatus || t.status).toUpperCase() === 'AVAILABLE').length;
  const booked = tList.filter(t => String(t.calculatedStatus || t.status).toUpperCase() === 'BOOKED').length;
  const serving = tList.filter(t => String(t.calculatedStatus || t.status).toUpperCase() === 'OCCUPIED').length;
  const cleaning = tList.filter(t => String(t.calculatedStatus || t.status).toUpperCase() === 'CLEANING').length;
  const paidCount = oList.filter(o => String(o.paymentStatus).toUpperCase() === 'PAID').length;

  if (document.querySelector('#metric-pending')) document.querySelector('#metric-pending').textContent = formatNumber(pending);
  if (document.querySelector('#metric-empty')) document.querySelector('#metric-empty').textContent = formatNumber(empty);
  if (document.querySelector('#metric-booked')) document.querySelector('#metric-booked').textContent = formatNumber(booked);
  if (document.querySelector('#metric-serving')) document.querySelector('#metric-serving').textContent = formatNumber(serving);
  if (document.querySelector('#metric-cleaning')) document.querySelector('#metric-cleaning').textContent = formatNumber(cleaning);
  if (document.querySelector('#metric-pay')) document.querySelector('#metric-pay').textContent = formatNumber(paidCount);
}

// Open Staff Payment Checkout Modal
function openCheckoutModal(orderId, tableNumber, customerName, amount, itemsCount, status) {
  const st = String(status || '').toUpperCase();
  if (st && st !== 'READY' && st !== 'COMPLETED') {
    alert(`⚠️ Đơn hàng #${orderId} chưa hoàn thành chế biến! (Trạng thái hiện tại: ${st}).\nVui lòng chờ Bếp nấu xong và đổi trạng thái sang SẴN SÀNG (READY) trước khi thanh toán.`);
    return;
  }

  state.checkoutOrderId = orderId;
  state.checkoutAmount = Number(amount || 0);

  if (document.querySelector('#payment-modal-title')) document.querySelector('#payment-modal-title').textContent = `💳 Thanh toán Đơn hàng #${orderId}`;
  if (document.querySelector('#payment-modal-sub')) document.querySelector('#payment-modal-sub').textContent = `Vị trí: Bàn #${tableNumber} • Khách hàng: ${customerName}`;
  if (document.querySelector('#payment-modal-amount')) document.querySelector('#payment-modal-amount').textContent = formatCurrency(amount);
  if (document.querySelector('#payment-modal-items-count')) document.querySelector('#payment-modal-items-count').textContent = `${itemsCount || 0} món ăn trong đơn hàng`;

  if (document.querySelector('#cash-given-input')) document.querySelector('#cash-given-input').value = '';
  if (document.querySelector('#cash-change-text')) document.querySelector('#cash-change-text').textContent = '0 ₫';

  // Default to Cash tab
  switchPaymentTab('cash');

  if (document.querySelector('#staff-payment-modal')) document.querySelector('#staff-payment-modal').classList.remove('hidden');
}

function switchPaymentTab(tab) {
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

    initPayOSCheckout(state.checkoutOrderId);
  }
}

async function initPayOSCheckout(orderId) {
  if (!orderId) return;
  const qrImg = document.querySelector('#payos-qr-image');
  const statusTxt = document.querySelector('#payos-qr-status');
  const codeTxt = document.querySelector('#payos-order-code');
  const webBtn = document.querySelector('#btn-open-payos-url');

  if (statusTxt) statusTxt.textContent = '⏳ Đang kết nối liên kết thanh toán PayOS Backend...';

  try {
    const res = await api('/api/payos/create-payment-link', {
      method: 'POST',
      body: JSON.stringify({ orderId: Number(orderId) })
    });

    let qrUrl = '';
    if (res.qrCode && (res.qrCode.startsWith('http://') || res.qrCode.startsWith('https://') || res.qrCode.startsWith('data:image'))) {
      qrUrl = res.qrCode;
    } else if (res.qrCode) {
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(res.qrCode)}`;
    } else if (res.checkoutUrl) {
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(res.checkoutUrl)}`;
    } else {
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`PayOS-DH${orderId}`)}`;
    }

    if (qrImg) qrImg.src = qrUrl;
    if (statusTxt) statusTxt.textContent = `🟢 Mã QR PayOS đã sẵn sàng (Số HĐ: ${res.orderCode || orderId})`;
    if (codeTxt) codeTxt.textContent = `PAYOS-CODE: ${res.orderCode || orderId}`;
    if (webBtn && res.checkoutUrl) {
      webBtn.href = res.checkoutUrl;
      webBtn.style.display = 'inline-flex';
    }
  } catch (err) {
    console.warn('PayOS API info:', err);
    const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`AppDatMon-DH${orderId}-Amount-${state.checkoutAmount}`)}`;
    if (qrImg) qrImg.src = fallbackQr;
    if (statusTxt) statusTxt.textContent = `⚡ Mã QR Chuyển Khoản Trực Tiếp (DH #${orderId})`;
    if (codeTxt) codeTxt.textContent = `DH#${orderId} • ${formatCurrency(state.checkoutAmount)}`;
  }
}

// Global Event Delegate Handlers
function bindGlobalActions() {
  document.addEventListener('click', async event => {
    // Logout Action Button
    const logoutBtn = event.target.closest('[data-action="logout"], .admin-logout-button');
    if (logoutBtn) {
      if (confirm('Bạn chắc chắn muốn đăng xuất khỏi hệ thống nhân viên?')) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('appdatmon_admin_user');
        window.location.href = 'index.html';
      }
      return;
    }

    // Confirm Order Action (Chuyển trạng thái sang CONFIRMED để chuyển tiếp qua Bếp)
    const confirmOrderBtn = event.target.closest('[data-action="confirm-order"]');
    if (confirmOrderBtn) {
      const id = confirmOrderBtn.dataset.id;
      try {
        await api(`/api/orders/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'CONFIRMED' })
        });
        alert(`✅ Đã xác nhận Đơn hàng #${id}! Đơn đã được chuyển qua Bếp chế biến.`);
        await bootstrap();
      } catch (err) {
        alert(err.message || 'Không thể xác nhận đơn hàng');
      }
      return;
    }

    // Cancel Order Action (Chuyển trạng thái sang CANCELLED)
    const cancelOrderBtn = event.target.closest('[data-action="cancel-order"]');
    if (cancelOrderBtn) {
      const id = cancelOrderBtn.dataset.id;
      if (confirm(`Bạn chắc chắn muốn HỦY bỏ Đơn hàng #${id}?`)) {
        try {
          await api(`/api/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'CANCELLED' })
          });
          alert(`❌ Đã hủy bỏ Đơn hàng #${id}.`);
          await bootstrap();
        } catch (err) {
          alert(err.message || 'Không thể hủy đơn hàng');
        }
      }
      return;
    }

    // Toggle Order Detail Accordion
    const toggleDetailBtn = event.target.closest('[data-action="toggle-order-detail"]');
    if (toggleDetailBtn) {
      const id = toggleDetailBtn.dataset.id;
      const detailEl = document.querySelector(`[data-order-detail="${id}"]`);
      if (detailEl) {
        detailEl.classList.toggle('hidden');
        const icon = toggleDetailBtn.querySelector('i');
        if (icon) {
          icon.className = detailEl.classList.contains('hidden') ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
        }
      }
      return;
    }

    // Filter Pills
    const filterBtn = event.target.closest('[data-order-filter]');
    if (filterBtn) {
      state.orderFilter = filterBtn.dataset.orderFilter;
      renderOrdersGrid(state.orders);
      return;
    }

    // Reservation Filter Pills
    const resFilterBtn = event.target.closest('[data-action="filter-reservation"]');
    if (resFilterBtn) {
      state.reservationFilter = resFilterBtn.dataset.status;
      renderReservationsTable(state.reservations);
      return;
    }

    // Open Checkout Modal
    const checkoutBtn = event.target.closest('[data-action="open-checkout-modal"]');
    if (checkoutBtn) {
      const id = checkoutBtn.dataset.id;
      const tableNumber = checkoutBtn.dataset.table;
      const customerName = checkoutBtn.dataset.customer;
      const amount = checkoutBtn.dataset.amount;
      const itemsCount = checkoutBtn.dataset.items;
      openCheckoutModal(id, tableNumber, customerName, amount, itemsCount);
      return;
    }

    // Payment Tabs
    if (event.target.closest('#tab-pay-cash')) {
      switchPaymentTab('cash');
      return;
    }
    if (event.target.closest('#tab-pay-payos')) {
      switchPaymentTab('payos');
      return;
    }

    // Confirm Cash Paid
    if (event.target.closest('#btn-confirm-cash-paid')) {
      if (!state.checkoutOrderId) return;
      try {
        await api(`/api/orders/${state.checkoutOrderId}/pay`, {
          method: 'PUT',
          body: JSON.stringify({ paymentMethod: 'CASH' })
        });
        if (document.querySelector('#staff-payment-modal')) document.querySelector('#staff-payment-modal').classList.add('hidden');
        alert(`Đã thanh toán TIỀN MẶT thành công cho Đơn hàng #${state.checkoutOrderId}!`);
        await bootstrap();
      } catch (err) {
        alert(err.message || 'Không thể xác nhận thanh toán tiền mặt');
      }
      return;
    }

    // Confirm Bank Transfer Paid
    if (event.target.closest('#btn-confirm-transfer-paid')) {
      if (!state.checkoutOrderId) return;
      try {
        await api(`/api/orders/${state.checkoutOrderId}/pay`, {
          method: 'PUT',
          body: JSON.stringify({ paymentMethod: 'BANK_TRANSFER' })
        });
        if (document.querySelector('#staff-payment-modal')) document.querySelector('#staff-payment-modal').classList.add('hidden');
        alert(`Đã xác nhận thanh toán CHUYỂN KHOẢN thành công cho Đơn hàng #${state.checkoutOrderId}!`);
        await bootstrap();
      } catch (err) {
        alert(err.message || 'Không thể xác nhận thanh toán chuyển khoản');
      }
      return;
    }

    // Check PayOS Status
    if (event.target.closest('#btn-check-payos-status')) {
      if (!state.checkoutOrderId) return;
      try {
        const statusRes = await api(`/api/payos/check-status/${state.checkoutOrderId}`);
        alert(`Trạng thái PayOS: ${statusRes.status || 'Chưa nhận thanh toán'}`);
        if (statusRes.status === 'PAID') {
          if (document.querySelector('#staff-payment-modal')) document.querySelector('#staff-payment-modal').classList.add('hidden');
          await bootstrap();
        }
      } catch (err) {
        alert('Chưa nhận được giao dịch từ PayOS: ' + err.message);
      }
      return;
    }

    // Close Payment Modal
    if (event.target.closest('#close-staff-payment-modal')) {
      if (document.querySelector('#staff-payment-modal')) document.querySelector('#staff-payment-modal').classList.add('hidden');
      return;
    }

    // Open Table QR Code Generator Modal
    const qrTableBtn = event.target.closest('[data-action="open-table-qr-modal"]');
    if (qrTableBtn) {
      const tableNumber = qrTableBtn.dataset.number || '1';
      const capacity = qrTableBtn.dataset.capacity || 4;
      const targetUrl = qrTableBtn.dataset.url || '';
      const qrImg = qrTableBtn.dataset.img || `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(targetUrl)}`;
      const code = qrTableBtn.dataset.code || `TABLE_${tableNumber}`;

      let modal = document.querySelector('#table-qr-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'table-qr-modal';
        modal.className = 'modal-backdrop';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="modal-card" style="max-width:440px; text-align:center; background:#ffffff">
          <div class="modal-head">
            <div>
              <h3 class="modal-title"><i class="fa-solid fa-qrcode text-accent" style="margin-right:0.4rem"></i>Mã QR Bàn #${tableNumber}</h3>
              <div class="subtle">Quét mã QR để truy cập thực đơn và đặt món trực tuyến</div>
            </div>
            <button type="button" class="btn btn-ghost btn-small" id="close-table-qr-modal"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body" style="padding:1rem 0; display:grid; gap:1.1rem">
            <div style="background:#ffffff; padding:1.4rem; border-radius:22px; border:2px solid #3b82f6; box-shadow:0 10px 30px rgba(0,74,198,0.12)">
              <div style="font-weight:900; font-size:1.15rem; color:#004ac6; margin-bottom:0.2rem; letter-spacing:0.5px">FUTURESUSHI RESTAURANT</div>
              <div style="font-size:0.8rem; color:#64748b; margin-bottom:0.9rem">Hệ Thống Đặt Món Thông Minh Tại Bàn</div>
              <img id="table-qr-image" src="${qrImg}" alt="Mã QR Bàn #${tableNumber}" style="width:220px; height:220px; border-radius:14px; margin:0 auto; display:block; border:1px solid #cbd5e1; box-shadow:0 4px 14px rgba(0,0,0,0.06)" />
              <div style="margin-top:0.9rem; font-weight:800; font-size:1.1rem; color:#111c2d" id="table-qr-subtext">Bàn #${tableNumber} • Sức chứa ${capacity} người</div>
              <div style="font-size:0.82rem; color:#64748b; margin-top:0.2rem">Mã định danh: <code>${code}</code></div>
              <code style="display:block; margin-top:0.6rem; background:#f1f5f9; padding:0.45rem; border-radius:8px; font-size:0.75rem; word-break:break-all; border:1px solid #e2e8f0" id="table-qr-url-text">${targetUrl}</code>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem">
              <button type="button" class="btn btn-secondary" data-action="copy-table-url" data-url="${targetUrl}" style="padding:0.65rem; font-size:0.88rem"><i class="fa-regular fa-copy"></i> Sao chép link</button>
              <a id="btn-download-table-qr" class="btn btn-primary" href="${qrImg}" download="Ma_QR_Ban_${tableNumber}.png" target="_blank" style="padding:0.65rem; font-size:0.88rem"><i class="fa-solid fa-download"></i> Tải ảnh QR</a>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem">
              <button type="button" class="btn btn-secondary" onclick="window.print()" style="padding:0.65rem; font-size:0.88rem"><i class="fa-solid fa-print"></i> In mã QR</button>
              <a class="btn btn-ghost" href="${targetUrl}" target="_blank" style="padding:0.65rem; font-size:0.88rem; border:1px solid #cbd5e1"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở Menu Web</a>
            </div>
          </div>
        </div>
      `;
      modal.classList.remove('hidden');
      return;
    }

    // Close Table QR Modal
    if (event.target.closest('#close-table-qr-modal') || event.target.matches('#table-qr-modal')) {
      const modal = document.querySelector('#table-qr-modal');
      if (modal) modal.classList.add('hidden');
      return;
    }

    // Toggle Staff Table Detail Drawer
    const toggleTableBtn = event.target.closest('[data-action="toggle-staff-table-detail"]');
    if (toggleTableBtn) {
      const tableId = toggleTableBtn.dataset.id;
      const detailEl = document.querySelector(`[data-staff-table-detail="${tableId}"]`);
      if (detailEl) detailEl.classList.toggle('hidden');
      return;
    }

    // Copy Table QR URL
    const copyUrlBtn = event.target.closest('[data-action="copy-table-url"]');
    if (copyUrlBtn) {
      const url = copyUrlBtn.dataset.url;
      if (url) {
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(url).then(() => {
            alert('Đã sao chép liên kết gọi món bàn!');
          }).catch(() => {
            prompt('Sao chép liên kết gọi món bàn:', url);
          });
        } else {
          prompt('Sao chép liên kết gọi món bàn:', url);
        }
      }
      return;
    }

    // Confirm Reservation
    const confirmResBtn = event.target.closest('[data-action="confirm-reservation"]');
    if (confirmResBtn) {
      const resId = confirmResBtn.dataset.id;
      try {
        await api(`/api/reservations/${resId}/confirm`, { method: 'PUT' });
        alert(`Đã xác nhận thành công đơn đặt bàn #${resId}!`);
        await bootstrap();
      } catch (err) {
        alert(err.message || 'Không thể xác nhận đặt bàn');
      }
      return;
    }

    // Check-in Reservation
    const checkinBtn = event.target.closest('[data-action="checkin-reservation"]');
    if (checkinBtn) {
      const resId = checkinBtn.dataset.id;
      try {
        await api(`/api/reservations/${resId}/check-in`, { method: 'PUT' });
        alert(`Đã Check-in thành công cho lịch đặt bàn #${resId}!`);
        await bootstrap();
      } catch (err) {
        alert(err.message || 'Không thể Check-in đặt bàn');
      }
      return;
    }

    // Cancel Reservation
    const cancelResBtn = event.target.closest('[data-action="cancel-reservation"]');
    if (cancelResBtn) {
      const resId = cancelResBtn.dataset.id;
      if (confirm(`Bạn có chắc chắn muốn HỦY lịch đặt bàn #${resId}?`)) {
        try {
          await api(`/api/reservations/${resId}/cancel`, { method: 'PUT' });
          alert(`Đã hủy lịch đặt bàn #${resId}!`);
          await bootstrap();
        } catch (err) {
          alert(err.message || 'Không thể hủy đặt bàn');
        }
      }
      return;
    }

    // Open Adjust Points Dialog Modal
    const openPointBtn = event.target.closest('[data-action="open-point-modal"]');
    if (openPointBtn) {
      const userId = openPointBtn.dataset.id;
      const userName = openPointBtn.dataset.name || 'Khách hàng';
      const userPhone = openPointBtn.dataset.phone ? `(${openPointBtn.dataset.phone})` : '';
      const currentPoints = Number(openPointBtn.dataset.current || 0);
      const type = openPointBtn.dataset.type || 'add';

      const modal = document.querySelector('#staff-adjust-points-modal');
      if (modal) {
        document.querySelector('#modal-point-user-id').value = userId;
        document.querySelector('#modal-point-user-name').textContent = `${userName} ${userPhone} • ID: #${userId}`;
        document.querySelector('#modal-point-current').textContent = `${formatNumber(currentPoints)} p`;
        
        setModalPointType(type);
        const pointInput = document.querySelector('#modal-point-input');
        pointInput.value = '';
        updateModalPointPreview();

        modal.classList.remove('hidden');
        setTimeout(() => pointInput.focus(), 100);
      }
      return;
    }

    // Toggle Modal Point Type (Add / Deduct)
    const pointTypeBtn = event.target.closest('.point-type-btn');
    if (pointTypeBtn) {
      setModalPointType(pointTypeBtn.dataset.type);
      return;
    }

    // Close Adjust Points Modal
    if (event.target.closest('[data-action="close-point-modal"]')) {
      const modal = document.querySelector('#staff-adjust-points-modal');
      if (modal) modal.classList.add('hidden');
      return;
    }
  });

  // Handle Form Adjust User Points Submit
  const adjustPointForm = document.querySelector('#form-adjust-user-points');
  if (adjustPointForm) {
    // Live update preview on input
    const pointInput = document.querySelector('#modal-point-input');
    if (pointInput) {
      pointInput.addEventListener('input', () => updateModalPointPreview());
    }

    adjustPointForm.addEventListener('submit', async e => {
      e.preventDefault();
      const userId = document.querySelector('#modal-point-user-id').value;
      const type = document.querySelector('#modal-point-type').value;
      const value = parseInt(document.querySelector('#modal-point-input').value || '0', 10);
      const userInState = state.users.find(u => String(u.id) === String(userId));
      const currentPoints = userInState ? Number(userInState.points || 0) : 0;

      if (isNaN(value) || value <= 0) {
        alert('Vui lòng nhập số điểm hợp lệ lớn hơn 0');
        return;
      }

      let newPoints = currentPoints;
      if (type === 'add') {
        newPoints = currentPoints + value;
      } else if (type === 'deduct') {
        newPoints = Math.max(0, currentPoints - value);
      }

      try {
        await api(`/api/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify({ points: newPoints })
        });
        if (userInState) userInState.points = newPoints;
        renderVipUsers(state.users);
        const modal = document.querySelector('#staff-adjust-points-modal');
        if (modal) modal.classList.add('hidden');
        alert(`Đã ${type === 'add' ? `cộng +${formatNumber(value)}` : `trừ ${formatNumber(value)}`} điểm thành công! Tổng điểm mới: ${formatNumber(newPoints)} p`);
        await bootstrap();
      } catch (err) {
        alert(err.message || 'Không thể điều chỉnh điểm');
      }
    });
  }

  // Handle Add Order Points Form Submit (/api/points/add-points)
  const orderPointsForm = document.querySelector('#form-add-order-points');
  if (orderPointsForm) {
    orderPointsForm.addEventListener('submit', async e => {
      e.preventDefault();
      const phoneInput = document.querySelector('#order-points-phone');
      const orderIdInput = document.querySelector('#order-points-order-id');
      const alertEl = document.querySelector('#order-points-alert');

      const phone = phoneInput ? phoneInput.value.trim() : '';
      const orderId = orderIdInput ? orderIdInput.value.trim() : '';

      try {
        const res = await api('/api/points/add-points', {
          method: 'POST',
          body: JSON.stringify({ phone, orderId: Number(orderId) })
        });
        if (alertEl) {
          alertEl.className = '';
          alertEl.style.display = 'flex';
          alertEl.style.background = '#dcfce7';
          alertEl.style.color = '#15803d';
          alertEl.style.border = '1px solid #bbf7d0';
          alertEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${escapeHtml(res.message || 'Tích điểm thành công!')} (Cộng +${formatNumber(res.earnedPoints || 0)} điểm • Tổng điểm mới: ${formatNumber(res.totalPoints || 0)} p)</span>`;
        }
        orderPointsForm.reset();
        await bootstrap();
      } catch (err) {
        if (alertEl) {
          alertEl.className = '';
          alertEl.style.display = 'flex';
          alertEl.style.background = '#fee2e2';
          alertEl.style.color = '#b91c1c';
          alertEl.style.border = '1px solid #fecaca';
          alertEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <span>${escapeHtml(err.message || 'Không thể tích điểm từ đơn hàng này')}</span>`;
        }
      }
    });
  }

  // Calculate Cash Change live
  document.addEventListener('input', event => {
    if (event.target.id === 'cash-given-input') {
      const given = Number(event.target.value || 0);
      const needed = state.checkoutAmount || 0;
      const change = Math.max(0, given - needed);
      if (document.querySelector('#cash-change-text')) {
        document.querySelector('#cash-change-text').textContent = formatCurrency(change);
      }
    }
  });

  // Change Order Status Select
  document.addEventListener('change', async event => {
    const select = event.target.closest('[data-action="change-order-status"]');
    if (select) {
      const orderId = select.dataset.id;
      const newStatus = select.value;
      try {
        await api(`/api/orders/${orderId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        });
        await bootstrap();
      } catch (err) {
        alert(err.message || 'Không thể cập nhật trạng thái đơn');
      }
      return;
    }

    // Change Table Status Select
    const tSelect = event.target.closest('[data-action="change-table-status"]');
    if (tSelect) {
      const tableId = tSelect.dataset.id;
      const newStatus = tSelect.value;
      try {
        await api(`/api/tables/${tableId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        });
        await bootstrap();
      } catch (err) {
        alert(err.message || 'Không thể cập nhật trạng thái bàn');
      }
      return;
    }
  });

  // Live Search Filters
  const staffSearchInput = document.querySelector('#staff-search-input');
  if (staffSearchInput) {
    staffSearchInput.addEventListener('input', e => {
      const q = (e.target.value || '').trim().toLowerCase();
      state.userSearchQuery = q;
      if (!q) {
        renderOrdersGrid(state.orders);
        renderTablesGrid(state.tables);
        renderReservationsTable(state.reservations);
        renderVipUsers(state.users);
        return;
      }
      const filteredOrders = state.orders.filter(o => {
        const tInfo = getOrderTableInfo(o, state.tables);
        return (
          String(o.id).includes(q) ||
          (o.User?.fullName || '').toLowerCase().includes(q) ||
          tInfo.label.toLowerCase().includes(q) ||
          String(tInfo.tableNumber || '').includes(q) ||
          (o.note || '').toLowerCase().includes(q)
        );
      });
      renderOrdersGrid(filteredOrders);

      const filteredTables = state.tables.filter(t =>
        String(t.tableNumber || t.id).includes(q)
      );
      renderTablesGrid(filteredTables);

      const filteredRes = state.reservations.filter(r =>
        String(r.id).includes(q) ||
        (r.User?.fullName || r.customerName || '').toLowerCase().includes(q) ||
        (r.User?.phone || r.phone || '').includes(q) ||
        String(r.RestaurantTable?.tableNumber || r.table_id || '').includes(q)
      );
      renderReservationsTable(filteredRes);

      renderVipUsers(state.users);
    });
  }

  const userPointsSearch = document.querySelector('#user-points-search');
  if (userPointsSearch) {
    userPointsSearch.addEventListener('input', e => {
      state.userSearchQuery = (e.target.value || '').trim().toLowerCase();
      renderVipUsers(state.users);
    });
  }

  // Refresh CTA Button
  const refreshBtn = document.querySelector('#btn-refresh-staff');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => bootstrap());
  }

  // Real-time Live Clock
  setInterval(() => {
    const clockEl = document.querySelector('#live-clock-text');
    if (clockEl) {
      clockEl.textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }, 1000);
}

// Bootstrap Data Sync with Backend APIs
async function bootstrap() {
  try {
    const [orders, tables, users, reservations] = await Promise.all([
      api('/api/orders').catch(() => []),
      api('/api/tables').catch(() => []),
      api('/api/users').catch(() => []),
      api('/api/reservations').catch(() => [])
    ]);

    state.orders = Array.isArray(orders) ? orders : [];
    state.tables = Array.isArray(tables) ? tables : [];
    state.users = Array.isArray(users) ? users : [];
    state.reservations = Array.isArray(reservations) ? reservations : [];

    renderMetrics(state.orders, state.tables, state.reservations);
    renderOrdersGrid(state.orders);
    renderTablesGrid(state.tables);
    renderReservationsTable(state.reservations);
    renderVipUsers(state.users);
  } catch (error) {
    console.error('Bootstrap staff error:', error);
  }
}

// Initialize Event Delegation & Clock
bindGlobalActions();

// Initial Data Bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootstrap();
  });
} else {
  bootstrap();
}

// Auto polling refresh every 10 seconds
setInterval(() => {
  bootstrap();
}, 10000);
