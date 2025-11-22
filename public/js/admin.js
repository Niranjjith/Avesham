// Admin Dashboard Script

const token = localStorage.getItem("adminToken");
if (!token || token !== "AVESHAM_ADMIN_2025") {
    window.location.href = "./login.html";
}

const backendUrl = "https://avesham.onrender.com/api/admin";

async function loadAdmin() {
    try {
        const res = await fetch(`${backendUrl}/bookings`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json();

        document.getElementById("totalRevenue").innerText = "₹" + data.totalRevenue;
        document.getElementById("totalTickets").innerText = data.totalTickets;
        document.getElementById("dayPassRevenue").innerText = "₹" + data.dayPassRevenue;
        document.getElementById("seasonPassRevenue").innerText = "₹" + data.seasonPassRevenue;

        const tbody = document.querySelector("#bookingTable tbody");
        tbody.innerHTML = "";

        data.bookings.forEach((b, index) => {
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${b.serialNumber}</td>
                    <td>${b.fullName}</td>
                    <td>${b.email}</td>
                    <td>${b.phone}</td>
                    <td>${b.ticketType}</td>
                    <td>${b.quantity}</td>
                    <td>₹${b.totalAmount}</td>
                    <td>${b.paymentId}</td>
                    <td>${new Date(b.timestamp).toLocaleString()}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error("Dashboard Load Error:", error);
        // No popup & no redirect
    }
}

loadAdmin();

function logout() {
    localStorage.removeItem("adminToken");
    window.location.href = "./login.html";
}
