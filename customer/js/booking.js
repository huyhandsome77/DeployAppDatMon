/*==================================================
                BOOKING
==================================================*/

const bookingForm=document.getElementById("bookingForm");

const reservationList=document.getElementById("reservationList");

/*==================================================
                INIT
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const dateInput = document.getElementById("reservationDate");
        if (dateInput) {
            // Set min date to today (YYYY-MM-DD)
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            dateInput.min = `${yyyy}-${mm}-${dd}`;
            if (!dateInput.value) {
                dateInput.value = `${yyyy}-${mm}-${dd}`;
            }
        }

        bookingForm.addEventListener(
            "submit",
            submitBooking
        );

        loadReservations();
    }
);


/*==================================================
            CREATE RESERVATION
==================================================*/

async function submitBooking(e){
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem(USER_KEY));
    const dateVal = document.getElementById("reservationDate").value.trim();
    const timeVal = document.getElementById("reservationTime").value.trim();

    if (!dateVal || !timeVal) {
        showToast("Vui lòng chọn ngày và khung giờ đặt bàn (24h)!");
        return;
    }

    const formattedTime = timeVal.length === 5 ? `${timeVal}:00` : timeVal;

    const body = {
        guestName: document.getElementById("fullName").value.trim(),
        guestPhone: document.getElementById("phone").value.trim(),
        reservationTime: `${dateVal} ${formattedTime}`,
        numberOfGuests: Number(document.getElementById("numberOfGuests").value),
        note: document.getElementById("note").value.trim(),
        user_id: user ? user.id : null
    };

    try{
        const result = await api(
            "/api/reservations",
            {
                method:"POST",
                body:JSON.stringify(body)
            }
        );

        showToast(result.message);
        bookingForm.reset();

        const dateInput = document.getElementById("reservationDate");
        if (dateInput) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            dateInput.value = `${yyyy}-${mm}-${dd}`;
        }

        if(user){
            document.getElementById("fullName").value = user.fullName || "";
        }

        loadReservations();
    }
    catch(error){
        console.log(error);
        showToast(error.message);
    }
}


/*==================================================
            HISTORY
==================================================*/

async function loadReservations(){

const token=

localStorage.getItem(

TOKEN_KEY

);

if(!token){

reservationList.innerHTML=

`

<div class="empty">

Đăng nhập để xem lịch sử.

</div>

`;

return;

}

try{

const data=

await api(

"/api/reservations/my-reservations"

);

renderReservations(data);

}

catch(error){

console.log(error);

}

}


function renderReservations(list){

reservationList.innerHTML="";

if(!list.length){

reservationList.innerHTML=

`

<div class="empty">

Chưa có lịch đặt bàn.

</div>

`;

return;

}

list.forEach(renderReservation);

}



/*==================================================
            RENDER RESERVATION
==================================================*/

function renderReservation(item){

    reservationList.innerHTML += `

    <div class="reservation-item">

        <h4>

            ${formatDate(item.reservationTime)}

        </h4>

        <p>

            🕒 ${formatTime(item.reservationTime)}

        </p>

        <p>

            👥 ${item.numberOfGuests} người

        </p>

        <p>

             📞 ${item.guestPhone}

        </p>

        <p>

            📝 ${item.note || "Không có"}

        </p>

        <span class="status ${statusClass(item.status)}">

            ${statusText(item.status)}

        </span>

        ${item.status === "PENDING"
            ? `

            <button

                class="btn btn-secondary"

                style="margin-top:15px;width:100%;"

                onclick="cancelReservation(${item.id})">

                Hủy đặt bàn

            </button>

            `
            : ""
        }

    </div>

    `;

}


/*==================================================
            STATUS
==================================================*/

function statusClass(status){

    switch(status){

        case "PENDING":
            return "pending";

        case "CONFIRMED":
            return "confirmed";

        case "CHECKED_IN":
            return "checkedin";

        case "COMPLETED":
            return "completed";

        case "CANCELLED":
            return "cancelled";

        default:
            return "pending";

    }

}

function statusText(status){

    switch(status){

        case "PENDING":
            return "Chờ xác nhận";

        case "CONFIRMED":
            return "Đã xác nhận";

        case "CHECKED_IN":
            return "Đã nhận bàn";

        case "COMPLETED":
            return "Hoàn thành";

        case "CANCELLED":
            return "Đã hủy";

        default:
            return status;

    }

}


/*==================================================
            FORMAT DATE
==================================================*/

function formatDate(date){

    return new Date(date)

    .toLocaleDateString(

        "vi-VN"

    );

}

function formatTime(date){
    return new Date(date).toLocaleTimeString(
        "vi-VN",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    );
}


/*==================================================
            CANCEL
==================================================*/

window.cancelReservation = async function(id){

    if(

        !confirm(

            "Bạn có chắc muốn hủy đặt bàn?"

        )

    ) return;

    try{

        const result=

        await api(

            `/api/reservations/${id}/cancel`,

            {

                method:"PUT"

            }

        );

        showToast(

            result.message ||

            "Đã hủy đặt bàn."

        );

        loadReservations();

    }

    catch(error){

        console.log(error);

        showToast(

            error.message

        );

    }

}


const user = JSON.parse(localStorage.getItem(USER_KEY));

if(user){

    document.getElementById("fullName").value = user.fullName || "";

}

