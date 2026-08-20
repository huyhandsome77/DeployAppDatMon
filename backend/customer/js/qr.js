/*==================================================
                    QR SCANNER
==================================================*/

let html5QrCode = null;
let qrScanning = false;
let qrProcessing = false;

/*==================================================
                HELPER GETTERS
==================================================*/

function getQrModal() {
    return document.getElementById("qrModal");
}

function getQrStatus() {
    return document.getElementById("qr-status");
}

function getQrReaderElement() {
    return document.getElementById("qr-reader");
}

function getQrLinkInput() {
    return document.getElementById("qrLinkInput");
}

/*==================================================
                OPEN QR MODAL
==================================================*/

function openQrScanner() {
    const modal = getQrModal();
    if (!modal) {
        if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/customer/') && !window.location.pathname.endsWith('/customer')) {
            window.location.href = "index.html#open-qr";
            return;
        }
        return;
    }

    modal.classList.remove("hidden");
    qrProcessing = false;

    setQrStatus("Đang mở camera...", "loading");

    setTimeout(() => {
        startQrScanner();
    }, 200);
}

/*==================================================
                CLOSE QR MODAL
==================================================*/

async function closeQrScanner() {
    const modal = getQrModal();
    await stopQrScanner();
    if (modal) {
        modal.classList.add("hidden");
    }
}

/*==================================================
                QR STATUS
==================================================*/

function setQrStatus(message, type = "info") {
    const statusEl = getQrStatus();
    if (!statusEl) return;

    let icon = "fa-camera";
    if (type === "success") icon = "fa-circle-check";
    if (type === "error") icon = "fa-circle-exclamation";
    if (type === "loading") icon = "fa-spinner fa-spin";

    statusEl.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    statusEl.className = `qr-status ${type}`;
}

/*==================================================
                START SCANNER
==================================================*/

async function startQrScanner() {
    const readerEl = getQrReaderElement();
    if (!readerEl) return;

    if (typeof Html5Qrcode === "undefined") {
        setQrStatus("Trình quét QR đang tải hoặc chưa sẵn sàng. Bạn có thể nhập mã bàn hoặc dán link ở ô bên dưới.", "info");
        return;
    }

    try {
        if (html5QrCode) {
            await stopQrScanner();
        }

        html5QrCode = new Html5Qrcode("qr-reader");

        const config = {
            fps: 10,
            qrbox: {
                width: 250,
                height: 250
            },
            aspectRatio: 1
        };

        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onQrSuccess,
            onQrError
        );

        qrScanning = true;
        setQrStatus("Đưa mã QR vào khung để quét...", "info");
    } catch (error) {
        console.warn("QR Camera Scanner Info:", error);
        setQrStatus("Không thể mở camera. Bạn có thể nhập mã bàn hoặc dán link gọi món ở ô bên dưới.", "info");
    }
}

/*==================================================
                QR ERROR
==================================================*/

function onQrError(errorMessage) {
    // Không cần hiển thị lỗi liên tục khi camera đang quét
}

/*==================================================
                QR SUCCESS
==================================================*/

async function onQrSuccess(decodedText) {
    if (qrProcessing) return;
    qrProcessing = true;

    console.log("Scanned QR Code:", decodedText);
    let qr = decodedText;

    try {
        if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
            const url = new URL(decodedText);
            const qrParam = url.searchParams.get("qr") || url.searchParams.get("table") || url.searchParams.get("tableId");
            if (qrParam) {
                qr = qrParam;
            } else {
                const parts = url.pathname.split("/").filter(Boolean);
                const tableIndex = parts.indexOf("table");
                if (tableIndex !== -1 && parts[tableIndex + 1]) {
                    qr = parts[tableIndex + 1];
                } else if (parts.length > 0) {
                    qr = parts[parts.length - 1];
                }
            }
        }
    } catch (error) {
        console.log("QR URL parsing error:", error);
    }

    await verifyQrAndOpenMenu(qr);
}

