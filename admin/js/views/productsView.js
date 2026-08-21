// Modular Products View (Giao diện Quản lý Sản Phẩm)
import { formatCurrency, formatNumber, escapeHtml, statusChip, resolveImageUrl } from '../utils.js';

export function renderProductsGrid(products, activeFilter = 'ALL', categories = []) {
  if (!products || products.length === 0) {
    return `<div class="empty-state"><strong>Không có sản phẩm nào</strong></div>`;
  }

  let filtered = products;
  if (activeFilter && activeFilter !== 'ALL') {
    filtered = products.filter(p => String(p.category_id) === String(activeFilter));
  }

  if (filtered.length === 0) {
    return `<div class="empty-state"><strong>Không tìm thấy món ăn trong danh mục này</strong></div>`;
  }

  const defaultFoodPlaceholder = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

  return `
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1rem">
      ${filtered.map(item => {
        const catObj = categories.find(c => String(c.id) === String(item.category_id));
        const catName = catObj ? catObj.name : item.category_id ? `#${item.category_id}` : 'Khác';
        const imgUrl = resolveImageUrl(item.image) || defaultFoodPlaceholder;

        return `
          <article class="table-card-clean" style="padding:0; overflow:hidden">
            <div style="height:140px; background:#f1f5f9; position:relative; overflow:hidden">
              <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.name)}" loading="lazy" style="width:100%; height:100%; object-fit:cover" onerror="this.onerror=null;this.src='${defaultFoodPlaceholder}'" />
              <span class="badge-inline" style="position:absolute; top:0.5rem; right:0.5rem; background:rgba(15,23,42,0.75); color:#fff; backdrop-filter:blur(4px); font-size:0.75rem">
                ${escapeHtml(catName)}
              </span>
            </div>

            <div style="padding:0.9rem; display:flex; flex-direction:column; gap:0.4rem">
              <div style="display:flex; justify-content:space-between; align-items:flex-start">
                <h4 style="margin:0; font-size:1rem; font-weight:700; color:#0f172a">${escapeHtml(item.name)}</h4>
                <strong style="color:#2563eb; font-size:1rem">${formatCurrency(item.price)}</strong>
              </div>

              <p style="font-size:0.8rem; color:#64748b; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:2.4rem">
                ${escapeHtml(item.description || 'Chưa có mô tả.')}
              </p>

              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.4rem; pt:0.4rem; border-top:1px solid #f1f5f9; font-size:0.8rem">
                <span class="muted">Tồn kho: <strong>${formatNumber(item.stock ?? 0)}</strong></span>
                ${statusChip(item.isAvailable !== false ? 'AVAILABLE' : 'BLOCKED', item.isAvailable !== false ? 'Đang bán' : 'Tạm ngưng')}
              </div>

              <div class="row-actions" style="margin-top:0.4rem; display:grid; grid-template-columns:1fr 1fr; gap:0.4rem">
                <button class="btn btn-secondary btn-small" data-action="edit-record" data-view="products" data-id="${item.id}"><i class="fa-solid fa-pen"></i> Sửa</button>
                <button class="btn btn-danger btn-small" data-action="delete-record" data-view="products" data-id="${item.id}"><i class="fa-solid fa-trash"></i> Xóa</button>
              </div>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}
