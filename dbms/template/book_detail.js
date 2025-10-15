document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.getElementById('product-container');
    const urlParams = new URLSearchParams(window.location.search);
    const isbn = urlParams.get('isbn');

    async function loadBookDetails() {
        if (!mainContainer) return;

        if (!isbn) {
            mainContainer.innerHTML = '<h1>Error: No book selected.</h1>';
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/book/${isbn}`);
            const data = await response.json();

            if (data.success) {
                const book = data.book;
                const detailHTML = `
                    <div class="product-container">
                        <div class="product-image">
                            <img src="${book.CoverImageURL}" alt="${book.Title}">
                        </div>
                        <div class="product-info">
                            <h1 class="book-title">${book.Title}</h1>
                            <p class="book-author">by <a href="#">${book.AuthorName}</a></p>
                            <div class="book-price">$${parseFloat(book.Price).toFixed(2)}</div>
                            <div class="book-description"><p>${book.Description || 'No description available.'}</p></div>
                            <div class="book-meta">
                                <p><strong>Publisher:</strong> ${book.PublisherName || 'N/A'}</p>
                                <p><strong>ISBN:</strong> ${book.ISBN}</p>
                            </div>
                            <div class="purchase-actions">
                                <button id="add-to-cart-btn" class="btn btn-add-to-cart">Add to Cart</button>
                                <button id="buy-now-btn" class="btn btn-buy-now">Buy Now</button>
                            </div>
                        </div>
                    </div>`;

                mainContainer.innerHTML = detailHTML;
                document.title = `${book.Title} - BookNest`;

                document.getElementById('add-to-cart-btn').addEventListener('click', handleAddToCart);
                document.getElementById('buy-now-btn').addEventListener('click', handleBuyNow);

            } else {
                mainContainer.innerHTML = `<h1>Error: ${data.message}</h1>`;
            }
        } catch (error) {
            mainContainer.innerHTML = '<h1>Error: Could not connect to the server.</h1>';
            console.error(error);
        }
    }

    async function handleAddToCart() {
        const token = localStorage.getItem('token');
        if (!token) { alert('Please log in first.'); return; }

        const payload = { isbn: isbn, quantity: 1 };
        try {
            const response = await fetch('http://127.0.0.1:5000/api/create_order_for_payment', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            alert(result.message || (result.success ? 'Book added to cart!' : 'Failed to add item.'));
            if (result.success) window.location.href = 'cart.html';
        } catch (error) {
            alert('Failed to add item. Is the server running?');
            console.error(error);
        }
    }

    async function handleBuyNow() {
        const token = localStorage.getItem('token');
        if (!token) { alert('Please log in first.'); return; }

        const payload = { isbn: isbn, quantity: 1 };
        try {
            const response = await fetch('http://127.0.0.1:5000/api/create_order_for_payment', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(payload)
            });
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