/*==================================================
            HANDLE QR LINK / CODE INPUT
==================================================*/

async function handleQrLink() {
    const inputEl = getQrLinkInput();
    const value = inputEl ? inputEl.value.trim() : "";

    if (!value) {
        setQrStatus("Vui lòng nhập mã bàn hoặc link QR.", "error");
        return;
    }

    let qr = value;

    if (value.startsWith("http://") || value.startsWith("https://")) {
        try {
            const url = new URL(value);
            const qrParam = url.searchParams.get("qr") || url.searchParams.get("table") || url.searchParams.get("tableId");
            if (qrParam) {
                qr = qrParam;
            } else {
                const parts = url.pathname.split("/").filter(Boolean);
                const tableIndex = parts.indexOf("table");
                if (tableIndex !== -1 && parts[tableIndex + 1]) {
                    qr = parts[tableIndex + 1];
                } else if (parts.length > 0) {
                    qr = parts[parts.length - 1];
                }
            }
        } catch (error) {
            console.error("Link parsing error:", error);
        }
    }

    console.log("QR/Table value to verify:", qr);
    await verifyQrAndOpenMenu(qr);
}

/*==================================================
            VERIFY QR AND OPEN MENU
==================================================*/

async function verifyQrAndOpenMenu(qr) {
    if (!qr) {
        setQrStatus("Mã QR không hợp lệ.", "error");
        qrProcessing = false;
        return;
    }

    setQrStatus("Đang kiểm tra mã bàn...", "loading");

    try {
        const table = await api(`/api/tables/qr/${encodeURIComponent(qr)}`);

        if (!table) {
            throw new Error("Không tìm thấy bàn với mã này.");
        }

        /*
         * Lưu thông tin bàn vào SessionStorage
         */
        sessionStorage.setItem("appdatmon_table_qr", table.qrCode || qr);
        sessionStorage.setItem("appdatmon_table", JSON.stringify(table));

        setQrStatus(`Đã xác nhận Bàn #${table.tableNumber || table.id || ""}`, "success");

        await stopQrScanner();

        setTimeout(() => {
            window.location.href = `menu.html?qr=${encodeURIComponent(table.qrCode || qr)}&table=${table.tableNumber}&tableId=${table.id}`;
        }, 500);
    } catch (error) {
        console.error("QR validation error:", error);
        setQrStatus(error.message || "Không thể xác thực mã bàn.", "error");
        qrProcessing = false;
    }
}

/*==================================================
                STOP SCANNER
==================================================*/

async function stopQrScanner() {
    if (!html5QrCode) return;

    try {
        if (qrScanning) {
            await html5QrCode.stop();
        }
    } catch (error) {
        console.log("Stop QR scanner warning:", error);
    }

    try {
        html5QrCode.clear();
    } catch (error) {
        console.log("Clear QR scanner warning:", error);
    }

    html5QrCode = null;
    qrScanning = false;
}

/*==================================================
                GLOBAL EXPORTS
==================================================*/

window.openQrScanner = openQrScanner;
window.closeQrScanner = closeQrScanner;
window.handleQrLink = handleQrLink;
window.verifyQrAndOpenMenu = verifyQrAndOpenMenu;

/*==================================================
                EVENTS BINDING
==================================================*/

document.addEventListener("click", function(e) {
    if (e.target.closest("#closeQrModal") || e.target.classList.contains("qr-modal-overlay")) {
        e.preventDefault();
        closeQrScanner();
        return;
    }

    if (e.target.closest("#qrLinkBtn")) {
        e.preventDefault();
        handleQrLink();
        return;
    }
});

document.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && e.target && e.target.id === "qrLinkInput") {
        e.preventDefault();
        handleQrLink();
    }
});

// Auto open QR if navigated with #open-qr
if (window.location.hash === "#open-qr") {
    window.addEventListener("DOMContentLoaded", () => {
        setTimeout(openQrScanner, 300);
    });
}