/*
* by Tori
*
* Script for college_result that displays college details
* depending on the college selected
*
*  */

// Parse query parameters from URL
function getQueryParam(name) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    console.log(name);
    return urlSearchParams.get(name);
}

// Convert dollars for cleaner format for costs in navigation
function formatCost(cost) {
    const [dollars, cents] = String(cost).split('.');
    const formattedDollars = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return cents ? `${formattedDollars}.${cents}` : formattedDollars;
}

// Show a specific subsection and hide others
function showSubsection(sectionId) {
    // Remove active class from all nav buttons
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Add active class to the clicked nav button
    const selectedButton = document.querySelector(`.nav-button[data-section="${sectionId}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }

    // Hide all subsections
    const subsections = document.querySelectorAll('.subsection');
    subsections.forEach(subsection => {
        subsection.style.display = 'none';
    });

    // Show the selected subsection
    const selectedSubsection = document.getElementById(sectionId);
    if (selectedSubsection) {
        selectedSubsection.style.display = 'block';
    }
}

// Fetch user's rating for the college from the backend
async function fetchUserRatingForCollege(collegeId, userId) {
    try {
        const response = await fetch(`/users/fetch-college-rating/${collegeId}/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user rating');
        }
        const data = await response.json();
        return data.userRating;
    } catch (error) {
        console.error('Error fetching user rating:', error);
        throw error;
    }
}

// Add a favorite for button press
async function addFavorite(collegeId) {
    try {
        const user = JSON.parse(sessionStorage.getItem("user")); // Change to sessionStorage
        if (!user) {
            throw new Error('User not logged in');
        }

        const response = await fetch(`/users/create-favorite/${user.user_id}/${collegeId}`, {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error('Failed to add favorite');
        }
        const data = await response.json();
        console.log(data.message);

        // Store favorited state in session storage
        sessionStorage.setItem(`favorited_${collegeId}`, 'true'); // Change to sessionStorage

        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            // console.log(`Key: ${key}, Value: ${value}`);
        }
    } catch (error) {
        console.error('Error adding favorite:', error);
        throw error;
    }
}

// Remove a favorite for button press
async function removeFavorite(collegeId) {
    try {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user) {
            throw new Error('User not logged in');
        }

        // Check if the favorite exists before attempting removal
        const isFavorited = sessionStorage.getItem(`favorited_${collegeId}`) === 'true';
        if (!isFavorited) {
            console.log('Favorite does not exist.');
            console.log(sessionStorage.getItem(`favorited_${collegeId}`));
            return; // Exit the function without performing removal
        }

        const response = await fetch(`/users/remove-favorite/${user.user_id}/${collegeId}`, {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error('Failed to remove favorite');
        }
        const data = await response.json();
        console.log(data.message);

        // Remove favorited state from session storage
        sessionStorage.removeItem(`favorited_${collegeId}`);
    } catch (error) {
        console.error('Error removing favorite:', error);
        throw error;
    }
}

