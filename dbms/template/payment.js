document.addEventListener('DOMContentLoaded', () => {
    const orderId = new URLSearchParams(window.location.search).get('orderId');
    const token = sessionStorage.getItem('token');
    const userEmail = sessionStorage.getItem('userEmail');

    // UI Elements from your payment.html
    const desktopSummaryContainer = document.getElementById('order-summary-desktop');
    const mobileSummaryContainer = document.getElementById('order-summary-mobile');
    const addressContainer = document.getElementById('address-options-container');
    const addAddressBtn = document.getElementById('add-address-btn');
    const addressFormSection = document.getElementById('address-form-section');
    const cancelBtn = document.getElementById('cancel-btn');
    const addressForm = document.getElementById('address-form');
    const checkoutDetails = document.querySelector('.checkout-details');
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    const creditCardInfo = document.getElementById('credit-card-info');
    const paypalInfo = document.getElementById('paypal-info');

    /**
     * Fetches and displays the user's saved shipping addresses from the backend.
     */
    async function loadAddresses() {
        if (!token) return;

        try {
            const response = await fetch('http://127.0.0.1:5000/api/addresses', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await response.json();

            if (data.success && data.addresses.length > 0) {
                addressContainer.innerHTML = ''; // Clear placeholder
                data.addresses.forEach((addr, index) => {
                    const isSelected = index === 0; // Select the first address by default
                    const addressCardHTML = `
                        <div class="address-card ${isSelected ? 'selected' : ''}" data-id="${addr.AddressID}">
                            <input type="radio" name="address" id="addr${addr.AddressID}" ${isSelected ? 'checked' : ''}>
                            <label for="addr${addr.AddressID}">
                                <strong>${addr.FullName}</strong>
                                <p>${addr.StreetAddress}</p>
                                <p><i class='bx bxs-phone'></i> ${addr.PhoneNumber}</p>
                            </label>
                            <button class="btn-edit">Edit</button>
                        </div>
                    `;
                    addressContainer.insertAdjacentHTML('beforeend', addressCardHTML);
                });
            } else {
                addressContainer.innerHTML = '<p class="placeholder">No saved addresses found. Please add one.</p>';
            }
        } catch (error) {
            console.error('Failed to load addresses:', error);
            addressContainer.innerHTML = '<p class="placeholder">Could not load addresses.</p>';
        }
    }

    /**
     * Fetches the order details from the backend and builds the summary section.
     */
    async function loadOrderSummary() {
        if (!token) {
            setSummaryError('<h2>Please log in to complete your payment.</h2>');
            return;
        }
        if (!orderId) {
            setSummaryError('<h2>Error: No order specified.</h2>');
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/order/${orderId}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await response.json();

            if (data.success) {
                const order = data.order;
                const summaryHTML = `
                    <h2>Order Summary</h2>
                    <div class="summary-row">
                        <span>Billed to</span>
                        <strong>${userEmail || 'N/A'}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Order ID</span>
                        <strong>#${order.OrderID}</strong>
                    </div>
                    <div class="summary-row summary-total">
                        <span>Total</span>
                        <strong>$${parseFloat(order.TotalAmount).toFixed(2)}</strong>
                    </div>
                    <button id="confirm-payment-btn" class="btn btn-primary" style="width: 100%; margin-top: 20px;">
                        Pay $${parseFloat(order.TotalAmount).toFixed(2)}
                    </button>
                `;
                desktopSummaryContainer.innerHTML = summaryHTML;
                mobileSummaryContainer.innerHTML = summaryHTML;
            } else {
                setSummaryError(`<h2>Error: ${data.message}</h2>`);
            }
        } catch (error) {
            setSummaryError('<h2>Error connecting to server.</h2>');
        }
    }
    
    /**
     * Handles the final payment submission to the backend.
     */
    async function handlePayment(e) {
        e.preventDefault();
        
        const totalAmount = desktopSummaryContainer.querySelector('.summary-total strong').textContent.replace('$', '');
        const paymentData = {
            orderId: orderId,
            totalAmount: totalAmount
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/process_payment', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(paymentData)
            });
            const result = await response.json();
            alert(result.message);
            if(result.success) {
                // Redirect to a thank you page or homepage after successful payment
                window.location.href = `thankyou.html?orderId=${orderId}`;
            }
        } catch (error) {
            alert('Payment failed. Please try again.');
        }
    }

    /**
     * Shows or hides the "Add New Address" form.
     */
    function toggleAddressForm(show) {
        const mainCards = checkoutDetails.querySelectorAll('.card:not(#address-form-section)');
        if (show) {
            mainCards.forEach(card => card.classList.add('hidden'));
            addressFormSection.classList.remove('hidden');
        } else {
            mainCards.forEach(card => card.classList.remove('hidden'));
            addressFormSection.classList.add('hidden');
            addressForm.reset();
        }
    }

    /**
     * Handles saving a new address to the backend.
     */
    async function handleSaveAddress(e) {
        e.preventDefault();
        const newAddress = {
            name: document.getElementById('name').value,
            address: document.getElementById('address').value,
            phone: document.getElementById('phone').value,
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/addresses/add', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(newAddress)
            });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                toggleAddressForm(false); // Hide the form
                loadAddresses(); // Reload the address list to show the new one
            }
        } catch (error) {
            alert('Failed to save address. Please try again.');
        }
    }

    // Helper function to set error messages in both summary views
    function setSummaryError(html) {
        desktopSummaryContainer.innerHTML = html;
        mobileSummaryContainer.innerHTML = html;
    }
    
    // --- UI EVENT LISTENERS ---
    addAddressBtn.addEventListener('click', () => toggleAddressForm(true));
    cancelBtn.addEventListener('click', () => toggleAddressForm(false));
    addressForm.addEventListener('submit', handleSaveAddress);

    // Event delegation for dynamically created and static elements
    document.body.addEventListener('click', (e) => {
        if (e.target.id === 'confirm-payment-btn') {
            handlePayment(e);
        }
        if (e.target.closest('.address-card')) {
            document.querySelectorAll('.address-card').forEach(card => card.classList.remove('selected'));
            e.target.closest('.address-card').classList.add('selected');
        }
    });

    paymentOptions.forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.payment-method').forEach(el => el.classList.remove('selected'));
            e.target.closest('.payment-method').classList.add('selected');

            if (e.target.value === 'card') {
                creditCardInfo.classList.remove('hidden');
                paypalInfo.classList.add('hidden');
            } else {
                creditCardInfo.classList.add('hidden');
                paypalInfo.classList.remove('hidden');
            }
        });
    });

    // Initial function calls to build the page
    loadOrderSummary();
    loadAddresses();
});

