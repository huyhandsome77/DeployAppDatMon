/*==================================================
                REVIEW
==================================================*/

const reviewForm = document.getElementById("reviewForm");
const reviewList = document.getElementById("reviewList");
const stars = document.querySelectorAll("#starRating i");

let rating = 5;

/*==================================================
                STAR RATING
==================================================*/

stars.forEach(star => {

    star.addEventListener("click", () => {

        rating = Number(star.dataset.value);

        updateStars();

    });

});

function updateStars() {

    stars.forEach(star => {

        if (Number(star.dataset.value) <= rating) {

            star.classList.remove("fa-regular");
            star.classList.add("fa-solid");
            star.classList.add("active");

        } else {

            star.classList.remove("fa-solid");
            star.classList.add("fa-regular");
            star.classList.remove("active");

        }

    });

}

updateStars();



/*==================================================
                RENDER
==================================================*/

function renderReview(review){

    reviewList.innerHTML += `

    <div class="review-card">

        <h3>

            ${review.user?.fullName || "Khách hàng"}

        </h3>

        <div class="stars">

            ${renderStars(review.rating)}

        </div>

        <strong>

            ${review.dish_name || "Đánh giá nhà hàng"}

        </strong>

        <p>

            ${review.content}

        </p>

    </div>

    `;

}


/*==================================================
                SUBMIT
==================================================*/

if(reviewForm){

    reviewForm.addEventListener(

"submit",

async function(e){

    e.preventDefault();

    const user = JSON.parse(

        localStorage.getItem(USER_KEY)

    );

    if(!user){

        showToast(

            "Vui lòng đăng nhập."

        );

        return;

    }

    const body={

        user_id:user.id,

        phone:user.phone,

        dish_name:

        document.getElementById(

            "reviewTitle"

        ).value,

        content:

        document.getElementById(

            "reviewContent"

        ).value,

        rating:rating

    };

    try{

        const result=

        await api(

            "/api/reviews",

            {

                method:"POST",

                body:JSON.stringify(body)

            }

        );

        showToast(

            result.message

        );

        reviewForm.reset();

        rating=5;

        updateStars();

        loadReviews();

    }

    catch(error){

        console.log(error);

        showToast(

            error.message

        );

    }

})
};



/*==================================================
                LOAD REVIEW
==================================================*/

async function loadReviews(){

    try{

        const data = await api("/api/reviews");

        renderReviews(data.reviews);

    }

    catch(error){

        console.log(error);

    }

}

/*==================================================
                RENDER REVIEWS
==================================================*/

function renderReviews(reviews){

    reviewList.innerHTML = "";

    if(!reviews || reviews.length===0){

        reviewList.innerHTML = `

        <div class="empty">

            Chưa có đánh giá.

        </div>

        `;

        return;

    }

    reviews.forEach(renderReview);

}


function renderStars(number){

    let html="";

    for(let i=1;i<=5;i++){

        if(i<=number){

            html += '<i class="fa-solid fa-star active"></i>';

        }

        else{

            html += '<i class="fa-regular fa-star"></i>';

        }

    }

    return html;

}

updateStars();

loadReviews();