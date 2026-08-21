/*==================================================
                REQUIRE QR SCAN
==================================================*/

async function verifyTableQr() {
    const params = new URLSearchParams(window.location.search);
    const qr = params.get("qr") || params.get("table") || params.get("tableId") || sessionStorage.getItem("appdatmon_table_qr");

    if (!qr) {
        showToast("Vui lòng quét mã QR tại bàn.");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1200);
        return false;
    }

    try {

        const table = await api(
            `/api/tables/qr/${encodeURIComponent(qr)}`
        );

        if (!table) {

            throw new Error(
                "Mã QR không hợp lệ."
            );

        }

        sessionStorage.setItem(
            "appdatmon_table_qr",
            qr
        );

        sessionStorage.setItem(
            "appdatmon_table",
            JSON.stringify(table)
        );

        console.log(
            "QR verified:",
            table
        );

        return true;

    } catch (error) {

        console.error(
            "QR verification error:",
            error
        );

        sessionStorage.removeItem(
            "appdatmon_table_qr"
        );

        sessionStorage.removeItem(
            "appdatmon_table"
        );

        showToast(
            "Mã QR không hợp lệ hoặc bàn không tồn tại."
        );

        setTimeout(() => {

            window.location.href =
                "index.html";

        }, 1000);

        return false;
    }
}


/*==================================================
                    MENU
==================================================*/

const productGrid =
    document.getElementById("productGrid");

const categorySelect =
    document.getElementById("categorySelect");

const searchInput =
    document.getElementById("searchInput");

const cartItems =
    document.getElementById("cartItems");

const totalPrice =
    document.getElementById("totalPrice");


let products = [];

let categories = [];

let cart = [];


/*==================================================
                    INIT
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /*
         * Kiểm tra các element cần thiết
         */

        if (
            !productGrid ||
            !categorySelect ||
            !searchInput ||
            !cartItems ||
            !totalPrice
        ) {

            console.error(
                "Không tìm thấy element của menu."
            );

            return;

        }


        /*
         * QUAN TRỌNG:
         * Phải xác thực QR trước
         */

        const verified =
            await verifyTableQr();


        if (!verified) {

            return;

        }


        /*
         * QR hợp lệ
         * mới tải menu
         */

        /*
         * QR hợp lệ
         * mới tải menu
         */

        await loadCategories();

        await loadProducts();

        /*
         * Khởi tạo thông tin bàn ăn hiện tại
         */
        initTableDisplay();

        /*
         * Khởi tạo thông tin điểm thưởng người dùng
         */
        await initUserPoints();

        renderCart();


        /*
         * Search
         */

        searchInput.addEventListener(
            "input",
            renderProducts
        );


        /*
         * Category
         */

        categorySelect.addEventListener(
            "change",
            renderProducts
        );


        /*
         * Checkout
         */

        const checkoutBtn =
            document.getElementById(
                "checkoutBtn"
            );


        if (checkoutBtn) {

            checkoutBtn.addEventListener(
                "click",
                checkout
            );

        }

    }
);

let currentUserPoints = 0;
let appliedPoints = 0;

function initTableDisplay() {
    const tableData = sessionStorage.getItem("appdatmon_table");
    if (tableData) {
        try {
            const table = JSON.parse(tableData);
            const tableNumberDisplay = document.getElementById("tableNumberDisplay");
            if (tableNumberDisplay) {
                tableNumberDisplay.textContent = `Bàn #${table.tableNumber || table.id}`;
            }
        } catch (e) {
            console.error("Parse table error:", e);
        }
    }
}

