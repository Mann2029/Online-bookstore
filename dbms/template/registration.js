document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const phoneNumber = document.getElementById('phoneNumber');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const terms = document.getElementById('terms');


    // All your validation helper functions (showError, checkRequired, etc.) remain unchanged.
    const showError = (input, message) => {
        const inputGroup = input.parentElement;
        if (inputGroup.classList.contains('input-row')) {
             input.parentElement.classList.add('error');
        } else {
            inputGroup.classList.add('error');
        }
        const errorDiv = inputGroup.querySelector('.error-message');
        if(errorDiv) errorDiv.textContent = message;
    };
    const showSuccess = (input) => {
        const inputGroup = input.parentElement;
        if (inputGroup.classList.contains('input-row')) {
             input.parentElement.classList.remove('error');
        } else {
            inputGroup.classList.remove('error');
        }
        const errorDiv = inputGroup.querySelector('.error-message');
        if(errorDiv) errorDiv.textContent = '';
    };
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
    const checkEmail = (input) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (input.value.trim() !== '' && !re.test(String(input.value).toLowerCase())) {
            showError(input, 'Email is not valid');
            return false;
        }
        return true;
    };
    const checkPhoneNumber = (input) => {
        const re = /^\d{10}$/;
        if (input.value.trim() !== '' && !re.test(input.value)) {
            showError(input, 'Phone number must be 10 digits');
            return false;
        }
        return true;
    };
    const checkPasswordLength = (input) => {
        if (input.value.trim() !== '' && input.value.length < 8) {
            showError(input, 'Password must be at least 8 characters');
            return false;
        }
        return true;
    };
    const checkTerms = (input) => {
        if (!input.checked) {
            alert('You must agree to the terms and conditions.');
            return false;
        }
        return true;
    };
    const getFieldName = (input) => {
        const id = input.id;
        return id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    // --- FORM SUBMISSION LOGIC (Corrected) ---
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Step 1: Run all frontend validation checks
        const isRequiredValid = checkRequired([firstName, lastName, phoneNumber, email, password]);
        const isEmailFormatValid = checkEmail(email);
        const isPhoneFormatValid = checkPhoneNumber(phoneNumber);
        const isPasswordFormatValid = checkPasswordLength(password);
        const areTermsAgreed = checkTerms(terms);

        // Step 2: If frontend validation fails, stop here
        if (!isRequiredValid || !isEmailFormatValid || !isPhoneFormatValid || !isPasswordFormatValid || !areTermsAgreed) {
            console.log('Frontend validation failed.');
            return;
        }
        
        // Step 3: If validation passes, prepare and send data to the backend
        const formData = {
            firstName: firstName.value,
            lastName: lastName.value,
            phoneNumber: phoneNumber.value,
            email: email.value,
            password: password.value
        };

        try {
            // THE FIX IS HERE: The URL now correctly points to the /api/register endpoint
            const response = await fetch('http://127.0.0.1:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message); // "Registration successful!"
                // Redirect to the login page
                window.location.href = 'loginpage.html'; // Ensure this path is correct
            } else {
                alert(`Error: ${result.message}`);
            }

        } catch (error) {
            console.error('Error sending data to the backend:', error);
            alert('Could not connect to the server. Please make sure the backend is running.');
        }
    });
});

