document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    // Updated to get new fields
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const phoneNumber = document.getElementById('phoneNumber');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const terms = document.getElementById('terms');

    // Function to show error message
    const showError = (input, message) => {
        const inputGroup = input.parentElement;
        inputGroup.classList.add('error');
        const errorDiv = inputGroup.querySelector('.error-message');
        errorDiv.textContent = message;
    };

    // Function to show success
    const showSuccess = (input) => {
        const inputGroup = input.parentElement;
        inputGroup.classList.remove('error');
        const errorDiv = inputGroup.querySelector('.error-message');
        errorDiv.textContent = '';
    };

    // Function to check if a field is empty
    const checkRequired = (inputs) => {
        let allValid = true;
        inputs.forEach(input => {
            if (input.value.trim() === '') {
                showError(input, `${getFieldName(input)} is required`);
                allValid = false;
            } else {
                showSuccess(input);
            }
        });
        return allValid;
    };

    // Function to validate email format
    const checkEmail = (input) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (input.value.trim() !== '' && !re.test(String(input.value).toLowerCase())) {
            showError(input, 'Email is not valid');
            return false;
        }
        return true;
    };
    
    // Function to validate phone number format
    const checkPhoneNumber = (input) => {
        const re = /^\d{10}$/; // Simple check for 10 digits
        if (input.value.trim() !== '' && !re.test(input.value)) {
            showError(input, 'Phone number must be 10 digits');
            return false;
        }
        return true;
    };

    // Function to check password length
    const checkPasswordLength = (input) => {
        if (input.value.trim() !== '' && input.value.length < 8) {
            showError(input, 'Password must be at least 8 characters');
            return false;
        }
        return true;
    };

    // Function to check if terms are agreed
    const checkTerms = (input) => {
        if (!input.checked) {
            // You can create a way to show error for checkbox if needed
            alert('You must agree to the terms and conditions.');
            return false;
        }
        return true;
    };

    // Helper to get field names for error messages
    const getFieldName = (input) => {
        const id = input.id;
        // This creates a readable name from the camelCase id
        return id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Run all validation checks
        const isRequiredValid = checkRequired([firstName, lastName, phoneNumber, email, password]);
        const isEmailFormatValid = checkEmail(email);
        const isPhoneFormatValid = checkPhoneNumber(phoneNumber);
        const isPasswordFormatValid = checkPasswordLength(password);
        const areTermsAgreed = checkTerms(terms);

        if (isRequiredValid && isEmailFormatValid && isPhoneFormatValid && isPasswordFormatValid && areTermsAgreed) {
            alert('Registration Successful! (Frontend Validation Passed)');
            console.log('Form is valid and ready for the backend.');
        } else {
            console.log('Form validation failed.');
        }
    });
});