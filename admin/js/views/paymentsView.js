// Modular Payments View (Giao diện Quản lý Thanh toán Cao cấp)
import { formatCurrency, formatDateTime, escapeHtml } from '../utils.js';
import { getOrderTableInfo } from './ordersView.js';

export function renderPaymentsGrid(records, activeFilter = 'ALL', tables = []) {
  if (!records || records.length === 0) {
    return `
      <div class="empty-state" style="padding: 3.5rem 1.5rem; text-align: center; background: #ffffff; border-radius: 20px; border: 1px dashed #cbd5e1; margin-top: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
        <div style="width: 60px; height: 60px; background: #eff6ff; color: #3b82f6; border-radius: 50%; display: grid; place-items: center; font-size: 1.8rem; margin: 0 auto 1rem auto;">
          <i class="fa-solid fa-receipt"></i>
        </div>
        <h3 style="color: #1e293b; font-size: 1.15rem; font-weight: 800; margin-bottom: 0.35rem;">Chưa có lịch sử giao dịch nào</h3>
        <p style="color: #64748b; font-size: 0.88rem;">Các hóa đơn thanh toán tiền mặt và chuyển khoản PayOS sẽ được lưu tự động tại đây.</p>
      </div>
    `;
  }

  let filtered = records;
  if (activeFilter && activeFilter !== 'ALL') {
    filtered = records.filter(p => {
      const status = String(p.status || '').toUpperCase();
      const method = String(p.paymentMethod || '').toUpperCase();
      if (activeFilter === 'SUCCESS') return status === 'SUCCESS';
      if (activeFilter === 'CASH') return method === 'CASH';
      if (activeFilter === 'ONLINE') return ['PAYOS', 'TRANSFER', 'BANKING', 'VNPAY', 'MOMO'].includes(method);
      return true;
    });
  }

  if (filtered.length === 0) {
    return `
      <div class="empty-state" style="padding: 3rem 1.5rem; text-align: center; background: #ffffff; border-radius: 20px; border: 1px dashed #cbd5e1; margin-top: 1rem;">
        <div style="font-size: 2.2rem; color: #94a3b8; margin-bottom: 0.5rem;"><i class="fa-solid fa-filter-circle-xmark"></i></div>
        <h4 style="color: #334155; font-size: 1rem; font-weight: 700;">Không tìm thấy giao dịch thuộc bộ lọc này</h4>
      </div>
    `;
  }

  return `
    <div class="payments-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.25rem; margin-top: 1.25rem;">
      ${filtered.map(payment => {
        const order = payment.Order || {};
        const tableInfo = getOrderTableInfo(order, tables);
        const customerName = order.User?.fullName || (order.user_id ? `Khách #${order.user_id}` : 'Khách vãng lai');
        const customerPhone = order.User?.phone || '';
        const rawMethod = String(payment.paymentMethod || 'CASH').toUpperCase();
        const rawStatus = String(payment.status || 'SUCCESS').toUpperCase();
        const items = order.OrderItems || [];
        const itemsCount = items.reduce((acc, item) => acc + (item.quantity || 1), 0);

        // Trích xuất mã PayOS từ order.note hoặc transactionCode
        const matchNote = order.note?.match(/\[PAYOS:(\d+)\]/);
        const matchTxn = payment.transactionCode?.match(/PAYOS-(\d+)/);
        const payosOrderCode = matchNote ? matchNote[1] : (matchTxn ? matchTxn[1] : null);
        const isPayOS = isPayOSOrTransfer(rawMethod, payosOrderCode);

        // Badge Phương thức thanh toán
        let methodBadgeHtml = '';
        if (rawMethod === 'PAYOS' || isPayOS) {
          methodBadgeHtml = `<span class="badge-inline" style="background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; font-weight: 800; padding: 0.35rem 0.75rem; border-radius: 10px; font-size: 0.78rem; box-shadow: 0 2px 8px rgba(37,99,235,0.22);"><i class="fa-solid fa-qrcode"></i> PayOS / VietQR</span>`;
        } else if (rawMethod === 'TRANSFER' || rawMethod === 'BANKING') {
          methodBadgeHtml = `<span class="badge-inline" style="background: linear-gradient(135deg, #0d9488, #059669); color: #ffffff; font-weight: 800; padding: 0.35rem 0.75rem; border-radius: 10px; font-size: 0.78rem;"><i class="fa-solid fa-building-columns"></i> Chuyển khoản</span>`;
        } else if (rawMethod === 'MOMO') {
          methodBadgeHtml = `<span class="badge-inline" style="background: linear-gradient(135deg, #d946ef, #c026d3); color: #ffffff; font-weight: 800; padding: 0.35rem 0.75rem; border-radius: 10px; font-size: 0.78rem;"><i class="fa-solid fa-wallet"></i> MoMo</span>`;
        } else {
          methodBadgeHtml = `<span class="badge-inline" style="background: linear-gradient(135deg, #16a34a, #15803d); color: #ffffff; font-weight: 800; padding: 0.35rem 0.75rem; border-radius: 10px; font-size: 0.78rem;"><i class="fa-solid fa-money-bill-wave"></i> Tiền mặt</span>`;
        }

        // Chip trạng thái
        let statusBadgeHtml = '';
        if (rawStatus === 'SUCCESS') {
          statusBadgeHtml = `<span class="status-chip status-completed" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; font-weight: 800;"><i class="fa-solid fa-circle-check"></i> Thành công</span>`;
        } else if (rawStatus === 'PENDING') {
          statusBadgeHtml = `<span class="status-chip status-pending" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; font-weight: 800;"><i class="fa-solid fa-clock"></i> Chờ xử lý</span>`;
        } else {
          statusBadgeHtml = `<span class="status-chip status-cancelled" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; font-weight: 800;"><i class="fa-solid fa-circle-xmark"></i> Thất bại</span>`;
        }

        return `
          <article class="payment-card" style="background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.03); padding: 1.3rem; display: flex; flex-direction: column; gap: 0.95rem; transition: all 0.2s ease;">
            
            <!-- Card Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.8rem;">
              <div>
                <span style="font-size: 0.73rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Mã Giao Dịch System</span>
                <div style="font-size: 0.95rem; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 0.1rem; display: flex; align-items: center; gap: 0.35rem;">
                  <i class="fa-solid fa-hashtag" style="color: #3b82f6; font-size: 0.85rem;"></i> ${escapeHtml(payment.transactionCode || `PAY-${payment.id}`)}
                </div>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem;">
                ${methodBadgeHtml}
                ${statusBadgeHtml}
              </div>
            </div>

            <!-- Customer & Order Information -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: #f8fafc; padding: 0.8rem 1rem; border-radius: 14px; border: 1px solid #f1f5f9;">
              <div>
                <span style="font-size: 0.73rem; color: #64748b; font-weight: 600; display: block;">Khách hàng</span>
                <strong style="font-size: 0.88rem; color: #1e293b; display: flex; align-items: center; gap: 0.35rem; margin-top: 0.15rem;">
                  <i class="fa-solid fa-user-circle" style="color: #64748b; font-size: 0.9rem;"></i> ${escapeHtml(customerName)}
                </strong>
                ${customerPhone ? `<span style="font-size: 0.75rem; color: #64748b; display: block; margin-top: 0.15rem;"><i class="fa-solid fa-phone" style="font-size:0.7rem"></i> ${escapeHtml(customerPhone)}</span>` : ''}
              </div>
              <div>
                <span style="font-size: 0.73rem; color: #64748b; font-weight: 600; display: block;">Đơn hàng & Bàn</span>
                <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 0.2rem;">
                  <span class="badge-inline" style="background: #eff6ff; color: #1d4ed8; font-weight: 800; font-size: 0.78rem;"><i class="fa-solid fa-receipt"></i> Đơn #${order.id || payment.order_id || '-'}</span>
                  ${tableInfo.displayBadge}
                </div>
              </div>
            </div>

            <!-- PayOS OrderCode Card Block (Clean & Sleek Metadata Display) -->
            ${(isPayOS || payosOrderCode) ? `
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; padding: 0.8rem 1rem; border-radius: 14px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="background: #0284c7; color: #ffffff; width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; font-size: 0.85rem; font-weight: 800;">
                    <i class="fa-solid fa-qrcode"></i>
                  </span>
                  <div>
                    <strong style="font-size: 0.83rem; color: #0369a1; display: block;">Mã PayOS (OrderCode)</strong>
                    <span style="font-size: 0.75rem; color: #0284c7;">Cổng VietQR PayOS</span>
                  </div>
                </div>
                <code style="background: #ffffff; padding: 0.3rem 0.75rem; border-radius: 8px; border: 1px solid #93c5fd; font-weight: 900; color: #0284c7; font-size: 0.92rem; font-family: monospace; box-shadow: 0 2px 6px rgba(2,132,199,0.12);">
                  ${payosOrderCode ? `#${payosOrderCode}` : 'Chuyển khoản PayOS'}
                </code>
              </div>
            ` : ''}

            <!-- Amount Breakdown & Timestamp -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; background: #fafafa; padding: 0.75rem 1rem; border-radius: 14px; border: 1px solid #f1f5f9;">
              <div>
                <span style="font-size: 0.73rem; color: #64748b; font-weight: 600; display: block;">Thời gian thanh toán</span>
                <span style="font-size: 0.82rem; font-weight: 700; color: #334155;"><i class="fa-regular fa-clock" style="color: #64748b;"></i> ${formatDateTime(payment.paidAt || payment.created_at)}</span>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 0.73rem; color: #64748b; font-weight: 600; display: block;">Số tiền giao dịch</span>
                <div style="font-size: 1.3rem; font-weight: 900; color: #15803d; letter-spacing: -0.5px;">${formatCurrency(payment.amount)}</div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 0.5rem; justify-content: space-between; align-items: center; margin-top: 0.2rem;">
              <button type="button" class="btn btn-ghost btn-small" data-action="toggle-payment-detail" data-id="${payment.id}" style="font-weight: 700; font-size: 0.82rem; padding: 0.5rem 0.85rem; flex: 1;">
                <i class="fa-solid fa-list-check" style="color: #3b82f6;"></i> Chi tiết món (${itemsCount} món) <i class="fa-solid fa-chevron-down" style="font-size:0.7rem; margin-left:0.3rem"></i>
              </button>
              <button type="button" class="btn btn-danger btn-small" data-action="delete-record" data-view="payments" data-id="${payment.id}" style="padding: 0.5rem 0.8rem;" title="Xóa lịch sử giao dịch">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>

            <!-- Collapsible Item Details -->
            <div class="mini-card hidden" data-payment-detail="${payment.id}" style="background: #f8fafc; border-radius: 14px; padding: 0.85rem; border: 1px solid #e2e8f0;">
              <div style="font-size: 0.8rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                <span>Danh sách món ăn trong hóa đơn:</span>
                <span class="badge-inline" style="background: #e2e8f0; color: #475569; font-size: 0.72rem;">${items.length} mặt hàng</span>
              </div>
              <div class="info-list" style="display: grid; gap: 0.4rem;">
                ${items.length > 0 ? items.map(item => `
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; padding: 0.3rem 0; border-bottom: 1px dashed #e2e8f0;">
                    <span style="color: #334155;">${escapeHtml(item.Product?.name || `#${item.product_id}`)} <strong style="color: #0284c7;">x${item.quantity}</strong></span>
                    <strong style="color: #0f172a;">${formatCurrency(item.totalPrice || 0)}</strong>
                  </div>
                `).join('') : '<div style="font-size: 0.78rem; color: #94a3b8;">Không có chi tiết sản phẩm</div>'}
              </div>
            </div>

          </article>
        `;
      }).join('')}
    </div>
  `;
}

function isPayOSOrTransfer(method, payosCode) {
  const m = String(method || '').toUpperCase();
  return m === 'PAYOS' || m === 'TRANSFER' || !!payosCode;
}
