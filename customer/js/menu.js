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

        await loadCategories();

        await loadProducts();

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
        return `${API_BASE}${product.image}`;
    }

    // Nếu database chỉ lưu tên file
    return `${API_BASE}/uploads/${product.image}`;
}


/*==================================================
                PRODUCT CARD
==================================================*/

function renderCard(product) {

    const imageUrl =
        getProductImage(product);

    productGrid.innerHTML += `

        <div class="product-card">

            <div class="product-image">

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
                    ${
                        product.description ||
                        "Đang cập nhật mô tả..."
                    }
                </p>

                <div class="product-footer">

                    <div class="product-price">

                        ${
                            Number(product.price)
                                .toLocaleString("vi-VN")
                        }đ

                    </div>

                    <button
                        class="add-cart"
                        onclick="addToCart(${product.id})">

                        <i class="fa-solid fa-cart-plus"></i>

                    </button>

                </div>

            </div>

        </div>

    `;
}


/*==================================================
                    CART
==================================================*/

window.addToCart =
function(id) {

    const product =
        products.find(
            p => p.id === id
        );


    if (!product) {

        return;

    }


    const item =
        cart.find(
            i => i.id === id
        );


    if (item) {

        item.quantity++;

    } else {

        cart.push({

            ...product,

            quantity: 1

        });

    }


    renderCart();


    showToast(
        "Đã thêm vào giỏ hàng."
    );

};


/*==================================================
                RENDER CART
==================================================*/

function renderCart() {

    if (!cartItems || !totalPrice) {

        return;

    }


    cartItems.innerHTML = "";


    let total = 0;


    if (cart.length === 0) {

        cartItems.innerHTML = `

            <div class="empty-cart">

                Chưa có món ăn.

            </div>

        `;


        totalPrice.innerHTML =
            "0đ";


        return;

    }


    cart.forEach(
        item => {

            total +=
                item.quantity *
                Number(item.price);


            cartItems.innerHTML += `

                <div class="cart-item">

                    <div class="cart-info">

                        <h4>

                            ${item.name}

                        </h4>

                        <span>

                            ${
                                Number(
                                    item.price
                                ).toLocaleString(
                                    "vi-VN"
                                )
                            }đ

                        </span>

                    </div>


                    <div class="quantity">

                        <button
                            onclick="minus(${item.id})">

                            -

                        </button>


                        <span>

                            ${item.quantity}

                        </span>


                        <button
                            onclick="plus(${item.id})">

                            +

                        </button>

                    </div>

                </div>

            `;

        }
    );


    totalPrice.innerHTML =
        total.toLocaleString(
            "vi-VN"
        ) + "đ";

}


/*==================================================
                    PLUS
==================================================*/

window.plus =
function(id) {

    const item =
        cart.find(
            p => p.id === id
        );


    if (!item) {

        return;

    }


    item.quantity++;

    renderCart();

};


/*==================================================
                    MINUS
==================================================*/

window.minus =
function(id) {

    const item =
        cart.find(
            p => p.id === id
        );


    if (!item) {

        return;

    }


    item.quantity--;


    if (item.quantity <= 0) {

        cart =
            cart.filter(
                p => p.id !== id
            );

    }


    renderCart();

};


/*==================================================
                    CHECKOUT
==================================================*/

async function checkout() {

    if (cart.length === 0) {

        showToast(
            "Giỏ hàng đang trống."
        );

        return;

    }


    /*
     * Lấy thông tin bàn đã xác thực
     */

    const tableQr =
        sessionStorage.getItem(
            "appdatmon_table_qr"
        );


    const tableData =
        sessionStorage.getItem(
            "appdatmon_table"
        );


    if (!tableQr || !tableData) {

        showToast(
            "Phiên QR không hợp lệ. Vui lòng quét lại."
        );


        setTimeout(() => {

            window.location.href =
                "index.html";

        }, 1000);


        return;

    }


    /*
     * Thông tin đăng nhập & Thông tin khách
     */
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    const isGuest = !token;

    const table = JSON.parse(tableData);
    const customerLabel = user ? (user.fullName || user.username || `Thành viên #${user.id}`) : `Khách vãng lai tại Bàn #${table.tableNumber || table.id}`;

    const body = {
        table_id: table.id,
        items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        })),
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
    }
}