document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.getElementById('product-container');
    const urlParams = new URLSearchParams(window.location.search);
    const isbn = urlParams.get('isbn');

    // ... (Your existing functions like generateOrderId, loadBookDetails, etc., remain the same) ...

    async function loadBookDetails() {
        if (!mainContainer) {
            console.error('Error: Main container not found.');
            return;
        }

        if (!isbn) {
            mainContainer.innerHTML = '<h1>Error: No book selected.</h1>';
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/book/${isbn}`);
            const data = await response.json();

            if (data.success && data.book) {
                const book = data.book;
                const detailPageHTML = `
                    <div class="product-container">
                        <div class="product-image">
                            <img src="${book.CoverImageURL}" alt="Cover of ${book.Title}">
                        </div>
                        <div class="product-info">
                            <h1 class="book-title">${book.Title}</h1>
                            <p class="book-author">by <a href="#">${book.AuthorName}</a></p>
                            <div class="book-price">$${parseFloat(book.Price).toFixed(2)}</div>
                            <div class="book-description">
                                <p>${book.Description || "Description not available."}</p>
                            </div>
                            <div class="book-meta">
                                <p><strong>Author:</strong> ${book.AuthorName || 'N/A'}</p>
                                <p><strong>ISBN:</strong> ${book.ISBN}</p>
                            </div>
                            <div class="purchase-actions">
                                <button id="add-to-cart-btn" class="btn btn-add-to-cart">Add to Cart</button>
                                <button id="buy-now-btn" class="btn btn-buy-now">Buy Now</button>
                            </div>
                        </div>
                    </div>`;

                mainContainer.innerHTML = detailPageHTML;
                document.title = `${book.Title} - BookNest`;

                // Attach button listeners
                document.getElementById('add-to-cart-btn').addEventListener('click', handleAddToCart);
                document.getElementById('buy-now-btn').addEventListener('click', handleBuyNow);

            } else {
                mainContainer.innerHTML = `<h1>Error: ${data.message || "Book not found."}</h1>`;
            }
        } catch (error) {
            console.error('Failed to fetch book details:', error);
            mainContainer.innerHTML = '<h1>Error: Could not connect to the server.</h1>';
        }
    }


    // === "ADD TO CART" FUNCTION WITH ENHANCED LOGIN CHECK ===
    async function handleAddToCart() {
        const token = sessionStorage.getItem('token');
        if (!token) {
            alert('Please log in or register to add items to your cart.');
            sessionStorage.setItem('redirectUrl', window.location.href);
            window.location.href = 'loginpage.html';
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/add_to_cart', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ isbn: isbn, quantity: 1 })
            });

            // THE FIX IS HERE: Check if the token was rejected by the server
            if (response.status === 401) {
                alert('Your session has expired. Please log in again.');
                sessionStorage.removeItem('token'); // Clear the invalid token
                sessionStorage.setItem('redirectUrl', window.location.href);
                window.location.href = 'loginpage.html';
                return;
            }

            const result = await response.json();
            alert(result.message);
            if (result.success) window.location.href = 'move to cart.html';

        } catch (error) {
            alert('Failed to add item. Is the server running?');
            console.error(error);
        }
    }

    // === "BUY NOW" FUNCTION WITH ENHANCED LOGIN CHECK ===
    async function handleBuyNow() {
        const token = sessionStorage.getItem('token');
        if (!token) {
            alert('Please log in or register to purchase an item.');
            sessionStorage.setItem('redirectUrl', window.location.href);
            window.location.href = 'loginpage.html';
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/create_order_for_payment', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ isbn: isbn, quantity: 1 })
            });

            // THE FIX IS HERE: Check if the token was rejected by the server
            if (response.status === 401) {
                alert('Your session has expired. Please log in again.');
                sessionStorage.removeItem('token'); // Clear the invalid token
                sessionStorage.setItem('redirectUrl', window.location.href);
                window.location.href = 'loginpage.html';
                return;
            }
            
            const result = await response.json();
            if (result.success) {
                window.location.href = `payment.html?orderId=${result.orderId}`;
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            alert('Failed to proceed. Is the server running?');
            console.error(error);
        }
    }

    loadBookDetails();
});

