const API_BASE = (
    window.APP_API_BASE_URL ||
    localStorage.getItem('appdatmon_api_base') ||
    window.location.origin
).replace(/\/$/, '');
const TOKEN_KEY = 'appdatmon_customer_token';
const USER_KEY = 'appdatmon_customer_user';
const app = document.getElementById('app');

/*==================================================
                AUTH
==================================================*/

function getCurrentUser(){

    return JSON.parse(

        localStorage.getItem(USER_KEY)

        || "null"

    );

}

function isLogin(){

    return !!localStorage.getItem(

        TOKEN_KEY

    );

}


async function login(account,password){

    try{

        const result = await api(

            "/api/auth/login",

            {

                method:"POST",

                body:JSON.stringify({

                    account,

                    password

                })

            }

        );

        localStorage.setItem(

            TOKEN_KEY,

            result.token

        );

        localStorage.setItem(

            USER_KEY,

            JSON.stringify(result.user)

        );

        state.user = result.user;

        state.token = result.token;

        showToast(

            result.message ||

            "Đăng nhập thành công"

        );

        setTimeout(()=>{

            location.href="index.html";

        },500);

    }

    catch(error){

        showToast(

            error.message

        );

    }

}


async function register(data){

    try{

        const result = await api(

            "/api/auth/register",

            {

                method:"POST",

                body:JSON.stringify(data)

            }

        );

        showToast(

            result.message ||

            "Đăng ký thành công"

        );

        setTimeout(()=>{

            location.reload();

        },700);

    }

    catch(error){

        showToast(

            error.message

        );

    }

}


function logout(){

    localStorage.removeItem(

        TOKEN_KEY

    );

    localStorage.removeItem(

        USER_KEY

    );

    state.user = null;

    state.token = "";

    showToast(

        "Đăng xuất thành công"

    );

    setTimeout(()=>{

        location.href="login.html";

    },500);

}

/*==================================================
                    UPDATE HEADER
==================================================*/

function updateHeader() {

    const user = getCurrentUser();

    const username =
        document.getElementById("username");

    const loginBtn =
        document.getElementById("loginBtn");


    /*==================================================
                    CHƯA ĐĂNG NHẬP
    ==================================================*/

    if (!user) {

        if (username) {

            username.textContent = "Khách";

        }

        if (loginBtn) {

            loginBtn.textContent = "Đăng nhập";

            loginBtn.href = "login.html";

            loginBtn.onclick = null;

        }

        return;
    }


    /*==================================================
                    ĐÃ ĐĂNG NHẬP
    ==================================================*/

    if (username) {

        username.textContent =
            user.fullName ||
            user.username ||
            "Khách";

    }


    if (loginBtn) {

        loginBtn.textContent =
            "Đăng xuất";

        loginBtn.href = "#";

        loginBtn.onclick = function (event) {

            event.preventDefault();

            logout();

        };

    }

}



function requireLogin(){

    if(!isLogin()){

        location.href="login.html";

    }

}



const state = {
  user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
  token: localStorage.getItem(TOKEN_KEY) || '',
  authMode: 'login',
  loading: false,
  products: [],
  categories: [],
  table: null,
  cart: [],
  error: '',
  success: '',
  tableQr: '',
  tableInput: '',
  selectedCategory: '',
  searchTerm: ''
};

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function setMessage(type, message) {
  state.error = type === 'error' ? message : '';
  state.success = type === 'success' ? message : '';
  render();
}

async function api(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
  };
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Yêu cầu thất bại');
  return data;
}

async function loadInitialData() {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      api('/api/products'),
      api('/api/categories')
    ]);
    state.products = productsRes || [];
    state.categories = categoriesRes || [];
  } catch (error) {
    console.error(error);
    showToast('Không thể tải menu. Vui lòng thử lại.');
  }
}

