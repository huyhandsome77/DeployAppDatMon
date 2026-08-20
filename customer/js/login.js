/*==================================================
                LOGIN PAGE
==================================================*/

// If already logged in, redirect immediately to customer index
if (typeof isLogin === "function" && isLogin()) {
    location.replace("index.html");
}

document.addEventListener("DOMContentLoaded", () => {
    // Secondary check in case scripts loaded asynchronously
    if (typeof isLogin === "function" && isLogin()) {
        location.replace("index.html");
        return;
    }

    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");
    const loginBox = document.getElementById("loginBox");
    const registerBox = document.getElementById("registerBox");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginTab) {
        loginTab.onclick = showLogin;
    }
    if (registerTab) {
        registerTab.onclick = showRegister;
    }

    /*==================================================
                    LOGIN FORM
    ==================================================*/
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const accountInput = document.getElementById("account");
            const passwordInput = document.getElementById("password");

            const account = accountInput ? accountInput.value.trim() : "";
            const password = passwordInput ? passwordInput.value : "";

            if (!account || !password) {
                showToast("Vui lòng nhập đầy đủ thông tin.");
                return;
            }

            await login(account, password);
        });
    }

    /*==================================================
                    REGISTER FORM
    ==================================================*/
    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const fullName = document.getElementById("fullName")?.value.trim() || "";
            const email = document.getElementById("email")?.value.trim() || "";
            const phone = document.getElementById("phone")?.value.trim() || "";
            const username = document.getElementById("username")?.value.trim() || "";
            const password = document.getElementById("registerPassword")?.value || "";

            if (!fullName || !phone || !username || !password) {
                showToast("Vui lòng nhập đầy đủ thông tin bắt buộc.");
                return;
            }

            await register({
                fullName,
                email,
                phone,
                username,
                password
            });
        });
    }
});

/*==================================================
            SHOW REGISTER
==================================================*/
function showRegister() {
    const loginBox = document.getElementById("loginBox");
    const registerBox = document.getElementById("registerBox");
    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");

    if (loginBox) loginBox.classList.add("hidden");
    if (registerBox) registerBox.classList.remove("hidden");
    if (registerTab) registerTab.classList.add("active");
    if (loginTab) loginTab.classList.remove("active");
}

/*==================================================
            SHOW LOGIN
==================================================*/
function showLogin() {
    const loginBox = document.getElementById("loginBox");
    const registerBox = document.getElementById("registerBox");
    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");

    if (loginBox) loginBox.classList.remove("hidden");
    if (registerBox) registerBox.classList.add("hidden");
    if (loginTab) loginTab.classList.add("active");
    if (registerTab) registerTab.classList.remove("active");
}