// Fetch and display college details for specific college
async function displayCollegeDetails() {
    const collegeName = getQueryParam('name');
    console.log("College Name: ", collegeName); // this works
    try {
        // Fetch college details based on the name
        const response = await fetch(`/colleges/data?input=${encodeURIComponent(collegeName)}&filter=name`);
        if (!response.ok) {
            throw new Error('Failed to fetch college details');
        }

        // There should be 1 college matching the name
        const collegeDetailsArray = await response.json();
        console.log("Colleges Array: ", collegeDetailsArray);
        const collegeDetails = collegeDetailsArray[0];
        console.log("College Details: ", collegeDetails);
        // console.log("College User Rating: ", collegeDetails.user_rating);

        // Extract college ID from college details
        const collegeId = collegeDetails.college_id;
        console.log("Find College ID: ", collegeId)

        const collegeRating = collegeDetails.average_rating;
        console.log("College average rating: ", collegeRating);

        const collegeDetailsContainer = document.getElementById('college-details');
        // console.log("Type of College Rating data: ", typeof collegeDetails.average_rating);

        const user = sessionStorage.getItem("user");
        let favoriteButton = '';
        if (user && JSON.parse(user).user_type !== 'staff') {
            favoriteButton = (`
                <button id="favorite-button" class="favorite-button">
          <div class="favorite-text">Favorite</div> 
          <i class="favorite-icon fas fa-heart"></i>
        </button>
            `);
        }

        // Star rating hovering
        let userRatingContent = '';
        let showUsersRating = '';
        if (user && JSON.parse(user).user_type === 'student' || user && JSON.parse(user).user_type === 'admin') {
            showUsersRating = await fetchUserRatingForCollege(collegeId, JSON.parse(user).user_id);
            userRatingContent = generateStarRatingWithHoverHTML(collegeId, JSON.parse(user).user_id);
        } else {
            userRatingContent = '<p>Please login as a student or register for a new account under login to view your rating.</p>';
        }

        // Display college details
        collegeDetailsContainer.innerHTML = `
            <h2>${collegeDetails.college_name}</h2>
            <div class="image-container">
            
            <img src="${collegeDetails.image}" alt="College Image" class="college-image">
            <div class="favorite-container">
                ${favoriteButton}
            </div>
            
            </div>
            
            <nav class="navigation-bar">
                <button class="nav-button" data-section="map" onclick="showSubsection('map')">Map</button>
                <button class="nav-button" data-section="info" onclick="showSubsection('info')">Info</button>
                <button class="nav-button" data-section="costs" onclick="showSubsection('costs')">Costs</button>
                <button class="nav-button" data-section="athletics" onclick="showSubsection('athletics')">Athletics</button>
                <button class="nav-button" data-section="ratings" onclick="showSubsection('ratings')">Ratings</button>
                <button class="nav-button" data-section="contact" onclick="showSubsection('contact')">Contact</button>
            </nav>

            <div id="info" class="subsection">
            
    <h3>Information</h3>
    <p><strong>Location: </strong>${collegeDetails.location}</p>
    <p><strong>Year Founded: </strong>${collegeDetails.founding_year}</p>
    
</div>

<div id="costs" class="subsection">
    <h3>Costs</h3>
    <p><strong>Cost to Attend: </strong>$${formatCost(collegeDetails.cost_details)}</p>
    
</div>
<div id="athletics" class="subsection">
    <h3>Athletics</h3>
    <p><strong>Olympic Sports: </strong>${collegeDetails.olympic_sport}</p>

</div>

<div id="ratings" class="subsection">
    <h3>Ratings</h3>
    
    <p><strong>Average College Rating: </strong></p>
    <div id="rating-stars" class="rating-stars">
        ${generateStarRatingHTML(collegeDetails.average_rating)}
    </div>
<div id="user-rating" class="user-rating">
    <p><strong>Your Rating: </strong></p>
    <div id="userRatingValue">${showUsersRating}</div>
    ${userRatingContent}
</div>
      
</div>

</div>

<div id="contact" class="subsection">
    <h3>Contact</h3>
  <p><strong>Student Admissions: </strong><a href="tel:${collegeDetails.phone_number}">${collegeDetails.phone_number}</a></p>
  <p><strong>Address: </strong>${collegeDetails.address}</p>
  <p><strong>Contact Recruiter: </strong>AmyRecruiter</a></p>
    
</div>
<div id="map" class="subsection">
    <!-- Google Maps dynamically shown -->
</div>

<div class="return-index">
    <p><a href="../../html/website_html/webpage.html"> &#x25C0; Return to Search Page </a></p>
</div>
        `;
        showSubsection('map');

        // Favorite doesn't keep a favorite stored for front-end button appearance (if browser/incognito/cleared)
        const isFavorited = localStorage.getItem(`favorited_${collegeId}`) === 'true'; // Change to localStorage
        const favoriteButtonElement = document.getElementById('favorite-button');
        if (favoriteButtonElement) {
            if (isFavorited) {
                favoriteButtonElement.classList.add('favorited');
            }

            favoriteButtonElement.addEventListener('click', async () => {
                try {
                    favoriteButtonElement.classList.toggle('favorited');

                    // Save the favorite state in local storage
                    const isFavorited = favoriteButtonElement.classList.contains('favorited');
                    localStorage.setItem(`favorited_${collegeId}`, isFavorited); // Change to localStorage

                    if (isFavorited) {
                        await addFavorite(collegeId);
                    } else {
                        await removeFavorite(collegeId);
                    }
                } catch (error) {
                    console.error('Error toggling favorite:', error);
                    favoriteButtonElement.classList.toggle('favorited');
                }
            });
        }

        // Display Google Maps of specific college
        await displayMap(collegeDetails);

    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred while fetching college details. Please try again later.");
    }
}

