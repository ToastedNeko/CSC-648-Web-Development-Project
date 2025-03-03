/*
* by Tori
*
* This script manages the functionality of a college search and rating system for the colleges.
*
* */

/*
* If the browser chosen is Safari, show speech to text option
* Otherwise, remove the speech to text option
*
* */

// Check if the browser is Safari
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// If Safari, show the speech button
if (isSafari) {
    document.getElementById('speech-button').style.display = 'inline-block';
}

/*
* Add a star rating for the average_rating
* This shows the rating that each college has on webpage.html in the list of
* searched for colleges
* */
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
            starHTML += `<span class="star" data-value="${i + 1}">${fullStar}</span>`; // Add full star
        } else if (i < rating) {
            starHTML += `<span class="star" data-value="${i + 1}">${halfStar}</span>`; // Add half star
        } else {
            starHTML += `<span class="star" data-value="${i + 1}">${emptyStar}</span>`; // Add empty star
        }
    }
    return starHTML;
}

// Make sure user searches for only letters and numbers
// Can be no larger than 40 alphanumeric characters
function isValidInput(input) {
    const pattern = /^[a-zA-Z0-9\s]*$/;
    if (input.length > 40) {
        alert("Please enter no more than 40 characters.");
        clearSearchInput();
        return false;
    } else if (!pattern.test(input)) {
        alert("Please enter only letters and numbers.");
        clearSearchInput();
        return false;
    }
    return true;
}

// Clear input once user enters search result
function clearSearchInput() {
    document.getElementById("search-input").value = "";
}

// Handles the search functionality on the webpage for the colleges search
async function searchColleges() {
    const searchFilter = document.getElementById("search-filter").value.toLowerCase();
    const searchInput = document.getElementById("search-input").value.trim().toLowerCase();

    // Check if user enters only letters and numbers for their search
    if (!isValidInput(searchInput)) {
        return;
    }

    try {
        // Receives college data from database
        const response = await fetch(`/colleges/data?input=${searchInput}&filter=${searchFilter}`);
        if (!response.ok) {
            throw new Error('Failed to fetch college data');
        }

        const colleges = await response.json();
        displaySearchResults(colleges);
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred while fetching college data. Please try again later.");
    }

    clearSearchInput();
}

/*
* Show the list of college results
* Each item in the list can be clicked on; this will redirect to a college result
*
* */
function displaySearchResults(results) {
    const resultList = document.getElementById("result-list");
    resultList.innerHTML = "";

    if (results.length === 0) {
        resultList.innerHTML = "<li>No results found</li>";
    } else {
        results.forEach(college => {
            const listItem = document.createElement("div"); // Represents each item in the search results
            const collegeLink = document.createElement("a"); // Link to the college details page
            const collegeItem = document.createElement("div"); // New parent container for image and stars
            const collegeImage = document.createElement("img");
            const collegeText = document.createElement("div");

            collegeItem.className = "college-item"; // Class name for the parent container
            collegeImage.src = college.image || '';
            collegeImage.alt = `${college.college_name} Image`;
            collegeImage.className = "college-image";

            collegeText.className = "college-text";
            collegeText.innerHTML = `<div>${college.college_name}</div>`;
            collegeItem.appendChild(collegeText); // Append college text to college item

            // Create stars container
            const ratingStars = document.createElement("div");
            ratingStars.className = "rating-stars";
            ratingStars.innerHTML = generateStarRatingHTML(college.average_rating);
            collegeItem.appendChild(ratingStars); // Append stars container to college item

            // Encode space to pass to results page
            // Encoding replaces characters with ascii for url
            collegeLink.href = `college_results.html?name=${encodeURIComponent(college.college_name)}`;
            collegeLink.appendChild(collegeImage); // Append college image to college link
            collegeItem.appendChild(collegeLink); // Append college link (with image) to college item
            listItem.appendChild(collegeItem); // Append college item to list item
            resultList.appendChild(listItem); // Append list item to result list
        });
        document.querySelector(".heading").style.display = "none";
    }
}

// Check search field for search input
const searchInput = document.getElementById("search-input");

// Listen for enter key if not null (input must exist)
if (searchInput) {
    searchInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            searchColleges();
        }
    });
}

/*
* Speech to text using webkitSpeechRecognition() for the search bar.
* This shows a red icon and indicator when the microphone button is being held.
* This ONLY works in Safari, because Chrome, etc., requires HTTPS--doesn't allow
* HTTP to use voice, video, WebSockets, etc., since it isn't secure.
*
* */

// Get the speech button and search input elements
const speechButton = document.getElementById("speech-button");
const recordingIndicator = document.getElementById("recording-indicator");
// const searchInput = document.getElementById("search-input");

// Initialize recognition variable
let recognition;

// Flag to track if recognition is active
let isListening = false;

// Function to start speech recognition
function startRecognition() {
    try {
        if (!isListening) {
            console.log("Speech recognition started");

            // Connect to
            recognition = new webkitSpeechRecognition();

            // Define recognition parameters
            recognition.continuous = true; // Continuous recognition
            recognition.lang = "en-US"; // Set recognition language (US English)

            // Define event handler for recognition results
            recognition.onresult = (event) => {
                // Get the recognized text from the event results
                const speechResult = event.results[0][0].transcript;

                console.log("Recognized speech:", speechResult);

                // Update the search input with the recognized text
                searchInput.value = speechResult;
            };

            // Start speech recognition
            recognition.start();

            // Set flag and update UI
            isListening = true;
            speechButton.classList.add("recording");
            recordingIndicator.style.display = "block";
        }
    } catch (error) {
        console.error("Error occurred during speech recognition:", error);
        alert("Speech recognition is not supported in this browser.");
    }
}

// Function to stop speech recognition
function stopRecognition() {
    try {
        if (isListening) {
            console.log("Speech recognition stopped");

            // Stop speech recognition
            recognition.stop();

            // Reset flag and update UI
            isListening = false;
            speechButton.classList.remove("recording");
            recordingIndicator.style.display = "none";
        }
    } catch (error) {
        console.error("Error occurred while stopping speech recognition:", error);
    }
}

// Add mousedown event listener to start recognition
speechButton.addEventListener("mousedown", startRecognition);

// Add mouseup event listener to stop recognition
speechButton.addEventListener("mouseup", stopRecognition);

// Add mouseout event listener to stop recognition if mouse leaves the button area
speechButton.addEventListener("mouseout", stopRecognition);