async function initUserPoints() {
    let currentUser = null;
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        try {
            currentUser = await api("/api/users/profile");
            if (currentUser) {
                localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            }
        } catch (err) {
            console.warn("Fetch profile error:", err);
            currentUser = JSON.parse(localStorage.getItem(USER_KEY) || "null");
        }
    }

    if (currentUser && currentUser.points > 0) {
        currentUserPoints = Number(currentUser.points || 0);
        const pointsRedeemBox = document.getElementById("pointsRedeemBox");
        const userPointsBalance = document.getElementById("userPointsBalance");
        if (pointsRedeemBox && userPointsBalance) {
            userPointsBalance.textContent = `${currentUserPoints.toLocaleString("vi-VN")} pt`;
            pointsRedeemBox.style.display = "block";
        }

        const pointsInput = document.getElementById("pointsInput");
        const maxPointsBtn = document.getElementById("maxPointsBtn");
        const applyPointsBtn = document.getElementById("applyPointsBtn");

        if (pointsInput) {
            pointsInput.value = currentUserPoints;
            pointsInput.addEventListener("input", () => {
                let val = parseInt(pointsInput.value) || 0;
                if (val < 0) val = 0;
                if (val > currentUserPoints) val = currentUserPoints;
                pointsInput.value = val;
            });
        }

        if (maxPointsBtn && pointsInput) {
            maxPointsBtn.addEventListener("click", () => {
                pointsInput.value = currentUserPoints;
            });
        }

        if (applyPointsBtn && pointsInput) {
            applyPointsBtn.addEventListener("click", () => {
                if (appliedPoints > 0) {
                    // Hủy áp dụng
                    appliedPoints = 0;
                    applyPointsBtn.textContent = "Áp dụng";
                    applyPointsBtn.style.background = "var(--accent, #d62828)";
                    applyPointsBtn.style.color = "#ffffff";
                    applyPointsBtn.style.border = "none";
                    applyPointsBtn.style.boxShadow = "0 8px 20px rgba(214,40,40,0.25)";
                    showToast("Đã hủy dùng điểm giảm giá.");
                } else {
                    // Áp dụng điểm
                    let reqVal = parseInt(pointsInput.value) || 0;
                    if (reqVal <= 0) {
                        showToast("Vui lòng nhập số điểm muốn dùng.");
                        return;
                    }
                    if (reqVal > currentUserPoints) reqVal = currentUserPoints;
                    
                    appliedPoints = reqVal;
                    applyPointsBtn.textContent = "Bỏ áp dụng";
                    applyPointsBtn.style.background = "#18181b";
                    applyPointsBtn.style.color = "#ffffff";
                    applyPointsBtn.style.border = "1px solid #34343a";
                    applyPointsBtn.style.boxShadow = "none";
                    showToast(`🎉 Đã áp dụng giảm ${appliedPoints.toLocaleString("vi-VN")}đ từ điểm thưởng!`);
                }
                renderCart();
            });
        }
    }
}


/*==================================================
                    CATEGORY
==================================================*/

async function loadCategories() {

    try {

        categories =
            await api(
                "/api/categories"
            );


        categorySelect.innerHTML = `

            <option value="">

                Tất cả danh mục

            </option>

        `;


        categories.forEach(
            category => {

                categorySelect.innerHTML += `

                    <option value="${category.id}">

                        ${category.name}

                    </option>

                `;

            }
        );

    } catch (error) {

        console.error(
            "Load categories error:",
            error
        );

    }

}


/*==================================================
                    PRODUCT
==================================================*/

async function loadProducts() {

    try {

        products =
            await api(
                "/api/products"
            );


        renderProducts();

    } catch (error) {

        console.error(
            "Load products error:",
            error
        );

        showToast(
            "Không tải được thực đơn."
        );

    }

}


/*==================================================
                RENDER PRODUCTS
==================================================*/

function renderProducts() {

    const keyword =
        searchInput.value
            .toLowerCase()
            .trim();


    const category =
        categorySelect.value;


    const list =
        products.filter(
            product => {

                const matchName =
                    product.name
                        .toLowerCase()
                        .includes(keyword);


                const matchCategory =
                    category === "" ||
                    String(product.category_id) ===
                    String(category);


                return (
                    matchName &&
                    matchCategory
                );

            }
        );


    productGrid.innerHTML = "";


    if (list.length === 0) {

        productGrid.innerHTML = `

            <div class="empty">

                Không có món ăn.

            </div>

        `;

        return;

    }


    list.forEach(
        renderCard
    );

}




/*==================================================
                PRODUCT IMAGE
==================================================*/

function getProductImage(product) {

    if (
        !product.image ||
        product.image.trim() === ""
    ) {
        return "./assets/images/no-image.png";
    }

    // Nếu database đã lưu URL đầy đủ
    if (
        product.image.startsWith("http://") ||
        product.image.startsWith("https://")
    ) {
        return product.image;
    }

    // Nếu database lưu /uploads/...
    if (product.image.startsWith("/")) {
        return product.image;
    }

    // Nếu database chỉ lưu tên file
    return `/uploads/${product.image}`;
}


/*==================================================
                PRODUCT CARD
==================================================*/

/*==================================================
                PRODUCT CARD
==================================================*/

