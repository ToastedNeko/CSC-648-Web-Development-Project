/*
* by Tori
*
* Script for allowing the user to log into their account
* This data is from the database
*
*  */

/*
 * We have only ONE admin account (to login with on the website itself)
 * Another can be created via the database or postman.
 *
 * username: robadmin
 * password: password
 *
 * */

async function loginUser() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (username && password) {
        try {
            // console.log('Attempting login with username:', username);
            const response = await fetch('/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username, password})
            });

            if (response.ok) {
                const userData = await response.json();
                // console.log('Logged-in user:', userData.username);
                sessionStorage.setItem("user", JSON.stringify(userData)); // Use sessionStorage
                updateUsername(userData.username); // update username in the HTML
                window.location.href = "../../html/website_html/webpage.html";
            } else {
                alert("Invalid username or password.");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("An error occurred while logging in. Please try again later.");
        }
    } else {
        alert("Please enter both username and password.");
    }
    updateLoginButton(); // update login button
}

function updateUsername() {
    const usernameElement = document.getElementById('user-name');
    const user = JSON.parse(sessionStorage.getItem('user'));
    // console.log(user, user.username, usernameElement);
    if (user && user.username) {
        usernameElement.textContent = user.username;
        usernameElement.style.display = 'block';
    }
}

function logoutUser() {
    // Clear session storage
    sessionStorage.removeItem("user"); // Use sessionStorage

    sessionStorage.clear(); // Clear sessionStorage on new user login

    // Update the logout button to say login again
    updateLoginButton();
    console.log("Login button updated");

    // Move back to webpage
    window.location.href = "../../html/website_html/webpage.html";
    console.log("Redirecting to webpage...");
}

function isLoggedIn() {
    return sessionStorage.getItem("user") !== null; // use sessionStorage
}

function updateLoginButton() {
    const loginButton = document.getElementById("login-button");
    if (isLoggedIn()) {
        // If logged in, change button text to logout
        loginButton.textContent = "Logout";
        // Listen for logout
        loginButton.addEventListener("click", logoutUser);
    } else {
        // Change back to login once user logs out
        loginButton.textContent = "Login";
    }
}

updateLoginButton(); // Update the login button initially
updateUsername();
