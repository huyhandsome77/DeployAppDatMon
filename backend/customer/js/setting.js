/*==================================================
                    SETTING PAGE
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateHeader();

        const items =
            document.querySelectorAll(
                ".setting-item[data-section]"
            );

        items.forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const section =
                        item.dataset.section;

                    openSettingSection(
                        section
                    );

                }
            );

        });


        /*==========================================
                    LOGOUT
        ==========================================*/

        const logoutBtn =
            document.getElementById(
                "settingLogout"
            );

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                () => {

                    if (
                        typeof logout ===
                        "function"
                    ) {

                        logout();

                    }

                }
            );

        }

    }
);


/*==================================================
                    AUTH CHECK
==================================================*/

function checkSettingLogin() {

    if (
        typeof isLogin === "function" &&
        isLogin()
    ) {

        return true;

    }

    showToast(
        "Vui lòng đăng nhập trước."
    );

    setTimeout(
        () => {

            window.location.href =
                "login.html";

        },
        700
    );

    return false;

}


/*==================================================
                    OPEN SECTION
==================================================*/

async function openSettingSection(section) {

    if (!checkSettingLogin()) {
        return;
    }

    const content =
        document.getElementById(
            "settingContent"
        );

    if (!content) {
        return;
    }


    switch (section) {

        case "account":

            renderAccount(content);

            break;


        case "orders":

            await renderOrders(content);

            break;


        case "bookings":

            await renderBookings(content);

            break;


        case "reviews":

            await renderReviews(content);

            break;


        case "password":

            renderChangePassword(content);

            break;

    }

}


/*==================================================
            ACCOUNT INFORMATION
==================================================*/

function renderAccount(content) {

    const user = getCurrentUser();

    if (!user) {

        content.innerHTML = `

            <div class="setting-panel">

                <div class="setting-empty">

                    <i class="fa-solid fa-user-slash"></i>

                    Không tìm thấy thông tin tài khoản.

                </div>

            </div>

        `;

        return;
    }


    content.innerHTML = `

        <div class="setting-panel">

            <div class="setting-panel-title">

                <i class="fa-solid fa-user"></i>

                <h2>
                    Thông tin tài khoản
                </h2>

            </div>


            <form
                id="accountForm"
                class="setting-form">


                <!-- HỌ TÊN -->

                <div>

                    <label>
                        Họ và tên
                    </label>

                    <input
                        id="accountFullName"
                        type="text"
                        value="${escapeSettingHtml(user.fullName || '')}"
                        placeholder="Nhập họ và tên">

                </div>


                <!-- USERNAME -->

                <div>

                    <label>
                        Tên đăng nhập
                    </label>

                    <input
                        id="accountUsername"
                        type="text"
                        value="${escapeSettingHtml(user.username || '')}"
                        placeholder="Tên đăng nhập">

                </div>


                <!-- EMAIL -->

                <div>

                    <label>
                        Email
                    </label>

                    <input
                        id="accountEmail"
                        type="email"
                        value="${escapeSettingHtml(user.email || '')}"
                        placeholder="Nhập email">

                </div>


                <!-- PHONE -->

                <div>

                    <label>
                        Số điện thoại
                    </label>

                    <input
                        id="accountPhone"
                        type="text"
                        value="${escapeSettingHtml(user.phone || '')}"
                        placeholder="Nhập số điện thoại">

                </div>


                <button
                    type="submit"
                    class="btn btn-primary">

                    <i class="fa-solid fa-floppy-disk"></i>

                    Lưu thay đổi

                </button>


            </form>

        </div>

    `;


    const form =
        document.getElementById(
            "accountForm"
        );


    form.addEventListener(
        "submit",
        updateAccount
    );

}

/*==================================================
                ESCAPE HTML
==================================================*/

function escapeSettingHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/*==================================================
                UPDATE ACCOUNT
==================================================*/

async function updateAccount(event) {

    event.preventDefault();


    const fullName =
        document.getElementById(
            "accountFullName"
        ).value.trim();


    const username =
        document.getElementById(
            "accountUsername"
        ).value.trim();


    const email =
        document.getElementById(
            "accountEmail"
        ).value.trim();


    const phone =
        document.getElementById(
            "accountPhone"
        ).value.trim();


    if (!fullName) {

        showToast(
            "Vui lòng nhập họ và tên."
        );

        return;

    }


    if (!email) {

        showToast(
            "Vui lòng nhập email."
        );

        return;

    }


    try {

        const result =
            await api(
                "/api/users/profile",
                {
                    method: "PUT",

                    body: JSON.stringify({

                        fullName,
                        username,
                        email,
                        phone

                    })

                }
            );



        const updatedUser =
            result.user ||
            result;


        localStorage.setItem(
            USER_KEY,
            JSON.stringify(
                updatedUser
            )
        );


        state.user =
            updatedUser;


        updateHeader();


        showToast(
            result.message ||
            "Cập nhật thông tin thành công."
        );


        renderAccount(
            document.getElementById(
                "settingContent"
            )
        );


    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Không thể cập nhật thông tin."
        );

    }

}

