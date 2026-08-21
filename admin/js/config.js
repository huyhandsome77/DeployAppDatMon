export const API_BASE_URL = (window.ADMIN_API_BASE_URL || localStorage.getItem('appdatmon_admin_api_base') || (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:3000')).replace(/\/$/, '');
export const TOKEN_KEY = 'appdatmon_admin_token';
export const USER_KEY = 'appdatmon_admin_user';

export const RESERVATION_STATUS_MAP = {
  CONFIRMED: '<span class="res-status-badge st-confirmed"><i class="fa-solid fa-bolt"></i> Đã xác nhận</span>',
  CHECKED_IN: '<span class="res-status-badge st-checked-in"><i class="fa-solid fa-user-check"></i> Đã nhận bàn</span>',
  ARRIVED: '<span class="res-status-badge st-checked-in"><i class="fa-solid fa-user-check"></i> Đã nhận bàn</span>',
  CANCELLED: '<span class="res-status-badge st-cancelled"><i class="fa-solid fa-xmark"></i> Đã hủy</span>',
  PENDING: '<span class="res-status-badge st-pending"><i class="fa-solid fa-clock"></i> Chờ duyệt</span>'
};

export const TABLE_STATUS_MAP = {
  AVAILABLE: { label: '🟢 Bàn trống', cssClass: 'st-available' },
  BOOKED: { label: '🔵 Đặt trước', cssClass: 'st-booked' },
  OCCUPIED: { label: '🟡 Đang ăn', cssClass: 'st-occupied' },
  CLEANING: { label: '🟣 Cần dọn', cssClass: 'st-cleaning' }
};
