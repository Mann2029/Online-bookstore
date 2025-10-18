document.addEventListener('DOMContentLoaded', () => {
    // Find the container where the book cards will be placed
    const bookGridContainer = document.querySelector('.book-grid'); // Use querySelector for class

    // This async function fetches the book data from your Flask API
    async function loadBooks() {
        // Make sure the container exists on the page
        if (!bookGridContainer) {
            console.error('Error: The container for books (.book-grid) was not found.');
            return;
        }

        try {
            // Send a GET request to the /api/books endpoint on your backend
            const response = await fetch('http://127.0.0.1:5000/api/books');
            const data = await response.json();

            // Check if the backend confirmed the request was successful
            if (data.success) {
                // Clear the initial "Loading books..." message
                bookGridContainer.innerHTML = ''; 
                
                if (data.books.length === 0) {
                    bookGridContainer.innerHTML = '<p>No books are available in the library at this time.</p>';
                    return;
                }

                // Loop through each book object returned by the API
                data.books.forEach(book => {
                    // Create the complete HTML for one book card
                    // This creates the link to the detail page with a URL parameter
                    const bookCardHTML = `
                        <a href="book_detail.html?isbn=${book.ISBN}" class="book-link">
                            <div class="book-card">
                                <div class="cover" style="background-image: url('${book.CoverImageURL}');"></div>
                                <div class="btitle">${book.Title}</div>
                                <div class="bauthor">${book.AuthorName}</div>
                                <div class="bprice"><span>$${parseFloat(book.Price).toFixed(2)}</span></div>
                            </div>
                        </a>
                    `;
                    // Add the new HTML for the card to the grid container
                    bookGridContainer.insertAdjacentHTML('beforeend', bookCardHTML);
                });

            } else {
                // If the API returns an error (e.g., success: false)
                bookGridContainer.innerHTML = `<p>Error: Could not load books. ${data.message}</p>`;
            }
        } catch (error) {
            // If the server cannot be reached at all (e.g., backend is not running)
            console.error('Failed to fetch books:', error);
            bookGridContainer.innerHTML = '<p>Error: Could not connect to the server. Please make sure the backend is running.</p>';
        }
    }

    // Call the function to start loading the books as soon as the page is ready
    loadBooks();
});