function renderCard(product) {
    const imageUrl = getProductImage(product);
    const isOutOfStock = product.isAvailable === false || (product.stock !== undefined && product.stock <= 0);
    const isLowStock = !isOutOfStock && (product.stock > 0 && product.stock <= 5);

    const outOfStockBadgeHtml = isOutOfStock ? `<span class="out-of-stock-badge"><i class="fa-solid fa-ban"></i> HẾT MÓN</span>` : '';
    const lowStockBadgeHtml = isLowStock ? `<span class="low-stock-badge">Còn ${product.stock} suất</span>` : '';

    const btnHtml = isOutOfStock ? 
        `<button class="add-cart disabled" disabled title="Tạm hết món"><i class="fa-solid fa-ban"></i></button>` :
        `<button class="add-cart" onclick="addToCart(${product.id})" title="Thêm vào giỏ hàng"><i class="fa-solid fa-cart-plus"></i></button>`;

    productGrid.innerHTML += `
        <div class="product-card ${isOutOfStock ? 'disabled' : ''}">
            <div class="product-image">
                ${outOfStockBadgeHtml}
                ${lowStockBadgeHtml}
                <img
                    src="${imageUrl}"
                    alt="${product.name}"
                    onerror="this.onerror=null; this.src='./assets/images/no-image.png';"
                >
            </div>
            <div class="product-content">
                <h3>
                    ${product.name}
                </h3>
                <p>
                    ${product.description || "Đang cập nhật mô tả..."}
                </p>
                <div class="product-footer">
                    <div class="product-price">
                        ${Number(product.price).toLocaleString("vi-VN")}đ
                    </div>
                    ${btnHtml}
                </div>
            </div>
        </div>
    `;
}

/*==================================================
                    CART
==================================================*/

window.addToCart = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    if (product.isAvailable === false || (product.stock !== undefined && product.stock <= 0)) {
        showToast("Món này hiện đang tạm ngưng phục vụ!");
        return;
    }

    const item = cart.find(i => i.id === id);
    if (item) {
        if (product.stock !== undefined && item.quantity >= product.stock) {
            showToast(`Chỉ còn ${product.stock} suất trong kho!`);
            return;
        }
        item.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    renderCart();
    showToast("Đã thêm vào giỏ hàng.");
};

window.removeFromCart = function(id) {
    cart = cart.filter(p => p.id !== id);
    renderCart();
    showToast("Đã xóa món khỏi giỏ hàng.");
};

/*==================================================
                RENDER CART
==================================================*/