// Function to display Google Map based on college address - this shows on the college_result for a certain college
async function displayMap(collegeDetails) {
    const {address} = collegeDetails;
    console.log("College address: ", address);
    try {
        // Make a request to the Geocoding API
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyAiRPVoD3txxqn6FTKpn9vWNzLHDGEi_QA`);
        if (!response.ok) {
            throw new Error('Failed to fetch geocoding data');
        }

        const data = await response.json();
        console.log("Geocoding API response:", data);
        if (data.status === 'OK' && data.results.length > 0) {
            // Extract latitude and longitude from the response to determine location
            const {lat, lng} = data.results[0].geometry.location;

            // Display the map using Google Maps API
            const map = new google.maps.Map(document.getElementById('map'), {
                center: {lat, lng},
                zoom: 15
            });

        } else {
            throw new Error('No geocoding results found');
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred while fetching map data. Please try again later.");
    }
}

// Show star rating for student to rate the college
function generateStarRatingHTML(rating) {
    const maxStars = 5;
    const fullStar = "<i class='fas fa-star'></i>";
    const halfStar = "<i class='fas fa-star-half-alt'></i>";
    const emptyStar = "<i class='far fa-star'></i>";

    // Handle the case when rating is null or undefined
    if (rating === null || rating === undefined) {
        return emptyStar.repeat(maxStars);
    }

    let starHTML = '';
    for (let i = 0; i < maxStars; i++) {
        if (i < Math.floor(rating)) {
            starHTML += `<span class="star" data-value="${i + 1}">${fullStar}</span>`; // Add full star with data-value attribute
        } else if (i < rating) {
            starHTML += `<span class="star" data-value="${i + 1}">${halfStar}</span>`; // Add half star with data-value attribute
        } else {
            starHTML += `<span class="star" data-value="${i + 1}">${emptyStar}</span>`; // Add empty star with data-value attribute
        }
    }

    return starHTML;
}

// Handle the click of the submit button which is added dynamically after the page is loaded already
async function onSubmitRating(collegeId, userId, collegeDetails) {

    const rating = document.querySelector('input[name="rating"]:checked');
    if (!rating) {
        document.getElementById('ratingMessage').innerText = 'Please select a rating before submitting.';
        return;
    }

    const body = JSON.stringify({rating: rating.value});

    try {
        const response = await fetch(`/users/rate-college/${collegeId}/${userId}`, {
            method: 'POST',
            body,
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error('Failed to submit rating');
        }

        const data = await response.json();
        document.getElementById('ratingMessage').innerText = data.message;
        document.getElementById('userRatingValue').innerText = rating.value;

        console.log('Rating submitted successfully');

    } catch (error) {
        console.error('Error submitting rating:', error);
        document.getElementById('ratingMessage').innerText = 'An error occurred while submitting rating';
    }
}

function generateStarRatingWithHoverHTML(collegeId, userId) {
    // console.log("College Details 2: ", details);
    const maxStars = 5;
    const fullStar = "<i class='fas fa-star'></i>";
    const halfStar = "<i class='fas fa-star-half-alt'></i>";
    const emptyStar = "<i class='far fa-star'></i>";

    let starHTML = `<div id="user-rating-content">`;
    for (let i = 1; i <= maxStars; i++) {
        const ratingValue = (i).toFixed(2); // Convert 1 to 1.00, 2 to 2.00, and so on
        starHTML += `<input type="radio" class="star" name="rating" value="${ratingValue}">${fullStar}`;
    }
    starHTML += '</div>';
    starHTML += `<button type="button" id="submitRatingButton" onclick="onSubmitRating(${collegeId}, ${userId})">Submit Rating</button>`;
    starHTML += `<div id="ratingMessage"></div>`;

    return starHTML;

}

// Call the displayCollegeDetails function when the page loads
window.onload = function () {
    displayCollegeDetails(); // Load college details
};