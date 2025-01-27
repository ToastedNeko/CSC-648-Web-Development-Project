/*
* by Tori
*
* Script for avatar login
* Dim the login button under avatar for login_new_user.html
*
*  */

// const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

// Add event listener for "keypress" event
passwordInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        loginUser(); // Trigger login action when Enter key is pressed
    }
});

// Dim the login under avatar so user can't press it
document.addEventListener("DOMContentLoaded", function () {
    // Get the login button element
    const loginButton = document.getElementById("login-button");

    // Check if the user is on the login.html page
    if (window.location.pathname.includes("/html/website_html/login_user_account.html")) {
        // Dim the login button by reducing its opacity
        loginButton.style.opacity = "0.5"; // Adjust opacity as needed (0.5 = 50% opacity)
        loginButton.style.pointerEvents = "none"; // Disable pointer events
    }
});