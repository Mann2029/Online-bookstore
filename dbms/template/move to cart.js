document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-container');

    async function loadCart() {
        const token = localStorage.getItem('token');
        if (!token) { cartContainer.innerHTML = '<h1>Please log in to see your cart.</h1>'; return; }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/cart', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await response.json();

            if (data.success) {
                if (data.items.length === 0) {
                    cartContainer.innerHTML = `
                        <div class="empty-cart">
                            <p>Your shopping cart is empty.</p>
                            <a href="/books" class="btn-primary">Continue Shopping</a>
                        </div>`;
                    return;
                }

                let itemsHTML = `
                    <div class="cart-table-header">
                        <div class="header-product">Product</div>
                        <div class="header-price">Price</div>
                        <div class="header-quantity">Quantity</div>
                        <div class="header-subtotal">Subtotal</div>
                        <div></div>
                    </div>`;

                data.items.forEach(item => {
                    const subtotal = (parseFloat(item.Price) * item.Quantity).toFixed(2);
                    itemsHTML += `
                        <div class="cart-item" data-price="${item.Price}" data-item-id="${item.OrderItemID}">
                            <div class="item-product">
                                <button class="remove-item-btn">&times;</button>
                                <img src="${item.CoverImageURL}" alt="${item.Title}">
                                <span>${item.Title}</span>
                            </div>
                            <div class="item-price">$${parseFloat(item.Price).toFixed(2)}</div>
                            <div class="item-quantity">
                                <input type="number" value="${item.Quantity}" min="1">
                            </div>
                            <div class="item-subtotal">$${subtotal}</div>
                        </div>`;
                });

                const cartHTML = `
                    <h1>Shopping Cart</h1>
                    <div class="cart-grid">
                        <div class="cart-products">${itemsHTML}</div>
                        <div class="cart-totals">
                            <h2>Cart Totals</h2>
                            <div class="totals-row">
                                <span>Subtotal</span>
                                <span id="cart-subtotal">$0.00</span>
                            </div>
                            <div class="totals-row total">
                                <span>Total</span>
                                <span id="cart-total">$0.00</span>
                            </div>
                            <button id="proceed-to-checkout-btn" class="btn-primary">Proceed to Checkout</button>
                        </div>
                    </div>`;

                cartContainer.innerHTML = cartHTML;
                updateTotals();

            } else {
                cartContainer.innerHTML = `<h1>Error: ${data.message}</h1>`;
            }
        } catch (error) {
            cartContainer.innerHTML = '<h1>Error: Could not connect to the server.</h1>';
            console.error(error);
        }
    }

    function updateTotals() {
        const cartItems = document.querySelectorAll('.cart-item');
        let total = 0;
        cartItems.forEach(item => {
            const price = parseFloat(item.dataset.price);
            const quantity = parseInt(item.querySelector('input').value);
            const subtotal = price * quantity;
            item.querySelector('.item-subtotal').textContent = `$${subtotal.toFixed(2)}`;
            total += subtotal;
        });
        document.getElementById('cart-subtotal').textContent = `$${total.toFixed(2)}`;
        document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
    }

    cartContainer.addEventListener('change', (e) => {
        if (e.target.matches('.item-quantity input')) updateTotals();
    });

    cartContainer.addEventListener('click', (e) => {
        if (e.target.matches('.remove-item-btn')) {
            e.target.closest('.cart-item').remove();
            updateTotals();
        }
    });

    loadCart();
});
