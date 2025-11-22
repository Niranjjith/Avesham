let selectedTicketType = null;
let selectedTicketPrice = 0;

// Backend URL
const backendUrl = "http://localhost:5000/api/payment";

// Razorpay Key
const RAZORPAY_KEY_ID = "rzp_test_RigiSw2saEwTtc";

// Ticket selection
function selectTicket(element) {
    document.querySelectorAll(".ticket-card").forEach(card => card.classList.remove("selected"));
    element.classList.add("selected");

    selectedTicketType = element.dataset.ticket;
    selectedTicketPrice = parseInt(element.dataset.price);

    const ticketName = element.querySelector("h3").textContent;

    document.getElementById("selected-ticket-info").style.display = "block";
    document.getElementById("selected-ticket-info").innerHTML = `Selected: <strong>${ticketName}</strong> - ₹${selectedTicketPrice}`;

    document.getElementById("summary-ticket").textContent = ticketName;
    document.getElementById("summary-unit-price").textContent = `₹${selectedTicketPrice}`;

    updatePrice();
}

// Update total price
function updatePrice() {
    const quantity = parseInt(document.getElementById("quantity").value) || 0;
    document.getElementById("summary-quantity").textContent = quantity || "-";

    if (selectedTicketPrice && quantity) {
        document.getElementById("summary-total").textContent = `₹${selectedTicketPrice * quantity}`;
    } else {
        document.getElementById("summary-total").textContent = "₹0";
    }
}

// Submit booking and initiate payment
async function submitBooking(event) {
    event.preventDefault();

    if (!selectedTicketType) return alert("Please select a ticket type");
    
    const fullName = document.getElementById("full-name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const quantity = parseInt(document.getElementById("quantity").value);

    if (!fullName || !email || !phone || !quantity) return alert("Please fill in all required fields");
    if (!/^[0-9]{10}$/.test(phone)) return alert("Please enter a valid 10-digit phone number");

    const totalAmount = selectedTicketPrice * quantity;

    // 1. Create Razorpay Order
    const orderRes = await fetch(`${backendUrl}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount })
    });

    const order = await orderRes.json();

    const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "Avesham Season 2",
        description: `${selectedTicketType} - ${quantity} Ticket(s)`,
        order_id: order.id,
        handler: async (response) => {
            const verifyRes = await fetch(`${backendUrl}/verify-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: response.razorpay_order_id,
                    payment_id: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                    fullName,
                    email,
                    phone,
                    selectedTicketType,
                    quantity,
                    totalAmount
                })
            });

            const result = await verifyRes.json();

            if (result.status === "success") {
                document.getElementById("overlay").classList.add("show");
                document.getElementById("success-popup").classList.add("show");
            } else {
                alert("Oops! Something went wrong.\nPayment Failed");
            }
        },
        prefill: { name: fullName, email, contact: phone },
        theme: { color: "#2563eb" }
    };

    new Razorpay(options).open();
}

// Close success popup
function closePopup() {
    document.getElementById("overlay").classList.remove("show");
    document.getElementById("success-popup").classList.remove("show");
}

// ADMIN PANEL (unchanged logic, now loads from DB later or local is fallback)
function openAdminLogin() {
    document.getElementById("admin-login-modal").classList.add("show");
    document.getElementById("login-error").classList.remove("show");
}

function closeAdminLogin() {
    document.getElementById("admin-login-modal").classList.remove("show");
}

function handleLoginKeypress(event) {
    if (event.key === "Enter") verifyAdminLogin();
}

function verifyAdminLogin() {
    const adminId = document.getElementById("admin-id").value;
    const adminPassword = document.getElementById("admin-password").value;
    const errorMsg = document.getElementById("login-error");

    if (adminId === "ADMIN" && adminPassword === "12345") {
        closeAdminLogin();
        openAdminPanel();
    } else {
        errorMsg.classList.add("show");
        setTimeout(() => errorMsg.classList.remove("show"), 3000);
    }
}

function openAdminPanel() {
    document.getElementById("admin-panel").classList.add("show");
}

function closeAdminPanel() {
    document.getElementById("admin-panel").classList.remove("show");
}

// Scroll & FAQ Logic (unchanged)
function toggleFaq(element) {
    document.querySelectorAll(".faq-item").forEach(item => item.classList.remove("active"));
    element.parentElement.classList.add("active");
}

function scrollToBooking() {
    document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("scroll", () => {
    const scrollTop = document.getElementById("scroll-top");
    if (window.pageYOffset > 300) scrollTop.classList.add("show");
    else scrollTop.classList.remove("show");
});