/*==================================================
                    ORDERS
==================================================*/

async function renderOrders(content) {

    content.innerHTML = `

        <div class="setting-panel">

            <div class="setting-panel-title">

                <i class="fa-solid fa-receipt"></i>

                <h2>
                    Lịch sử đơn hàng
                </h2>

            </div>

            <div class="setting-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Đang tải đơn hàng...

            </div>

        </div>

    `;


    try {

        const orders =
            await api(
                "/api/orders"
            );


        if (
            !orders ||
            orders.length === 0
        ) {

            content.innerHTML = `

                <div class="setting-panel">

                    <div class="setting-empty">

                        <i class="fa-solid fa-receipt"></i>

                        Bạn chưa có đơn hàng nào.

                    </div>

                </div>

            `;

            return;

        }


        content.innerHTML = `

            <div class="setting-panel">

                <div class="setting-panel-title">

                    <i class="fa-solid fa-receipt"></i>

                    <h2>
                        Lịch sử đơn hàng
                    </h2>

                </div>

                ${orders.map(order => `

                    <div class="history-item">

                        <div class="history-top">

                            <span class="history-title">

                                Đơn hàng #${order.id}

                            </span>

                            <span class="history-date">

                                ${
                                    order.created_at
                                    ? new Date(
                                        order.created_at
                                    ).toLocaleString(
                                        "vi-VN"
                                    )
                                    : ""
                                }

                            </span>

                        </div>


                        <div class="history-info">

                            Trạng thái:

                            <strong>
                                ${
                                    order.status ||
                                    "Đang xử lý"
                                }
                            </strong>

                        </div>


                        <div class="history-price">

                            ${
                                Number(
                                    order.total_amount ||
                                    order.total ||
                                    0
                                ).toLocaleString(
                                    "vi-VN"
                                )
                            }đ

                        </div>

                    </div>

                `).join("")}

            </div>

        `;

    }

    catch (error) {

        console.error(error);

        content.innerHTML = `

            <div class="setting-panel">

                <div class="setting-empty">

                    Không thể tải lịch sử đơn hàng.

                </div>

            </div>

        `;

    }

}


/*==================================================
                    BOOKINGS
==================================================*/

async function renderBookings(content) {

    content.innerHTML = `

        <div class="setting-panel">

            <div class="setting-panel-title">

                <i class="fa-solid fa-calendar-check"></i>

                <h2>
                    Lịch sử đặt bàn
                </h2>

            </div>

            <div class="setting-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Đang tải lịch sử...

            </div>

        </div>

    `;


    try {

        const bookings =
            await api(
                "/api/reservations"
            );


        if (
            !bookings ||
            bookings.length === 0
        ) {

            content.innerHTML = `

                <div class="setting-panel">

                    <div class="setting-empty">

                        <i class="fa-solid fa-calendar-xmark"></i>

                        Bạn chưa có lịch đặt bàn.

                    </div>

                </div>

            `;

            return;

        }


        content.innerHTML = `

            <div class="setting-panel">

                <div class="setting-panel-title">

                    <i class="fa-solid fa-calendar-check"></i>

                    <h2>
                        Lịch sử đặt bàn
                    </h2>

                </div>


                ${bookings.map(booking => `

                    <div class="history-item">

                        <div class="history-top">

                            <span class="history-title">

                                Đặt bàn #${booking.id}

                            </span>

                            <span class="history-date">

                                ${
                                    booking.created_at
                                    ? new Date(
                                        booking.created_at
                                    ).toLocaleString(
                                        "vi-VN"
                                    )
                                    : ""
                                }

                            </span>

                        </div>


                        <div class="history-info">

                            Thời gian:

                            ${
                                booking.booking_time ||
                                booking.reservation_time ||
                                booking.time ||
                                "Chưa cập nhật"
                            }

                            <br>

                            Số người:

                            ${
                                booking.number_of_people ||
                                booking.guests ||
                                booking.people ||
                                "Chưa cập nhật"
                            }

                            <br>

                            Trạng thái:

                            <strong>
                                ${
                                    booking.status ||
                                    "Đang xử lý"
                                }
                            </strong>

                        </div>

                    </div>

                `).join("")}

            </div>

        `;

    }

    catch (error) {

        console.error(error);

        content.innerHTML = `

            <div class="setting-panel">

                <div class="setting-empty">

                    Không thể tải lịch sử đặt bàn.

                </div>

            </div>

        `;

    }

}


