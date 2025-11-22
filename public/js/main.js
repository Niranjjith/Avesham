
        let selectedTicketType = null;
        let selectedTicketPrice = 0;

        // Select ticket function
        function selectTicket(element) {
            // Remove selection from all cards
            document.querySelectorAll('.ticket-card').forEach(card => {
                card.classList.remove('selected');
            });

            // Add selection to clicked card
            element.classList.add('selected');

            // Store selected ticket info
            selectedTicketType = element.dataset.ticket;
            selectedTicketPrice = parseInt(element.dataset.price);

            // Update display
            const ticketName = element.querySelector('h3').textContent;
            document.getElementById('selected-ticket-info').style.display = 'block';
            document.getElementById('selected-ticket-info').innerHTML = `Selected: <strong>${ticketName}</strong> - ₹${selectedTicketPrice}`;

            // Update summary
            document.getElementById('summary-ticket').textContent = ticketName;
            document.getElementById('summary-unit-price').textContent = `₹${selectedTicketPrice}`;
            
            updatePrice();
        }

        // Update price based on quantity
        function updatePrice() {
            const quantity = parseInt(document.getElementById('quantity').value) || 0;
            
            document.getElementById('summary-quantity').textContent = quantity || '-';
            
            if (selectedTicketPrice && quantity) {
                const total = selectedTicketPrice * quantity;
                document.getElementById('summary-total').textContent = `₹${total}`;
            } else {
                document.getElementById('summary-total').textContent = '₹0';
            }
        }

        // Form submission
        function submitBooking(event) {
            event.preventDefault();

            // Validate ticket selection
            if (!selectedTicketType) {
                alert('Please select a ticket type first');
                return;
            }

            // Get form values
            const fullName = document.getElementById('full-name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const quantity = parseInt(document.getElementById('quantity').value);

            // Basic validation
            if (!fullName || !email || !phone || !quantity) {
                alert('Please fill in all required fields');
                return;
            }

            // Phone validation
            if (!/^[0-9]{10}$/.test(phone)) {
                alert('Please enter a valid 10-digit phone number');
                return;
            }

            // Calculate total amount
            const totalAmount = selectedTicketPrice * quantity;

            // Initialize Razorpay payment
            const options = {
                key: 'rzp_test_demo', // Replace with your Razorpay key
                amount: totalAmount * 100, // Amount in paise (multiply by 100)
                currency: 'INR',
                name: 'Avesham Season 2',
                description: `${selectedTicketType} - ${quantity} Ticket(s)`,
                image: '/placeholder.svg?height=50&width=50',
                handler: function (response) {
                    // Payment successful
                    saveBooking({
                        fullName,
                        email,
                        phone,
                        ticketType: selectedTicketType,
                        quantity,
                        totalAmount,
                        paymentId: response.razorpay_payment_id,
                        timestamp: new Date().toISOString()
                    });

                    // Show success popup
                    document.getElementById('overlay').classList.add('show');
                    document.getElementById('success-popup').classList.add('show');

                    // Reset form
                    document.getElementById('booking-form').reset();
                    document.querySelectorAll('.ticket-card').forEach(card => {
                        card.classList.remove('selected');
                    });
                    selectedTicketType = null;
                    selectedTicketPrice = 0;
                    document.getElementById('selected-ticket-info').style.display = 'none';
                    updatePrice();
                },
                prefill: {
                    name: fullName,
                    email: email,
                    contact: phone
                },
                theme: {
                    color: '#2563eb'
                },
                modal: {
                    ondismiss: function() {
                        alert('Payment cancelled. Please try again.');
                    }
                }
            };

            const razorpay = new Razorpay(options);
            razorpay.open();
        }

        // Save booking to localStorage
        function saveBooking(bookingData) {
            let bookings = JSON.parse(localStorage.getItem('avesham_bookings') || '[]');
            bookings.push(bookingData);
            localStorage.setItem('avesham_bookings', JSON.stringify(bookings));
        }

        // Admin authentication functions
        function openAdminLogin() {
            document.getElementById('admin-login-modal').classList.add('show');
            document.getElementById('admin-id').value = '';
            document.getElementById('admin-password').value = '';
            document.getElementById('login-error').classList.remove('show');
        }

        function closeAdminLogin() {
            document.getElementById('admin-login-modal').classList.remove('show');
        }

        function handleLoginKeypress(event) {
            if (event.key === 'Enter') {
                verifyAdminLogin();
            }
        }

        function verifyAdminLogin() {
            const adminId = document.getElementById('admin-id').value;
            const adminPassword = document.getElementById('admin-password').value;
            const errorMsg = document.getElementById('login-error');

            // Verify credentials
            if (adminId === 'ADMIN' && adminPassword === '12345') {
                closeAdminLogin();
                openAdminPanel();
            } else {
                errorMsg.classList.add('show');
                // Hide error after 3 seconds
                setTimeout(() => {
                    errorMsg.classList.remove('show');
                }, 3000);
            }
        }

        // Admin panel functions
        function openAdminPanel() {
            document.getElementById('admin-panel').classList.add('show');
            displayBookings();
        }

        function closeAdminPanel() {
            document.getElementById('admin-panel').classList.remove('show');
        }

        function displayBookings() {
            const bookings = JSON.parse(localStorage.getItem('avesham_bookings') || '[]');
            const container = document.getElementById('bookings-display');

            if (bookings.length === 0) {
                container.innerHTML = '<p class="no-bookings">No bookings yet</p>';
                return;
            }

            let tableHTML = `
                <table class="bookings-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Date & Time</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Ticket Type</th>
                            <th>Qty</th>
                            <th>Amount</th>
                            <th>Payment ID</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            bookings.forEach((booking, index) => {
                const date = new Date(booking.timestamp);
                tableHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
                        <td>${booking.fullName}</td>
                        <td>${booking.email}</td>
                        <td>${booking.phone}</td>
                        <td>${booking.ticketType}</td>
                        <td>${booking.quantity}</td>
                        <td>₹${booking.totalAmount}</td>
                        <td>${booking.paymentId}</td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            container.innerHTML = tableHTML;
        }

        // Download bookings as Excel
        function downloadExcel() {
            const bookings = JSON.parse(localStorage.getItem('avesham_bookings') || '[]');

            if (bookings.length === 0) {
                alert('No bookings to export');
                return;
            }

            // Prepare data for Excel
            const excelData = bookings.map((booking, index) => {
                const date = new Date(booking.timestamp);
                return {
                    'Sr. No': index + 1,
                    'Date': date.toLocaleDateString(),
                    'Time': date.toLocaleTimeString(),
                    'Full Name': booking.fullName,
                    'Email': booking.email,
                    'Phone': booking.phone,
                    'Ticket Type': booking.ticketType,
                    'Quantity': booking.quantity,
                    'Total Amount (₹)': booking.totalAmount,
                    'Payment ID': booking.paymentId
                };
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);
            
            // Set column widths
            ws['!cols'] = [
                {wch: 8},  // Sr. No
                {wch: 12}, // Date
                {wch: 12}, // Time
                {wch: 20}, // Full Name
                {wch: 25}, // Email
                {wch: 15}, // Phone
                {wch: 15}, // Ticket Type
                {wch: 10}, // Quantity
                {wch: 15}, // Total Amount
                {wch: 25}  // Payment ID
            ];

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Bookings');

            // Generate filename with current date
            const filename = `Avesham_Season2_Bookings_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Download
            XLSX.writeFile(wb, filename);
        }

        // Close popup
        function closePopup() {
            document.getElementById('overlay').classList.remove('show');
            document.getElementById('success-popup').classList.remove('show');
        }

        // FAQ toggle
        function toggleFaq(element) {
            const faqItem = element.parentElement;
            const isActive = faqItem.classList.contains('active');

            // Close all FAQs
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });

            // Toggle current FAQ
            if (!isActive) {
                faqItem.classList.add('active');
            }
        }

        // Scroll to booking section
        function scrollToBooking() {
            document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        }

        // Scroll to top
        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Show/hide scroll to top button
        window.addEventListener('scroll', () => {
            const scrollTop = document.getElementById('scroll-top');
            if (window.pageYOffset > 300) {
                scrollTop.classList.add('show');
            } else {
                scrollTop.classList.remove('show');
            }
        });
