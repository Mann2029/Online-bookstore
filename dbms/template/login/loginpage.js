document.addEventListener('DOMContentLoaded', () => {

    // Select the form and input fields
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

    // --- Validation Functions ---
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

    // --- Form Submission Event ---
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Stop the form from submitting the traditional way

        // Clear previous errors before validating again
        clearError(loginIdentifierInput);
        clearError(passwordInput);

        // Run all validations
        const isIdentifierValid = validateLoginIdentifier();
        const isPasswordValid = validatePassword();

        // If all checks pass, proceed
        if (isIdentifierValid && isPasswordValid) {
            alert('Login Successful! (Frontend validation passed)');
            console.log('Form is valid and ready to be sent to the backend.');
            // Here you would typically send the data to your server
        }
    });
});