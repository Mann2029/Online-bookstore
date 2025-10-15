document.addEventListener('DOMContentLoaded', () => {

    const addressFormSection = document.getElementById('address-form-section');
    const addressForm = document.getElementById('address-form');
    const addAddressBtn = document.getElementById('add-address-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const addressContainer = document.getElementById('address-options-container');

    // --- RENDER ORDER SUMMARY ---
    function renderOrderSummary(orderData) {
        const summaryHTML = `
            <div class="card">
                <div class="card-header">
                    <h2>Order Summary</h2>
                    <a href="cart.html" style="font-size: 0.9rem;">Edit Cart</a>
                </div>
                <div id="order-items-container">
                    ${orderData.items.map(item => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 0.9rem;">
                            <span>${item.name} (x${item.quantity})</span>
                            <strong>$${item.subtotal.toFixed(2)}</strong>
                        </div>
                    `).join('')}
                </div>
                <hr>
                <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                    <span>Subtotal</span>
                    <span>$${orderData.subtotal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                    <span>Shipping</span>
                    <span>$${orderData.shipping.toFixed(2)}</span>
                </div>
                <hr>
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem;">
                    <span>Total</span>
                    <span>$${orderData.total.toFixed(2)}</span>
                </div>
            </div>`;
        
        document.getElementById('order-summary-desktop').innerHTML = summaryHTML;
        document.getElementById('order-summary-mobile').innerHTML = summaryHTML;
    }

    // --- ADDRESS FORM LOGIC ---
    function openAddressForm(mode = 'add', card = null) {
        addressForm.reset();
        document.getElementById('address-id').value = '';

        if (mode === 'edit' && card) {
            document.getElementById('form-title').textContent = 'Edit Shipping Address';
            document.getElementById('address-id').value = card.dataset.id;
            document.getElementById('name').value = card.dataset.name;
            document.getElementById('address').value = card.dataset.address;
            document.getElementById('phone').value = card.dataset.phone;
        } else {
            document.getElementById('form-title').textContent = 'Add New Shipping Address';
        }

        addressFormSection.classList.remove('hidden');
        addressFormSection.scrollIntoView({ behavior: 'smooth' });
    }

    function closeAddressForm() {
        addressFormSection.classList.add('hidden');
    }

    addAddressBtn.addEventListener('click', () => openAddressForm('add'));
    cancelBtn.addEventListener('click', closeAddressForm);

    addressContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-edit')) {
            openAddressForm('edit', e.target.closest('.address-card'));
        }
    });

    addressForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('address-id').value;
        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        const phone = document.getElementById('phone').value;

        if (id) { // Editing existing address
            const cardToUpdate = document.querySelector(`.address-card[data-id="${id}"]`);
            cardToUpdate.dataset.name = name;
            cardToUpdate.dataset.address = address;
            cardToUpdate.dataset.phone = phone;
            cardToUpdate.querySelector('strong').textContent = name;
            cardToUpdate.querySelector('p:nth-of-type(1)').innerHTML = address.replace(/, /g, ',<br>');
            cardToUpdate.querySelector('p:nth-of-type(2)').innerHTML = `<i class='bx bxs-phone'></i> ${phone}`;
        } else { // Adding new address
            const newId = Date.now();
            const newCardHTML = `
                <div class="address-card" data-id="${newId}" data-name="${name}" data-address="${address}" data-phone="${phone}">
                    <input type="radio" name="address" id="addr${newId}">
                    <label for="addr${newId}">
                        <strong>${name}</strong>
                        <p>${address.replace(/, /g, ',<br>')}</p>
                        <p><i class='bx bxs-phone'></i> ${phone}</p>
                    </label>
                    <button class="btn-edit">Edit</button>
                </div>`;
            addressContainer.insertAdjacentHTML('beforeend', newCardHTML);
        }
        closeAddressForm();
    });
    
    // --- PAYMENT METHOD TOGGLE ---
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isCard = e.target.value === 'card';
            document.getElementById('credit-card-info').classList.toggle('hidden', !isCard);
            document.getElementById('paypal-info').classList.toggle('hidden', isCard);
        });
    });

    // --- INITIALIZE PAGE ---
    const orderDataString = sessionStorage.getItem('woodStroidCart');
    if (orderDataString) {
        const orderData = JSON.parse(orderDataString);
        renderOrderSummary(orderData);
    } else {
        // Handle case where user lands here with no cart data
        document.getElementById('order-summary-desktop').innerHTML = '<div class="card"><p>Your cart is empty.</p></div>';
        document.getElementById('order-summary-mobile').innerHTML = '<div class="card"><p>Your cart is empty.</p></div>';
    }
});