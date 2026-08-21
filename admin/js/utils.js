// Shared Utility & Formatting Helpers

export function resolveImageUrl(img) {
  if (!img || typeof img !== 'string' || img.trim() === '') return '';
  if (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/')) return img;
  return `/uploads/${img}`;
}

export async function compressImageToWebP(file, maxWidth = 800, maxHeight = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatNumber(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString('vi-VN') : '0';
}

export function formatCurrency(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numeric)
    : '0 đ';
}

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function escapeHtml(str) {
  if (typeof str !== 'string') return str ?? '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function userInitials(user) {
  const name = user?.fullName || user?.username || 'Guest';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function statusChip(typeClass, label) {
  return `<span class="badge-inline ${typeClass}">${escapeHtml(label)}</span>`;
}

export function tableStatusClass(status) {
  switch (String(status).toUpperCase()) {
    case 'AVAILABLE': return 'st-available';
    case 'OCCUPIED': return 'st-occupied';
    case 'BOOKED': return 'st-booked';
    case 'CLEANING': return 'st-cleaning';
    default: return 'st-available';
  }
}

export function orderStatusClass(status) {
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

export function paymentStatusClass(status) {
  switch (String(status).toUpperCase()) {
    case 'PAID': return 'badge-success';
    case 'UNPAID': return 'badge-warning';
    case 'REFUNDED': return 'badge-danger';
    default: return 'badge-neutral';
  }
}

export function reservationStatusClass(status) {
  switch (String(status).toUpperCase()) {
    case 'CONFIRMED': return 'badge-info';
    case 'CHECKED_IN': return 'badge-success';
    case 'CANCELLED': return 'badge-danger';
    case 'PENDING':
    default: return 'badge-warning';
  }
}
