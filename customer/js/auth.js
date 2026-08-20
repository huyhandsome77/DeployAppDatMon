/*==================================================
                AUTH
==================================================*/


/*==================================================
                CURRENT USER
==================================================*/

function getCurrentUser(){

    return JSON.parse(

        localStorage.getItem(USER_KEY) || "null"

    );

}

function getToken(){

    return localStorage.getItem(TOKEN_KEY);

}

function isLogin(){

    return !!getToken();

}

/*==================================================
                LOGIN
==================================================*/

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

        showToast(

            result.message ||

            "Đăng nhập thành công"

        );

        setTimeout(()=>{

            location.href="index.html";

        },600);

    }

    catch(error){

        showToast(

            error.message ||

            "Đăng nhập thất bại"

        );

    }

}

/*==================================================
                REGISTER
==================================================*/

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

            location.href="login.html";

        },700);

    }

    catch(error){

        showToast(

            error.message

        );

    }

}

/*==================================================
                LOGOUT
==================================================*/

function logout(){

    localStorage.removeItem(

        TOKEN_KEY

    );

    localStorage.removeItem(

        USER_KEY

    );

    showToast(

        "Đã đăng xuất"

    );

    setTimeout(()=>{

        location.href="login.html";

    },500);

}

/*==================================================
            REQUIRE LOGIN
==================================================*/

function requireLogin(){

    if(!isLogin()){

        showToast(

            "Vui lòng đăng nhập"

        );

        setTimeout(()=>{

            location.href="login.html";

        },500);

    }

}

/*==================================================
            HEADER USER
==================================================*/

function updateHeader(){

    const user = getCurrentUser();

    const username = document.getElementById(

        "username"

    );

    const loginBtn = document.getElementById(

        "loginBtn"

    );

    if(username){

        username.textContent =

            user ?

            user.fullName :

            "Khách";

    }

    if(loginBtn){

        if(user){

            loginBtn.innerHTML =

            "Đăng xuất";

            loginBtn.onclick = logout;

        }

        else{

            loginBtn.innerHTML =

            "Đăng nhập";

            loginBtn.href =

            "login.html";

        }

    }

}

/*==================================================
            AUTO LOGIN
==================================================*/

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        updateHeader();

    }

);