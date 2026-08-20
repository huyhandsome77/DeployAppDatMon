/*==================================================
                CONTACT
==================================================*/

document.addEventListener(

"DOMContentLoaded",

()=>{

    const user = JSON.parse(

        localStorage.getItem(USER_KEY)

    );

    const username =

    document.getElementById(

        "username"

    );

    if(user){

        username.textContent=

        user.fullName;

        document.getElementById(

            "fullName"

        ).value=user.fullName;

        document.getElementById(

            "email"

        ).value=user.email || "";

    }

});


const contactForm =

document.getElementById(

"contactForm"

);

contactForm.addEventListener(

"submit",

function(e){

    e.preventDefault();

    showToast(

        "Cảm ơn bạn đã liên hệ FutureSuShi!"

    );

    contactForm.reset();

});