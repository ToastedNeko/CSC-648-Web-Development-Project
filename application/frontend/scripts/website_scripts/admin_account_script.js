/*
* by Jake & Tori
*
* Admin Account Script.
* This is the account page for the admin of the website.
* They can see details pertaining to user data, college data,
* general data for the site, and so on.
*
* */

let socket;

// Function to retrieve the user ID from session storage
function getUserId() {
    // Parse the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    // Get the value of the 'id' parameter
    const id = urlParams.get('id');
    console.log("User ID:", id);
    return id ? id : null; // Return the ID or null if not found
}

// Convert dollars for cleaner format for college cost
function formatCost(cost) {
    return parseInt(cost).toLocaleString();
}

// Validate email addresses for college form
function isValidEmail(email) {
    // Regular expression for validating email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function sendMessage(event) {
    event.preventDefault();
    if (!socket) {
        console.error('Socket is not connected');
        return;
    }

    const recipientUsername = document.getElementById('recipientUsername').value.trim();
    console.log("recipientUsername:", recipientUsername, typeof recipientUsername);
    const messageContent = document.getElementById('messageContent').value.trim();
    console.log("messageContent:", messageContent, typeof messageContent);

    if (recipientUsername && messageContent) {
        try {
            const msg = {
                senderId: getUserId(),
                receiverIdentifier: recipientUsername,
                messageContent: messageContent
            };

            socket.send(JSON.stringify(msg));
            document.getElementById('messageContent').value = '';
        } catch (error) {
            console.error('Error sending message:', error);
            alert('An error occurred while sending the message. Please try again later.');
        }
    } else {
        alert('Please enter both recipient and message.');
    }
}

/*
* Create a websocket connection. This will allow clients to log
* into their account and message each other on the front-end.
*
* */
function establishWebSocketConnection(userId) {
    socket = new WebSocket(`ws://${window.location.host}/users/messages/${userId}`);

    // Listen for messages from the server and update the UI
    socket.addEventListener('message', function (event) {
        // Handle the received messages
        const data = JSON.parse(event.data);
        console.log('Received items:', data);
        console.log('Received messages:', data.messages);

        // Get the messageList element
        const messageList = document.getElementById('messageList');
        messageList.innerHTML = '';

        // Iterate through the received messages and append them to the messageList
        data.messages.forEach(message => {
            // Create a new message element for each message
            const messageItem = document.createElement('div');
            messageItem.classList.add('message-item');
            if (message.isReceiver) {
                messageItem.classList.add('message-item-receiver');
            } else {
                messageItem.classList.add('message-item-sender');
            }

            messageItem.innerHTML = `<div>
                    <div><strong>${message.senderName}</strong></div>
                    <div>${message.messageContent}</div>
            </div>`;

            // Append the message element to the messageList
            messageList.appendChild(messageItem);
        });

        // Scroll to the bottom of the messageList to show the latest messages
        messageList.scrollTop = messageList.scrollHeight;
    });

    // Handle websocket close event
    socket.addEventListener('close', function (event) {
        console.log('WebSocket connection closed. Reconnecting...');

    });
}

// Call the function to establish WebSocket connection when the page loads
const userId = getUserId();
establishWebSocketConnection(userId);

