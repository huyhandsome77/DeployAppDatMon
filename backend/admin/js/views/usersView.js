// Modular Users View (Giao diện Quản lý Người dùng & Điểm thưởng)
import { formatNumber, escapeHtml, userInitials, statusChip } from '../utils.js';

export function renderUsersGrid(users, activeFilter = 'ALL') {
  if (!users || users.length === 0) {
    return `<div class="empty-state"><strong>Không tìm thấy tài khoản người dùng</strong></div>`;
  }

  let filtered = users;
  if (activeFilter && activeFilter !== 'ALL') {
    filtered = users.filter(u => String(u.role || '').toUpperCase() === activeFilter);
  }

  if (filtered.length === 0) {
    return `<div class="empty-state"><strong>Không có tài khoản ở vai trò này</strong></div>`;
  }

  return `
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1rem">
      ${filtered.map(user => {
        const initials = userInitials(user);
        const roleStr = String(user.role || 'CUSTOMER').toUpperCase();
        const statusStr = String(user.status || 'ACTIVE').toUpperCase();

        return `
          <article class="table-card-clean">
            <div style="display:flex; gap:0.8rem; align-items:center">
              <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1rem; flex-shrink:0">
                ${initials}
              </div>
              <div style="overflow:hidden">
                <h4 style="margin:0; font-size:0.95rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${escapeHtml(user.fullName || user.username)}</h4>
                <div class="muted" style="font-size:0.78rem">@${escapeHtml(user.username || 'user')} • ${escapeHtml(user.phone || '-')}</div>
              </div>
            </div>

            <div style="margin:0.8rem 0; padding:0.6rem; background:#f8fafc; border-radius:10px; border:1px solid #f1f5f9; display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; font-size:0.8rem">
              <div>
                <span class="muted" style="display:block">Vai trò</span>
                ${statusChip(roleStr, roleStr)}
              </div>
              <div>
                <span class="muted" style="display:block">Điểm thưởng</span>
                <strong style="color:#d97706">🪙 ${formatNumber(user.points ?? 0)} p</strong>
              </div>
            </div>

            <div class="row-actions" style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; margin-top:auto">
              <button class="btn btn-secondary btn-small" data-action="edit-record" data-view="users" data-id="${user.id}"><i class="fa-solid fa-pen"></i> Sửa</button>
              <button class="btn btn-danger btn-small" data-action="delete-record" data-view="users" data-id="${user.id}"><i class="fa-solid fa-trash"></i> Xóa</button>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}
