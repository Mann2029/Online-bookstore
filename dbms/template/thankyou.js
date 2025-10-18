document.addEventListener('DOMContentLoaded', () => {
    
    // --- Part 1: Get the Order ID ---
    
    // Create an object to easily search the URL
    const urlParams = new URLSearchParams(window.location.search);
    
    // Get the value of the 'orderId' parameter
    const orderId = urlParams.get('orderId');
    
    // Find the HTML element to display the ID
    const orderIdElement = document.getElementById('order-id');

    // Check if we found an orderId AND the HTML element
    if (orderId && orderIdElement) {
        orderIdElement.textContent = `#${orderId}`;
    } else if (orderIdElement) {
        // Fallback if the orderId is missing from the URL
        orderIdElement.textContent = '(Details not found)';
    }

    
    // --- Part 2: The Confetti Effect ---
    
    try {
        // Settings for the confetti
        const confettiSettings = {
            target: 'confetti-canvas', // ID of our canvas
            max: 120,                  // Number of confetti
            size: 1,
            animate: true,
            props: ['circle', 'square', 'triangle', 'line'],
            colors: [[165,104,246],[230,61,135],[0,199,228],[253,214,126]],
            clock: 25,
            rotate: true,
            width: window.innerWidth,
            height: window.innerHeight,
        };

        // Create and render the confetti
        const confetti = new ConfettiGenerator(confettiSettings);
        confetti.render();

        // Clear the confetti after 6 seconds so it doesn't run forever
        setTimeout(() => {
            confetti.clear();
        }, 6000); // 6000 milliseconds = 6 seconds

    } catch (error) {
        console.error('Confetti animation failed to load:', error);
        // Page will still work, just without confetti
    }
});