async function displayUserInfo() {
    try {
        console.log('about to display user info.');
        // Fetch student information based on the user ID
        const response = await fetch(`/users/user-info/${getUserId()}`);
        if (response.ok) {
            const userInfo = await response.json();
            // Display student information dynamically
            const userInfoDiv = document.getElementById('userInfo');
            userInfoDiv.innerHTML = `
                <p><strong>Admin ID:</strong> ${userInfo.user_id}</p>
                <p><strong>First Name:</strong> ${userInfo.first_name}</p>
                <p><strong>Last Name:</strong> ${userInfo.last_name}</p>
                <p><strong>Username:</strong> ${userInfo.username}</p>
                <p><strong>Email:</strong> ${userInfo.email}</p>
                
            `;
        } else {
            console.error('Failed to fetch user information:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching user information:', error);
    }
}

// Show the list of users to choose from and their type--student, staff, or admin--when messaging
async function populateUserList() {
    try {
        // Fetch user data from the backend
        const response = await fetch(`/users/users-list`);
        if (response.ok) {
            const users = await response.json();
            const userListDropdown = document.getElementById('recipientUsername');

            // Clear existing content
            userListDropdown.innerHTML = '';

            // Create and append dropdown options for each user
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.username; // Set the value to the username
                option.textContent = `${user.username} (${user.user_type}) (Name: ${user.first_name}, ${user.last_name})`;
                userListDropdown.appendChild(option);
            });
        } else {
            console.error('Failed to fetch user data:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// Define the function to fetch the college name based on college ID
const fetchCollegeName = async (collegeId) => {
    try {
        // Check if collegeId is null
        if (collegeId === null || NaN) {
            return 'Not Assigned'; // Default value when collegeId is null
        }

        const collegeResponse = await fetch(`/colleges/colleges/${collegeId}`);

        // Check if the response is OK
        if (!collegeResponse.ok) {
            throw new Error('Failed to fetch college information');
        }

        const collegeData = await collegeResponse.json();

        // Check if collegeData is null or undefined
        if (!collegeData || !collegeData.college_name) {
            return ''; // Default value when collegeData is missing
        }

        return collegeData.college_name;
    } catch (error) {
        console.error('Error fetching college information:', error);
        return 'Unknown College';
    }
};

const collegeDropdown = document.getElementById('collegeList');
const collegeDetailsSection = document.getElementById('collegeDetails');

const studentListDropdown = document.getElementById('studentList');
const studentDetailsSection = document.getElementById('studentDetails');

const staffListDropdown = document.getElementById('staffList');
const staffDetailsSection = document.getElementById('staffDetails');
const staffCollegeDropdown = document.getElementById('staffCollege');

// Function to display staff details when a staff is selected
async function displayStaffDetails(staffId) {
    try {
        if (staffId === undefined) {
            staffDetailsSection.style.display = 'none';
            return;
        }

        // Fetch student details based on the selected student ID
        const response = await fetch(`/users/user-info/${staffId}`);
        if (response.ok) {
            const staffDetails = await response.json();
            // Fetch the college name using the student's college ID
            const collegeName = await fetchCollegeName(staffDetails.college_id);

            // Display student details in the studentDetailsSection
            staffDetailsSection.innerHTML = `
            <h2>${staffDetails.first_name} ${staffDetails.last_name}</h2>
            <p><strong>College:</strong> ${collegeName}</p>
            <p><strong>Username:</strong> ${staffDetails.username}</p>
            <p><strong>Email:</strong> ${staffDetails.email}</p>
        `;
            staffDetailsSection.style.display = 'flex';
        } else {
            console.error('Failed to fetch staff details:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching staff details:', error);
    }
}

// Function to display student details when a student is selected
async function displayStudentDetails(studentId) {
    try {
        if (studentId === undefined) {
            studentDetailsSection.style.display = 'none';
            return;
        }

        // Fetch student details based on the selected student ID
        const response = await fetch(`/users/student/${studentId}`);
        if (response.ok) {
            const responseData = await response.json();
            const studentDetails = responseData.studentDetails;

            // Fetch the college name using the student's college ID
            const collegeName = await fetchCollegeName(studentDetails.college_id);

            const medal = studentDetails.olympic_medal !== '' ? studentDetails.olympic_medal : 'None';

            // Display student details in the studentDetailsSection
            studentDetailsSection.innerHTML = `
            <h2>${studentDetails.first_name} ${studentDetails.last_name}</h2>
            <p><strong>College:</strong> ${collegeName}</p>
            <p><strong>Username:</strong> ${studentDetails.username}</p>
            <p><strong>Email:</strong> ${studentDetails.email}</p>
            <p><strong>Olympic Sport:</strong> ${studentDetails.olympic_sport}</p>
            <p><strong>Olympic Medal:</strong> ${medal}</p>
        `;
            studentDetailsSection.style.display = 'flex';
        } else {
            console.error('Failed to fetch student details:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching student details:', error);
    }
}

// Function to display college details when a college is selected
async function displayCollegeDetails(collegeId) {
    try {
        // Fetch college details based on the selected college ID
        const response = await fetch(`/colleges/details/${collegeId}`);
        if (response.ok) {
            const responseData = await response.json();
            const collegeDetails = responseData;

            // Display student details in the studentDetailsSection
            collegeDetailsSection.innerHTML = `
            <h2>${collegeDetails.college_name}</h2>
            <p><strong>Olypmic Sport:</strong> ${collegeDetails.olympic_sport}</p>
            <p><strong>Location:</strong> ${collegeDetails.location}</p>
            <p><strong>Address:</strong> ${collegeDetails.address}</p>
            <p><strong>Founding Year:</strong> ${collegeDetails.founding_year}</p>
            <p><strong>Image URL:</strong> <span class="image-url">${collegeDetails.image}</span></p>
            <p><strong>Phone Number:</strong> ${collegeDetails.phone_number}</p>
            <p><strong>Email:</strong> ${collegeDetails.email}</p>
            <p><strong>College Website:</strong> <a href="${collegeDetails.college_website}">${collegeDetails.college_website}</a></p>
            <p><strong>Cost to Attend: </strong>$${formatCost(collegeDetails.cost_details)}</p>
        `;
            collegeDetailsSection.style.display = 'flex';

            // Fill out the fields for modification
            const collegeNameInput = document.getElementById('collegeName');
            collegeNameInput.value = collegeDetails.college_name;

            const collegeOlympicSportInput = document.getElementById("collegeOlympicSport");
            collegeOlympicSportInput.value = collegeDetails.olympic_sport;

            const collegeLocationInput = document.getElementById("collegeLocation");
            collegeLocationInput.value = collegeDetails.location;

            const collegeAddressInput = document.getElementById("collegeAddress");
            collegeAddressInput.value = collegeDetails.address;

            const collegeYearInput = document.getElementById("collegeYear");
            collegeYearInput.value = collegeDetails.founding_year;

            const collegeImageInput = document.getElementById("collegeImage");
            collegeImageInput.value = collegeDetails.image;

            const collegePhoneInput = document.getElementById("collegePhone");
            collegePhoneInput.value = collegeDetails.phone_number;

            const collegeEmailInput = document.getElementById("collegeEmail");
            collegeEmailInput.value = collegeDetails.email;

            const collegeWebsiteInput = document.getElementById("collegeWebsite");
            collegeWebsiteInput.value = collegeDetails.college_website;

            const collegeCostInput = document.getElementById("collegeCost");
            collegeCostInput.value = collegeDetails.cost_details;
        } else {
            console.error('Failed to college details:', response.statusText);
        }
    } catch (error) {
        console.error('Error collge details details:', error);
    }
}

// Function to populate the 'staffCollege' and 'collegeList' select element with options
async function populateCollegeLists() {
    try {
        const response = await fetch('/colleges/data');

        if (response.ok) {
            const colleges = await response.json()
            // Populate both collegeLists
            const collegeLists = [collegeDropdown, staffCollegeDropdown];

            collegeLists.forEach((collegeList) => {
                // Clear existing options
                collegeList.innerHTML = ''
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select a college...';
                collegeList.appendChild(defaultOption);

                // Add fetched options
                colleges.forEach(college => {
                    const option = document.createElement('option');
                    option.value = college.college_id;
                    option.textContent = college.college_name;
                    collegeList.appendChild(option);
                });
            });

            // Add the create college option to the college section's dropdown
            const createOption = document.createElement('option');
            createOption.value = 'create'
            createOption.textContent = 'Create a new college...';
            collegeDropdown.insertBefore(createOption , collegeDropdown.getElementsByTagName('option')[1]);
        } else {
            console.error('Failed to fetch staff college list:', response.statusText);
        }
    } catch (error) {
        console.error('Error populating college lists:', error);
    }
}

// Function to populate the dropdown menu with staff names
async function populateStaffList() {
    try {
        // Fetch the list of staff from the backend
        const response = await fetch('/users/staff-list');
        if (response.ok) {
            const staffList = await response.json();

            // Clear existing dropdown options (except the initial empty option)
            staffListDropdown.innerHTML = '<option value="">Select a staff...</option>';
            // Create and append dropdown options for each student
            staffList.forEach(staff => {
                const option = document.createElement('option');
                option.value = staff.user_id; // Set the value to the user ID
                // console.log("This is a test: ", student.user_id);
                option.textContent = `${staff.first_name} ${staff.last_name}`;
                staffListDropdown.appendChild(option);
            });
        } else {
            console.error('Failed to fetch staff list:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching staff list:', error);
    }
}

async function populateStudentList() {
    try {
        // Fetch the list of students from the backend
        const response = await fetch('/users/student-list');
        if (response.ok) {
            const studentList = await response.json();

            // Clear existing dropdown options (except the initial empty option)
            studentListDropdown.innerHTML = '<option value="">Select a student...</option>';
            // Create and append dropdown options for each student
            studentList.forEach(student => {
                const option = document.createElement('option');
                option.value = student.user_id; // Set the value to the user ID
                // console.log("This is a test: ", student.user_id);
                option.textContent = `${student.first_name} ${student.last_name}`;
                studentListDropdown.appendChild(option);
            });
        } else {
            console.error('Failed to fetch student list:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching student list:', error);
    }
}

// Show the list of students available in the database
document.addEventListener('DOMContentLoaded', async function () {
    // Function to populate the dropdown menu with student names
    // Event listener for the change event on the studentListDropdown
    studentListDropdown.addEventListener('change', async function () {
        const selectedStudentId = this.value; // Get the selected student ID
        if (selectedStudentId) {
            // If a student is selected (i.e., the value is not empty), display their details
            await displayStudentDetails(selectedStudentId);
        } else {
            // If no student is selected, clear the student details section
            studentDetailsSection.innerHTML = '';
        }
    });

    // Function to fetch the list of Olympic sports from the backend
    async function fetchStudentOlympicSport() {
        try {
            const response = await fetch(`/users/olympic-sports`);
            if (response.ok) {
                const data = await response.json();
                // console.log("Fetch Student Info 1: ", data);
                return data;
                // return data.olympic_sport;
            } else {
                console.error('Failed to fetch student Olympic sport:', response.statusText);
                return null;
            }
        } catch (error) {
            console.error('Error fetching student Olympic sport:', error);
            return null;
        }
    }

    // Function to populate the 'olympicSport' select element with options
    async function populateOlympicSports() {
        try {
            const olympicSports = await fetchStudentOlympicSport();
            const olympicSportSelect = document.getElementById('olympicSport');

            // Clear existing options
            olympicSportSelect.innerHTML = '';

            // Add a default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select an Olympic Sport...';
            olympicSportSelect.appendChild(defaultOption);

            // Add fetched options
            olympicSports.forEach(sport => {
                const option = document.createElement('option');
                option.value = sport;
                option.textContent = sport;
                olympicSportSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error populating Olympic sports:', error);
        }
    }

    // Event listener for the change event on the staffListDropdown
    staffListDropdown.addEventListener('change', async function () {
        const selectedStaffId = this.value; // Get the selected student ID
        if (selectedStaffId) {
            // If a staff is selected (i.e., the value is not empty), display their details
            await displayStaffDetails(selectedStaffId);
        } else {
            // If no staff is selected, clear the staff details section
            staffDetailsSection.innerHTML = '';
        }
    });

    // Event listener for the change event on the collegeDropdown
    collegeDropdown.addEventListener('change', async function () {
        const selectedCollegeId = this.value; // Get the selected student ID
        // Ignore the create a new college choice for displaying details
        if (selectedCollegeId !== 'create' && selectedCollegeId) {
            // If a college is selected (i.e., the value is not empty), display their details
            await displayCollegeDetails(selectedCollegeId);
        } else {
            // If no college is selected, clear the college details section
            collegeDetailsSection.innerHTML = '';
            document.forms['collegeForm'].reset();

            // undo the reset of the option if they had create chosen
            if (selectedCollegeId === 'create') {
                this.value = 'create';
            }
        }
    });

    // Call the function to populate the select element when the DOM content is loaded
    document.addEventListener('DOMContentLoaded', populateOlympicSports);

    // Call the functions to populate the dropdown menus when the page loads
    await displayUserInfo();
    await populateStudentList();
    await populateOlympicSports();
    await populateStaffList();
    await populateCollegeLists();
    await populateUserList();
});

// Admin members will use this to update a selected student's details in their database entry
// When update details is pressed for a selected student, update either or both the Olympic sport or medal
document.addEventListener('DOMContentLoaded', () => {
    const updateDetailsButton = document.getElementById('updateStudentDetailsButton');

    updateDetailsButton.addEventListener('click', async () => {
        const studentList = document.getElementById('studentList');
        const olympicSportInput = document.getElementById('olympicSport');
        const olympicMedalSelect = document.getElementById('olympicMedal');

        const olympicSport = olympicSportInput.value;
        const olympicMedal = olympicMedalSelect.value;

        // Get the selected student's ID
        const studentId = studentList.value;

        // Check if a student is chosen
        if (!studentId) {
            alert('Please select a student.');
            return; // Prevent form submission if no student is chosen
        }

        // Check if either olympicSport or olympicMedal is not empty and different from the initial value
        if ((olympicSport !== '' && olympicSport !== 'initialValue') || (olympicMedal !== '' && olympicMedal !== 'initialValue')) {
            // Prepare the data to be sent
            const data = {
                olympicSport: olympicSport !== 'initialValue' ? olympicSport : undefined,
                olympicMedal: olympicMedal !== 'initialValue' ? olympicMedal : undefined
            };

            try {
                const response = await fetch(`/users/update-student/${studentId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    alert('Student details updated successfully');
                    // Clear input fields
                    olympicSportInput.selectedIndex = 0;  // Reset select to default option
                    olympicMedalSelect.selectedIndex = 0; // Reset select to default option
                    // Refresh student details
                    await displayStudentDetails(studentId);
                } else {
                    // Handle error response
                    console.error('Failed to update student details:', response.statusText);
                }
            } catch (error) {
                console.error('Error updating student details:', error);
            }
        } else {
            // Handle case when neither olympicSport nor olympicMedal is changed
            alert('No changes were made to Olympic sport or medal.');
        }
    });
});

// Admin members will use this to update a selected staff's details in their database entry
// When update details is pressed for a selected staff, update their college
document.addEventListener('DOMContentLoaded', () => {
    const updateDetailsButton = document.getElementById('updateStaffDetailsButton');

    updateDetailsButton.addEventListener('click', async () => {
        const staffList = document.getElementById('staffList');
        const collegeInput = document.getElementById('staffCollege');

        // Get the seletect college ID
        const collegeId = collegeInput.value;

        // Get the selected student's ID
        const staffId = staffList.value;

        // Check if a student is chosen
        if (!staffId) {
            alert('Please select a staff.');
            return; // Prevent form submission if no staff is chosen
        }

        if (!collegeId) {
            alert('Please select a college.');
            return;
        }

        // Check if staffCollege is not empty and different from the initial value
        if (collegeInput !== '' && collegeInput !== 'initialValue') {
            try {
                const response = await fetch(`/users/update-staff/${staffId}/${collegeId}`, {
                    method: 'POST'
                });

                if (response.ok) {
                    alert('staff details updated successfully');
                    await displayStaffDetails(staffId);

                    // Clear input fields
                    collegeInput.selectedIndex = 0;

                } else {
                    // Handle error response
                    console.error('Failed to update staff details:', response.statusText);
                }
            } catch (error) {
                console.error('Error updating staff details:', error);
            }
        } else {
            alert('No changes were made to staff college.');
        }
    });
});

// Admin members will use this to update a selected college's details in their database entry
// When update details is pressed for a selected college, update with all current fields
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.collegeContainer');

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // stop the form's default behavior of refreshing page

        if (collegeDropdown.value === 'create' || collegeDropdown.value === '') {
            alert("Can not update a college that doesn't exist yet")
            return;
        }

        // Prepare the data to be sent
        const data = Object.fromEntries(new FormData(event.target).entries())
        
        try {
            const response = await fetch(`/colleges/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('College details updated successfully');

                // Refresh college details
                await displayCollegeDetails(data.id);
            } else {
                // Handle error response
                console.error('Failed to update college details:', response.statusText);
            }
        } catch (error) {
            console.error('Error updating college details:', error);
        }
    });
});

// Admin members will use this to create a college's database entry
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addCollegeButton').addEventListener('click', async (event) => {
        event.preventDefault()

        // Check to make sure a college isn't already selected
        if (collegeDropdown.value !== 'create') {
            alert('The create option must be selected to create a new college');
            return;
        }

        // Get the data from the form
        const form = document.querySelector('.collegeContainer');
        const data = Object.fromEntries(new FormData(form).entries())

        // remove the empty id field
        delete data.id;

        // Ensure all the form is filled out
        for (const [key, value] of Object.entries(data)) {
            // Image is only nullable field
            if (key !== 'image' && value === '' || value === null) {
                alert('all fields must be filled other than the image field');
                return;
            }

            // Make sure user enters a correct email
            if (key === 'email' && !isValidEmail(value)) {
                alert('Please enter a valid email address');
                return;
            }
        }

        try {
            const response = await fetch(`/colleges/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('College created successfully');
                await populateCollegeLists();
                document.forms['collegeForm'].reset();
            } else {
                if (response.status == 409) {
                    alert('college conflicted with an already existing college')
                } else {
                    console.error('college creation failure', response.statusText)
                    alert('college failed to create');
                }
            }
        } catch (error) {
            console.error('Unable to create new college.', error);
        }
    });
});

// Admin members will use this to remove a college's database entry
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('removeCollegeButton').addEventListener('click', async (event) => {
        event.preventDefault();

        // Check to make sure a college isn't already selected
        if (!collegeDropdown.value || collegeDropdown.value === 'create') {
            alert('Make sure a college is selected before deleting one');
            return;
        }

        const collegeId = collegeDropdown.value;

        try {
            const response = await fetch(`/colleges/remove/${collegeId}`, {
                method: 'POST'
            });

            if (response.ok) {
                alert('College removed successfully');
                await populateCollegeLists();
                document.forms['collegeForm'].reset();
            } else {
                console.error('college removal failure', response.statusText)
                alert('college failed to delete');
            }
        } catch (error) {
            console.error('Unable to delete college.', error);
        }
    });
});

// function which removes a user with userId from the database
async function removeUser(userId, source) {
    try {
        const response = await fetch(`/users/remove/${userId}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('user removed successfully');

            // Repopulate all user lists without that user
            await populateUserList();
            await populateStaffList();
            await populateStudentList();
        } else {
            console.error('user removal failure', response.statusText)
            alert('user failed to delete');
        }
    } catch (error) {
        console.error('Unable to delete user.', error);
    }
}

// Remove a staff member from the database
document.getElementById('removeStaffButton').addEventListener('click', async () => {
    if (!staffListDropdown.value) {
        alert('select a staff before deleting');
        return;
    }

    await removeUser(staffListDropdown.value);
    await displayStaffDetails();
})

// Remove a staff user from the database
document.getElementById('removeStudentButton').addEventListener('click', async () => {
    if (!studentListDropdown.value) {
        alert('select a student before deleting');
        return;
    }

    await removeUser(studentListDropdown.value);
    await displayStudentDetails();
})

// Event listener for form submission
document.getElementById('messageForm').addEventListener('submit', sendMessage);