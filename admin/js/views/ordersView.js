// Modular Orders View (Giao diện Quản lý Đơn hàng & Modal Thanh Toán)
import { formatCurrency, formatDateTime, statusChip, paymentStatusClass, escapeHtml } from '../utils.js';
import { api } from '../api.js';

export function getOrderTableInfo(order, tables = []) {
  if (!order) {
    return {
      tableNumber: null,
      label: 'Mang đi',
      isTakeaway: true,
      displayBadge: '<span class="order-table-chip takeaway"><i class="fa-solid fa-bag-shopping"></i> Mang đi</span>'
    };
  }

  // 1. Check direct object associations
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
    const tableList = Array.isArray(tables) && tables.length ? tables : (window.__tablesList || []);
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

export function renderOrdersGrid(records, activeFilter = 'ALL', tables = []) {
  if (!records || records.length === 0) {
    return `<div class="empty-state"><strong>Không có đơn hàng phù hợp</strong></div>`;
  }

  let filtered = records;
  if (activeFilter && activeFilter !== 'ALL') {
    filtered = records.filter(o => {
      const st = String(o.status || '').toUpperCase();
      const pst = String(o.paymentStatus || '').toUpperCase();
      if (activeFilter === 'UNPAID') return pst === 'UNPAID';
      return st === activeFilter;
    });
  }

  if (filtered.length === 0) {
    return `<div class="empty-state"><strong>Không tìm thấy đơn hàng ở trạng thái này</strong></div>`;
  }

  return `
    <div class="orders-grid">
      ${filtered.map(order => {
        const tableInfo = getOrderTableInfo(order, tables);
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
                <button type="button" class="btn btn-primary btn-small" data-action="open-admin-checkout" data-id="${order.id}" data-table="${tableInfo.tableNumber || ''}" data-customer="${escapeHtml(customerName)}" data-amount="${order.finalPrice ?? order.totalPrice}" data-items="${itemsCount}" data-status="${rawStatus}" style="font-weight:800; flex:1; padding:0.45rem 0.75rem; background:linear-gradient(135deg, #15803d, #16a34a)" title="Món đã sẵn sàng! Bấm để thu tiền">
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
      }).join('')}
    </div>
  `;
}

export async function generatePayOSQRUrl(orderId, amount) {
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

    return {
      qrUrl,
      orderCode: res.orderCode || orderId,
      checkoutUrl: res.checkoutUrl || null
    };
  } catch (err) {
    console.warn('PayOS API Fallback:', err);
    return {
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`AppDatMon-DH${orderId}-Amount-${amount}`)}`,
      orderCode: orderId,
      checkoutUrl: null
    };
  }
}
