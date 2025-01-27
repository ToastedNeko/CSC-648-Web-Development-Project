/*
* by Tori
*
* This script registers a new user to the database
* Can switch between staff and student user on registration
*
* */

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registrationForm');
    const userTypeSelect = document.getElementById('userType');
    const usernameInput = document.getElementById('username');

    // Function to display an alert with a message
    const showAlert = (message) => {
        alert(message);
    };

    // Event listener for form submission
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Register form submission logic
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const userType = userTypeSelect.value;
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Validate password length
        if (password.length < 6) {
            showAlert('Password must be at least 6 characters long.');
            return;
        }

        // Prevent user from not entering data when registering
        if (!firstName || !lastName || !username || !email || !password) {
            showAlert('All fields are required.');
            return;
        }

        try {
            // Send registration data to server
            const response = await fetch('/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userType,
                    firstName,
                    lastName,
                    username,
                    email,
                    password
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                if (response.status === 400 && responseData.error === 'Username already exists') {
                    showAlert('Username already exists. Please choose a different username.');
                } else {
                    showAlert(responseData.error || 'Failed to register user');
                }
            } else {
                // Successfully registered
                showAlert('Successfully Registered');
                window.location.href = '../../html/website_html/login_user_account.html'; // redirect to login page
            }
        } catch (error) {
            console.error('Error registering user:', error);
            showAlert('An error occurred while registering user. Please try again later.');
        }
    });

    // Update form fields based on selected user type--either staff or student
    userTypeSelect.addEventListener('change', () => {
        // Empty for now
    });
});