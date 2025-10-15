document.addEventListener('DOMContentLoaded', () => {
    // Select the form and input fields from your specific HTML structure
    const form = document.querySelector('.wrapper form');
    const loginIdentifierInput = document.querySelector('.input-box input[type="text"]');
    const passwordInput = document.querySelector('.input-box input[type="password"]');

    // Helper function to show a visual error on an input
    const showError = (input) => {
        const inputBox = input.parentElement;
        inputBox.classList.add('error');
    };

    // Helper function to clear a visual error on an input
    const clearError = (input) => {
        const inputBox = input.parentElement;
        inputBox.classList.remove('error');
    };

    // --- Frontend Validation Functions ---
    const validateLoginIdentifier = () => {
        const value = loginIdentifierInput.value.trim();
        const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const phoneRegex = /^\d{10}$/; // Simple check for 10 digits

        if (value === '') {
            showError(loginIdentifierInput);
            alert('Email or Phone Number is required.');
            return false;
        }

        if (emailRegex.test(value) || phoneRegex.test(value)) {
            clearError(loginIdentifierInput);
            return true;
        } else {
            showError(loginIdentifierInput);
            alert('Please enter a valid email or 10-digit phone number.');
            return false;
        }
    };

    const validatePassword = () => {
        const value = passwordInput.value.trim();
        if (value === '') {
            showError(passwordInput);
            alert('Password is required.');
            return false;
        } else {
            clearError(passwordInput);
            return true;
        }
    };

    // --- FORM SUBMISSION LOGIC (Corrected) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the form from submitting the traditional way

        // Step 1: Run frontend validation
        const isIdentifierValid = validateLoginIdentifier();
        const isPasswordValid = validatePassword();

        // Step 2: If frontend validation fails, stop here
        if (!isIdentifierValid || !isPasswordValid) {
            console.log('Frontend validation failed.');
            return; // Stop the function
        }
        
        // Step 3: If validation passes, prepare and send data to the backend
        const formData = {
            loginIdentifier: loginIdentifierInput.value,
            password: passwordInput.value
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message); // "Login successful!"
                // Redirect to the homepage
                window.location.href = 'homepage(after the signin).html';
            } else {
                // Show any error from the backend (e.g., "Invalid credentials")
                alert(`Error: ${result.message}`);
            }

        } catch (error) {
            console.error('Error sending data to the backend:', error);
            alert('Could not connect to the server. Please make sure the backend is running.');
        }
    });
});

