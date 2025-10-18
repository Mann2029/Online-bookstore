document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-container');

    async function loadCart() {
        // First, get the authentication token from storage.
        const token = sessionStorage.getItem('token');

        // If there is no token, the user is not logged in.
        if (!token) {
            cartContainer.innerHTML = `
                <div class="empty-cart">
                    <h1>Authentication Required</h1>
                    <p>Please log in to view your shopping cart.</p>
                    <a href="loginpage.html" class="btn-primary">Go to Login</a>
                </div>`;
            return;
        }

        try {
            // Send the token in the Authorization header to get the user's specific cart.
            const response = await fetch('http://127.0.0.1:5000/api/cart', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            // Handle cases where the token is expired or invalid
            if (response.status === 401) {
                alert('Your session has expired. Please log in again.');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('userEmail');
                window.location.href = 'loginpage.html';
                return;
            }

            const data = await response.json();

            if (data.success) {
                if (data.items.length === 0) {
                    cartContainer.innerHTML = `
                        <div class="empty-cart">
                            <h1>Your Cart is Empty</h1>
                            <p>Looks like you haven't added any books yet.</p>
                            <a href="book.html" class="btn-primary">Explore the Library</a>
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
                        <div class="cart-item" data-item-id="${item.OrderItemID}">
                            <div class="item-product">
                                <button class="remove-item-btn">&times;</button>
                                <img src="${item.CoverImageURL}" alt="${item.Title}">
                                <span>${item.Title}</span>
                            </div>
                            <div class="item-price">$${parseFloat(item.Price).toFixed(2)}</div>
                            <div class="item-quantity">
                                <input type="number" value="${item.Quantity}" min="1" disabled>
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
                            <div class="totals-row total">
                                <span>Total</span>
                                <span id="cart-total">$${parseFloat(data.total).toFixed(2)}</span>
                            </div>
                            <button id="proceed-to-checkout-btn" class="btn-primary">Proceed to Checkout</button>
                        </div>
                    </div>`;
                
                cartContainer.innerHTML = cartHTML;

            } else {
                cartContainer.innerHTML = `<h1>Error: ${data.message}</h1>`;
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
            cartContainer.innerHTML = '<h1>Error: Could not connect to the server.</h1>';
        }
    }
    
    // --- Function to handle checkout ---
    async function handleCheckout() {
        const token = sessionStorage.getItem('token');
        if (!token) {
            alert('Please log in to proceed to checkout.');
            return;
        }
        
        try {
            const response = await fetch('http://127.0.0.1:5000/api/checkout', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (response.status === 401) {
                alert('Your session has expired. Please log in again.');
                window.location.href = 'loginpage.html';
                return;
            }

            const result = await response.json();
            if (result.success) {
                // If successful, redirect to the payment page with the new OrderID
                window.location.href = `payment.html?orderId=${result.orderId}`;
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Failed to proceed to checkout. Please try again.');
        }
    }

    // Use event delegation for all buttons inside the container
    cartContainer.addEventListener('click', async (e) => {
        // Check if the checkout button was clicked
        if (e.target.id === 'proceed-to-checkout-btn') {
            handleCheckout();
        }

        // Check if a remove button was clicked
        if (e.target.matches('.remove-item-btn')) {
            const itemElement = e.target.closest('.cart-item');
            const itemId = itemElement.dataset.itemId;
            const token = sessionStorage.getItem('token');
            
            if (!token || !itemId) return;

            try {
                const response = await fetch(`http://127.0.0.1:5000/api/cart/remove/${itemId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                });

                if (response.status === 401) {
                    alert('Your session has expired. Please log in again.');
                    window.location.href = 'loginpage.html';
                    return;
                }

                const result = await response.json();
                if (result.success) {
                    alert(result.message);
                    loadCart(); // Reload the cart
                } else {
                    alert(`Error: ${result.message}`);
                }
            } catch (error) {
                alert('Failed to remove item.');
                // New Logout logic
                alert('Your session has expired. Please log in again.');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('userEmail');
                window.location.href = 'loginpage.html';
                
            }
        }
    });

    loadCart();
});
