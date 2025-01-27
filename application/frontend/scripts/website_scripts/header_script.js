/*
* by Tori
*
* Navigation bar buttons for header
*
*  */

const searchCollegesButton = document.getElementById("search-colleges-button");
if (searchCollegesButton) {
    searchCollegesButton.addEventListener("click", function () {
        window.location.href = "../../html/website_html/webpage.html";
    });
}

const planAthleticsButton = document.getElementById("plan-athletics-button");
if (planAthleticsButton) {
    planAthleticsButton.addEventListener("click", function () {
        window.location.href = "../../html/website_html/athletic_plan.html";
    });
}

const aboutUsButton = document.getElementById("about-us-button");
if (aboutUsButton) {
    aboutUsButton.addEventListener("click", function () {
        window.location.href = "../../html/website_html/about_us.html";
    });
}

const loginButton = document.getElementById("login-button");
if (loginButton) {
    loginButton.addEventListener("click", function () {
        window.location.href = "../../html/website_html/login_user_account.html";
    });
}

// Get the username id
const siteAvatar = document.getElementById("avatar");
const user = JSON.parse(sessionStorage.getItem('user'));
console.log("User: ", user);

if (siteAvatar) {
    siteAvatar.addEventListener("click", function () {
        // const user = JSON.parse(sessionStorage.getItem('user'));
        console.log("Details for session: ", user);

        let redirectUrl;

        if (user) {
            if (user.user_type === 'student') {
                redirectUrl = `../../html/website_html/student_account.html?id=${user.user_id}`;
            } else if (user.user_type === 'staff') {
                redirectUrl = `../../html/website_html/staff_account.html?id=${user.user_id}`;
            } else if (user.user_type === 'admin') {
                redirectUrl = `../../html/website_html/admin_account.html?id=${user.user_id}`;
            }
        }

        // If redirectUrl is not set, redirect to login_user_account.html
        window.location.href = redirectUrl || '../../html/website_html/login_user_account.html';
    });

// Retrieve user data from session storage
    const user = JSON.parse(sessionStorage.getItem('user'));

// Check if user data exists and if the user has an avatar
    if (user && user.avatar) {
        // Set the avatar src to the user's avatar
        siteAvatar.src = user.avatar;
    } else {
        // Set a default avatar if the user is not logged in or doesn't have an avatar
        siteAvatar.src = "../../assets/avatars/Iconarchive-Incognito-Animals-Cat-Avatar.512.png";
    }
}
