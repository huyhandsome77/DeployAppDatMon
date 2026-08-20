const API_BASE_URL = (window.ADMIN_API_BASE_URL || localStorage.getItem('appdatmon_admin_api_base') || 'http://localhost:3000').replace(/\/$/, '');
const TOKEN_KEY = 'appdatmon_admin_token';

let kitchenOrders = [];
let state = {
  dateFilter: getTodayDateString(),
  searchQuery: ''
};

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
      const error = new Error(body?.message || body?.error || raw || 'Request failed');
      error.status = res.status;
      throw error;
    }
    return body;
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, match => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[match];
  });
}

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOrderLocalDateStr(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof dateVal === 'string' && dateVal.length >= 10) {
    return dateVal.slice(0, 10);
  }
  return '';
}

function formatTime(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// Map order status to kitchen board columns:
// - PENDING / CONFIRMED -> Chờ chế biến (todo)
// - PREPARING -> Đang làm (doing)
// - READY -> Hoàn thành / Sẵn sàng (done)
// - COMPLETED / CANCELLED -> null (Không hiển thị trên bảng Bếp để tránh đầy màn hình)
function getBoardState(order) {
  const st = String(order.status || '').toUpperCase();
  if (['PENDING', 'CONFIRMED'].includes(st)) return 'todo';
  if (['PREPARING'].includes(st)) return 'doing';
  if (['READY'].includes(st)) return 'done';
  return null;
}

function renderBoard(orders) {
  const boards = {
    todo: document.querySelector('#board-todo'),
    doing: document.querySelector('#board-doing'),
    done: document.querySelector('#board-done')
  };

  if (!boards.todo || !boards.doing || !boards.done) return;

  for (const key of Object.keys(boards)) {
    boards[key].innerHTML = '';
  }

  const list = Array.isArray(orders) ? orders : [];
  const q = (state.searchQuery || '').trim().toLowerCase();
  const dateFilter = state.dateFilter;

  // 1. Filter by Date (Hiển thị theo ngày đã chọn)
  let filtered = list;
  if (dateFilter) {
    filtered = filtered.filter(order => {
      const rawDate = order.created_at || order.createdAt || order.orderDate || order.updated_at || order.updatedAt;
      const orderDate = getOrderLocalDateStr(rawDate);
      return orderDate === dateFilter;
    });
  }

  // 2. Filter by Search Query
  if (q) {
    filtered = filtered.filter(order => {
      const idMatch = String(order.id).includes(q);
      const tableMatch = String(order.RestaurantTable?.tableNumber || order.table_id || order.tableNumber || '').includes(q);
      const noteMatch = (order.note || '').toLowerCase().includes(q);
      const itemMatch = (order.OrderItems || []).some(item => (item.Product?.name || '').toLowerCase().includes(q));
      const customerMatch = (order.User?.fullName || '').toLowerCase().includes(q);
      return idMatch || tableMatch || noteMatch || itemMatch || customerMatch;
    });
  }

  // 3. Group by Kanban Column (Chỉ gom PENDING/CONFIRMED, PREPARING, READY; loại trừ COMPLETED & CANCELLED)
  const grouped = filtered.reduce((acc, order) => {
    const boardKey = getBoardState(order);
    if (boardKey && acc[boardKey]) {
      acc[boardKey].push(order);
    }
    return acc;
  }, { todo: [], doing: [], done: [] });

  // Update Counters
  if (document.querySelector('#todo-count')) document.querySelector('#todo-count').textContent = String(grouped.todo.length);
  if (document.querySelector('#doing-count')) document.querySelector('#doing-count').textContent = String(grouped.doing.length);
  if (document.querySelector('#done-count')) document.querySelector('#done-count').textContent = String(grouped.done.length);

  // Render each column
  Object.entries(grouped).forEach(([key, items]) => {
    if (!items.length) {
      let emptyText = 'Chưa có món trong danh mục này';
      if (key === 'done') emptyText = 'Chưa có món Sẵn sàng (READY)';
      boards[key].innerHTML = `<div class="empty-note"><i class="fa-solid fa-inbox" style="font-size:1.5rem; display:block; margin-bottom:0.4rem; color:#cbd5e1"></i>${emptyText}</div>`;
      return;
    }

    boards[key].innerHTML = items.map(order => {
      const tableNumber = order.RestaurantTable?.tableNumber || order.table?.tableNumber || order.tableNumber || order.table_id || '-';
      const customerName = order.User?.fullName || (order.user_id ? `#${order.user_id}` : 'Khách vãng lai');
      const rawDate = order.created_at || order.createdAt || order.orderDate || order.updated_at || order.updatedAt;
      const timeDisplay = formatTime(rawDate);
      const orderItems = order.OrderItems || [];

      const itemsList = orderItems.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.35rem 0; border-bottom:1.5px dashed rgba(115,118,134,0.12)">
          <strong style="color:#111c2d; font-size:0.95rem">${escapeHtml(item.Product?.name || `#${item.product_id}`)}</strong>
          <span class="badge-inline" style="background:#dbe1ff; color:#004ac6; font-weight:800; font-size:0.85rem">x${item.quantity}</span>
        </div>
      `).join('');

      let actionBtn = '';
      if (key === 'todo') {
        actionBtn = `
          <button type="button" class="btn btn-primary btn-small" data-action="update-kitchen-status" data-id="${order.id}" data-target="PREPARING" style="width:100%; margin-top:0.8rem; background:linear-gradient(135deg, #e11d48, #f43f5e); font-weight:800">
            <i class="fa-solid fa-fire"></i> Bắt đầu làm món
          </button>
        `;
      } else if (key === 'doing') {
        actionBtn = `
          <button type="button" class="btn btn-primary btn-small" data-action="update-kitchen-status" data-id="${order.id}" data-target="READY" style="width:100%; margin-top:0.8rem; background:linear-gradient(135deg, #10b981, #059669); font-weight:800">
            <i class="fa-solid fa-circle-check"></i> Báo Hoàn thành (READY)
          </button>
        `;
      } else {
        actionBtn = `
          <div style="text-align:center; font-size:0.85rem; color:#10b981; font-weight:800; margin-top:0.6rem; padding:0.4rem; background:#ecfdf5; border-radius:8px; border:1px solid #a7f3d0">
            <i class="fa-solid fa-circle-check"></i> Đã nấu xong • Sẵn sàng phục vụ
          </div>
        `;
      }

      return `
        <div class="kanban-card" draggable="true" data-order-id="${order.id}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
            <strong style="font-size:1.05rem; color:#004ac6">Đơn #${order.id}</strong>
            <span class="badge-inline" style="background:#f1f5f9; color:#0f172a; font-weight:800"><i class="fa-solid fa-utensils"></i> Bàn #${tableNumber}</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:#64748b; margin-bottom:0.6rem">
            <span>Khách: <strong>${escapeHtml(customerName)}</strong></span>
            ${timeDisplay ? `<span style="font-weight:700; color:#0f172a"><i class="fa-regular fa-clock"></i> ${timeDisplay}</span>` : ''}
          </div>

          <div class="kanban-items-box">
            ${itemsList || '<div style="color:#94a3b8">Không có chi tiết món</div>'}
          </div>

          ${order.note ? `
            <div style="margin-top:0.6rem; padding:0.5rem; background:#fff7d6; border-radius:10px; border:1px solid #fef08a; font-size:0.82rem; color:#b45309">
              <i class="fa-solid fa-note-sticky"></i> <strong>Ghi chú:</strong> ${escapeHtml(order.note)}
            </div>
          ` : ''}

          ${actionBtn}
        </div>
      `;
    }).join('');
  });
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    await api(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    await bootstrap();
  } catch (error) {
    alert(error.message || 'Không thể cập nhật trạng thái bếp');
  }
}

function bindActions() {
  // Drag and drop handlers
  document.addEventListener('dragstart', event => {
    const card = event.target.closest('.kanban-card');
    if (!card) return;
    event.dataTransfer.setData('text/plain', card.dataset.orderId);
  });

  document.querySelectorAll('.kanban-list').forEach(list => {
    list.addEventListener('dragover', event => event.preventDefault());
    list.addEventListener('drop', async event => {
      event.preventDefault();
      const orderId = event.dataTransfer.getData('text/plain');
      const statusMap = {
        'board-todo': 'PENDING',
        'board-doing': 'PREPARING',
        'board-done': 'READY'
      };
      const newStatus = statusMap[list.id] || 'PENDING';
      await updateOrderStatus(orderId, newStatus);
    });
  });

  // Click handler for 1-click status update buttons
  document.addEventListener('click', async event => {
    const btn = event.target.closest('[data-action="update-kitchen-status"]');
    if (btn) {
      const orderId = btn.dataset.id;
      const targetStatus = btn.dataset.target;
      await updateOrderStatus(orderId, targetStatus);
      return;
    }

    const logoutBtn = event.target.closest('[data-action="logout"]');
    if (logoutBtn) {
      if (confirm('Bạn chắc chắn muốn đăng xuất khỏi bộ phận Bếp?')) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('appdatmon_admin_user');
        window.location.assign('./index.html');
      }
      return;
    }

    // Today filter shortcut button
    if (event.target.closest('#btn-kitchen-today')) {
      const today = getTodayDateString();
      state.dateFilter = today;
      const picker = document.querySelector('#kitchen-date-picker');
      if (picker) picker.value = today;
      renderBoard(kitchenOrders);
      return;
    }

    // All dates filter shortcut button
    if (event.target.closest('#btn-kitchen-all-dates')) {
      state.dateFilter = '';
      const picker = document.querySelector('#kitchen-date-picker');
      if (picker) picker.value = '';
      renderBoard(kitchenOrders);
      return;
    }
  });

  // Date picker change listener
  const datePicker = document.querySelector('#kitchen-date-picker');
  if (datePicker) {
    datePicker.value = state.dateFilter;
    datePicker.addEventListener('change', e => {
      state.dateFilter = e.target.value;
      renderBoard(kitchenOrders);
    });
  }

  // Live Search in Kitchen
  const kitchenSearchInput = document.querySelector('#kitchen-search-input');
  if (kitchenSearchInput) {
    kitchenSearchInput.addEventListener('input', e => {
      state.searchQuery = (e.target.value || '').trim();
      renderBoard(kitchenOrders);
    });
  }

  // Real-time Live Clock
  setInterval(() => {
    const clockEl = document.querySelector('#live-clock-text');
    if (clockEl) {
      clockEl.textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }, 1000);

  // Auto refresh every 8 seconds for real-time kitchen updates
  setInterval(() => bootstrap(), 8000);
}

async function bootstrap() {
  try {
    const orders = await api('/api/orders');
    kitchenOrders = Array.isArray(orders) ? orders : [];
    renderBoard(kitchenOrders);
  } catch (error) {
    const fallback = `<div class="empty-note">${error.message}</div>`;
    if (document.querySelector('#board-todo')) document.querySelector('#board-todo').innerHTML = fallback;
    if (document.querySelector('#board-doing')) document.querySelector('#board-doing').innerHTML = fallback;
    if (document.querySelector('#board-done')) document.querySelector('#board-done').innerHTML = fallback;
  }
}

// Immediate launch
bindActions();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootstrap();
  });
} else {
  bootstrap();
}