function renderCart() {
    if (!cartItems || !totalPrice) return;

    cartItems.innerHTML = "";
    let total = 0;
    let totalItemsCount = 0;

    const cartPanelHeader = document.querySelector(".cart-panel h3");

    if (cart.length === 0) {
        if (cartPanelHeader) {
            cartPanelHeader.innerHTML = `🛒 Giỏ hàng`;
        }
        cartItems.innerHTML = `
            <div class="empty-cart" style="padding: 2rem 1rem; text-align: center; color: #b5b5b5;">
                <i class="fa-solid fa-basket-shopping" style="font-size: 2.2rem; color: #34343a; margin-bottom: 0.8rem; display: block;"></i>
                <p style="font-size: 0.88rem; font-weight: 500;">Giỏ hàng đang trống.<br>Hãy chọn món ăn bạn yêu thích!</p>
            </div>
        `;

        const subtotalPrice = document.getElementById("subtotalPrice");
        const pointsDiscountRow = document.getElementById("pointsDiscountRow");
        if (subtotalPrice) subtotalPrice.textContent = "0đ";
        if (pointsDiscountRow) pointsDiscountRow.style.display = "none";
        totalPrice.innerHTML = "0đ";

        const mobileCartBar = document.getElementById("mobileCartBar");
        if (mobileCartBar) mobileCartBar.style.display = "none";

        return;
    }

    cart.forEach(item => {
        total += item.quantity * Number(item.price);
        totalItemsCount += item.quantity;

        cartItems.innerHTML += `
            <div class="cart-item">
                <div class="cart-info">
                    <h4>${item.name}</h4>
                    <span>${Number(item.price).toLocaleString("vi-VN")}đ</span>
                </div>

                <div class="cart-item-action">
                    <div class="quantity">
                        <button onclick="minus(${item.id})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="plus(${item.id})">+</button>
                    </div>
                    <button class="cart-delete-btn" onclick="removeFromCart(${item.id})" title="Xóa món này">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    });

    if (cartPanelHeader) {
        cartPanelHeader.innerHTML = `🛒 Giỏ hàng <span class="cart-badge-count">${totalItemsCount}</span>`;
    }

    const subtotalPrice = document.getElementById("subtotalPrice");
    const pointsDiscountRow = document.getElementById("pointsDiscountRow");
    const pointsDiscountAmount = document.getElementById("pointsDiscountAmount");

    let discount = Math.min(appliedPoints, total);
    const finalTotal = Math.max(0, total - discount);

    if (subtotalPrice) {
        subtotalPrice.textContent = total.toLocaleString("vi-VN") + "đ";
    }

    if (pointsDiscountRow && pointsDiscountAmount) {
        if (discount > 0) {
            pointsDiscountRow.style.display = "flex";
            pointsDiscountAmount.textContent = `- ${discount.toLocaleString("vi-VN")}đ`;
        } else {
            pointsDiscountRow.style.display = "none";
        }
    }

    totalPrice.innerHTML = finalTotal.toLocaleString("vi-VN") + "đ";

    /* Update Mobile Floating Cart Bar */
    const mobileCartBar = document.getElementById("mobileCartBar");
    const mobileCartCount = document.getElementById("mobileCartCount");
    const mobileCartTotal = document.getElementById("mobileCartTotal");

    if (mobileCartBar && mobileCartCount && mobileCartTotal) {
        if (window.innerWidth <= 992 && cart.length > 0) {
            mobileCartBar.style.display = "flex";
            mobileCartCount.textContent = `🛒 ${totalItemsCount} món trong giỏ`;
            mobileCartTotal.textContent = finalTotal.toLocaleString("vi-VN") + "đ";
        } else {
            mobileCartBar.style.display = "none";
        }
    }
}

/*==================================================
                    PLUS
==================================================*/

window.plus = function(id) {
    const item = cart.find(p => p.id === id);
    if (!item) return;

    const product = products.find(p => p.id === id);
    if (product && product.stock !== undefined && item.quantity >= product.stock) {
        showToast(`Chỉ còn ${product.stock} suất trong kho!`);
        return;
    }

    item.quantity++;
    renderCart();
};

/*==================================================
                    MINUS
==================================================*/

window.minus = function(id) {
    const item = cart.find(p => p.id === id);
    if (!item) return;

    item.quantity--;

    if (item.quantity <= 0) {
        cart = cart.filter(p => p.id !== id);
    }

    renderCart();
};

/*==================================================
                    CHECKOUT
==================================================*/

async function checkout() {
    if (cart.length === 0) {
        showToast("Giỏ hàng đang trống.");
        return;
    }

    const tableQr = sessionStorage.getItem("appdatmon_table_qr");
    const tableData = sessionStorage.getItem("appdatmon_table");

    if (!tableQr || !tableData) {
        showToast("Phiên QR không hợp lệ. Vui lòng quét lại.");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
        return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    const isGuest = !token;

    const table = JSON.parse(tableData);
    const customerLabel = user ? (user.fullName || user.username || `Thành viên #${user.id}`) : `Khách vãng lai tại Bàn #${table.tableNumber || table.id}`;

    const checkoutBtn = document.getElementById("checkoutBtn");
    const originalBtnContent = checkoutBtn ? checkoutBtn.innerHTML : "Đặt món";

    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi đơn đến Bếp...`;
    }

    const body = {
        table_id: table.id,
        items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        })),
        used_points: appliedPoints,
        note: isGuest ? `Khách vãng lai gọi món tại Bàn #${table.tableNumber || table.id}` : `Khách đặt món: ${customerLabel}`
    };

    try {
        const result = await api(
            "/api/orders",
            {
                method: "POST",
                body: JSON.stringify(body)
            }
        );

        if (appliedPoints > 0) {
            currentUserPoints = Math.max(0, currentUserPoints - appliedPoints);
            appliedPoints = 0;
            const savedUser = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
            if (savedUser) {
                savedUser.points = currentUserPoints;
                localStorage.setItem(USER_KEY, JSON.stringify(savedUser));
            }
            const userPointsBalance = document.getElementById("userPointsBalance");
            if (userPointsBalance) userPointsBalance.textContent = `${currentUserPoints.toLocaleString("vi-VN")} pt`;
        }

        showToast(
            result.message || `🎉 Đặt món thành công cho Bàn #${table.tableNumber || table.id}! Bếp đã nhận được đơn.`
        );

        cart = [];
        renderCart();

        setTimeout(() => {
            alert(`✅ Đã gửi đơn đặt món thành công cho Bàn #${table.tableNumber || table.id}!\nBộ phận Bếp và Phục vụ đang tiến hành chuẩn bị món cho bạn.`);
        }, 300);

    } catch (error) {
        console.error("Checkout error:", error);
        showToast(error.message || "Không thể đặt món. Vui lòng thử lại.");
    } finally {
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = originalBtnContent;
        }
    }
}