function getTableFromQr() {
  const params = new URLSearchParams(window.location.search);
  const qr = params.get('qr') || params.get('table') || params.get('tableId') || state.tableQr;
  if (qr) {
    return qr;
  }
  return '';
}

async function loadTableByQr(qr) {
  if (!qr) return;
  try {
    state.table = await api(`/api/tables/qr/${encodeURIComponent(qr)}`);
    state.tableInput = qr;
    state.tableQr = qr;
  } catch (error) {
    state.table = null;
    showToast(error.message);
  }
}

async function loadTableFromInput() {
  const qr = state.tableInput.trim();
  if (!qr) {
    showToast('Vui lòng nhập mã QR bàn trước');
    return;
  }
  try {
    await loadTableByQr(qr);
    render();
    showToast(`Đã tải bàn ${state.table?.tableNumber || state.table?.id || qr}`);
  } catch (error) {
    showToast(error.message);
  }
}

function getFilteredProducts() {
  const search = state.searchTerm.trim().toLowerCase();
  return state.products.filter((product) => {
    const matchesCategory = !state.selectedCategory || String(product.category_id) === String(state.selectedCategory);
    const matchesSearch = !search || product.name?.toLowerCase().includes(search) || product.description?.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });
}


function addToCart(product) {
  const existing = state.cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ id: product.id, name: product.name, price: Number(product.price), quantity: 1 });
  }
  render();
}

function changeQuantity(productId, delta) {
  const item = state.cart.find(i => i.id === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(i => i.id !== productId);
  }
  render();
}

async function submitOrder() {
  if (!state.table?.id) {
    showToast('Vui lòng quét hoặc chọn bàn trước khi đặt món');
    return;
  }
  if (!state.cart.length) {
    showToast('Giỏ hàng đang trống');
    return;
  }

  try {
    const payload = {
      table_id: state.table.id,
      items: state.cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
      note: 'Đặt món từ giao diện QR'
    };
    const data = await api('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
    state.cart = [];
    render();
    showToast(data.message || 'Đặt món thành công');
  } catch (error) {
    showToast(error.message);
  }
}


/*==================================================
                LOAD COMMON HEADER
==================================================*/

async function loadHeader() {

    const container =
        document.getElementById(
            "header-container"
        );

    if (!container) {
        return;
    }

    try {

        const response =
            await fetch("./header.html");

        if (!response.ok) {

            throw new Error(
                "Không thể tải header"
            );

        }

        container.innerHTML =
    await response.text();

updateHeader();

if (
    typeof setupQrEvents === "function"
) {

    setupQrEvents();

}

    }

    catch (error) {

        console.error(
            "Header error:",
            error
        );

    }

}


/*==================================================
                QR BUTTON EVENTS
==================================================*/

document.addEventListener("click", function (e) {
    /* HEADER - QUÉT QR */
    const qrNavLink = e.target.closest("#qrNavLink");
    if (qrNavLink) {
        e.preventDefault();
        if (typeof window.openQrScanner === 'function') {
            window.openQrScanner();
        } else {
            window.location.href = "index.html#open-qr";
        }
        return;
    }

    /* INDEX - QUÉT QR */
    const openQrBtn = e.target.closest("#openQrBtn");
    if (openQrBtn) {
        e.preventDefault();
        if (typeof window.openQrScanner === 'function') {
            window.openQrScanner();
        } else {
            window.location.href = "index.html#open-qr";
        }
        return;
    }

    /* ĐÓNG MODAL */
    const closeBtn = e.target.closest("#closeQrModal");
    if (closeBtn) {
        e.preventDefault();
        if (typeof window.closeQrScanner === 'function') {
            window.closeQrScanner();
        }
        return;
    }

    /* CLICK NỀN MODAL */
    if (e.target.classList.contains("qr-modal-overlay")) {
        if (typeof window.closeQrScanner === 'function') {
            window.closeQrScanner();
        }
    }
});

/*==================================================
                    START APP
==================================================*/

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", loadHeader);
} else {
    loadHeader();
}