/*==================================================
                    REVIEWS
==================================================*/

async function renderReviews(content) {

    content.innerHTML = `

        <div class="setting-panel">

            <div class="setting-panel-title">

                <i class="fa-solid fa-star"></i>

                <h2>
                    Đánh giá của tôi
                </h2>

            </div>

            <div class="setting-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Đang tải đánh giá...

            </div>

        </div>

    `;


    try {

        const reviews =
            await api(
                "/api/reviews"
            );


        if (
            !reviews ||
            reviews.length === 0
        ) {

            content.innerHTML = `

                <div class="setting-panel">

                    <div class="setting-empty">

                        <i class="fa-regular fa-star"></i>

                        Bạn chưa có đánh giá nào.

                    </div>

                </div>

            `;

            return;

        }


        content.innerHTML = `

            <div class="setting-panel">

                <div class="setting-panel-title">

                    <i class="fa-solid fa-star"></i>

                    <h2>
                        Đánh giá của tôi
                    </h2>

                </div>


                ${reviews.map(review => {

                    const rating =
                        Number(
                            review.rating || 0
                        );

                    const stars =
                        "★".repeat(rating) +
                        "☆".repeat(
                            Math.max(
                                0,
                                5 - rating
                            )
                        );


                    return `

                        <div class="history-item">

                            <div class="review-stars">

                                ${stars}

                            </div>


                            <div class="review-comment">

                                ${
                                    review.comment ||
                                    review.content ||
                                    "Không có nội dung."
                                }

                            </div>

                        </div>

                    `;

                }).join("")}

            </div>

        `;

    }

    catch (error) {

        console.error(error);

        content.innerHTML = `

            <div class="setting-panel">

                <div class="setting-empty">

                    Không thể tải đánh giá.

                </div>

            </div>

        `;

    }

}


/*==================================================
                CHANGE PASSWORD
==================================================*/

function renderChangePassword(content) {

    content.innerHTML = `

        <div class="setting-panel">

            <div class="setting-panel-title">

                <i class="fa-solid fa-lock"></i>

                <h2>
                    Đổi mật khẩu
                </h2>

            </div>


            <form
                id="changePasswordForm"
                class="setting-form">


                <div>

                    <label>
                        Mật khẩu hiện tại
                    </label>

                    <input
                        id="currentPassword"
                        type="password"
                        placeholder="Nhập mật khẩu hiện tại"
                        required>

                </div>


                <div>

                    <label>
                        Mật khẩu mới
                    </label>

                    <input
                        id="newPassword"
                        type="password"
                        placeholder="Nhập mật khẩu mới"
                        required>

                </div>


                <div>

                    <label>
                        Xác nhận mật khẩu mới
                    </label>

                    <input
                        id="confirmPassword"
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        required>

                </div>


                <button
                    type="submit"
                    class="btn btn-primary">

                    <i class="fa-solid fa-key"></i>

                    Đổi mật khẩu

                </button>


            </form>

        </div>

    `;


    const form =
        document.getElementById(
            "changePasswordForm"
        );


    form.addEventListener(
        "submit",
        changePassword
    );

}


/*==================================================
                CHANGE PASSWORD API
==================================================*/

async function changePassword(event) {

    event.preventDefault();


    const currentPassword =
        document.getElementById(
            "currentPassword"
        ).value;


    const newPassword =
        document.getElementById(
            "newPassword"
        ).value;


    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        ).value;


    if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
    ) {

        showToast(
            "Vui lòng nhập đầy đủ thông tin."
        );

        return;

    }


    if (
        newPassword !==
        confirmPassword
    ) {

        showToast(
            "Mật khẩu xác nhận không khớp."
        );

        return;

    }


    if (newPassword.length < 6) {

        showToast(
            "Mật khẩu mới phải có ít nhất 6 ký tự."
        );

        return;

    }


    try {

        const result =
            await api(
                "/api/auth/change-password",
                {
                    method:"PUT",

                    body:JSON.stringify({

                        currentPassword,

                        newPassword

                    })

                }
            );


        showToast(
            result.message ||
            "Đổi mật khẩu thành công."
        );


        document.getElementById(
            "changePasswordForm"
        ).reset();

    }

    catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Đổi mật khẩu thất bại."
        );

    }

}