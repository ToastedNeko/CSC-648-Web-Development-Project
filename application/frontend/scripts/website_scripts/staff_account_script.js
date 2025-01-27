/*
* by Tori
*
* Staff Account Script.
* This is the account page for a staff member that allows them to see their
* user account details, student details (Olympic medals and sport, student's college, etc, and
* see their messages, and message others).
*
* */

// Function to retrieve the user ID from session storage
function getUserId() {
    // Parse the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    // Get the value of the 'id' parameter
    const id = urlParams.get('id');
    console.log("User ID:", id);
    return id ? id : null; // Return the ID or null if not found
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

    // Listen for messages from the server
    socket.addEventListener('message', function (event) {
        // Handle the received messages and update the UI
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
const userId = getUserId(); // Replace with the actual user ID
establishWebSocketConnection(userId);

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

// Display the logged-in user's information
async function displayUserInfo() {
    try {
        // Fetch student information based on the user ID
        const response = await fetch(`/users/user-info/${getUserId()}`);

        if (response.ok) {
            const userInfo = await response.json();

            // Fetch college name using fetchCollegeName function
            const collegeName = await fetchCollegeName(userInfo.college_id);

            // Display student information dynamically
            const userInfoDiv = document.getElementById('userInfo');
            userInfoDiv.innerHTML = `
                <p><strong>Your College:</strong> ${collegeName}</p>
                <p><strong>Staff ID:</strong> ${userInfo.user_id}</p>
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

// Show the list of students available in the database
document.addEventListener('DOMContentLoaded', async function () {
    const studentListDropdown = document.getElementById('studentList');
    const studentDetailsSection = document.getElementById('studentDetails');
    const olympicSportsDropdown = document.getElementById('olympicSport');

    // Function to populate the dropdown menu with student names
    async function populateStudentList() {
        try {
            // Fetch the list of students from the backend
            const response = await fetch('/users/student-list');
            if (response.ok) {
                const studentList = await response.json();
                console.log("Student list:", studentList);

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

    // Function to display student details when a student is selected
    async function displayStudentDetails(studentId) {
        try {
            // Fetch student details based on the selected student ID
            const response = await fetch(`/users/student/${studentId}`);
            if (response.ok) {
                const responseData = await response.json();
                const studentDetails = responseData.studentDetails;

                // Fetch the college name using the student's college ID
                const collegeName = await fetchCollegeName(studentDetails.college_id);

                // Display student details in the studentDetailsSection
                studentDetailsSection.innerHTML = `
                <h2>${studentDetails.first_name} ${studentDetails.last_name}</h2>
                <p><strong>College:</strong> ${collegeName}</p>
                <p><strong>Username:</strong> ${studentDetails.username}</p>
                <p><strong>Email:</strong> ${studentDetails.email}</p>
                <p><strong>Olympic Sport:</strong> ${studentDetails.olympic_sport}</p>
                <p><strong>Olympic Medal:</strong> ${studentDetails.olympic_medal}</p>
            `;
                studentDetailsSection.style.display = 'flex';
            } else {
                console.error('Failed to fetch student details:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching student details:', error);
        }
    }

    // Event listener for the change event on the studentListDropdown
    studentListDropdown.addEventListener('change', async function () {
        const selectedStudentId = this.value; // Get the selected student ID
        console.log(this.value);
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

// Call the function to populate the select element when the DOM content is loaded
    document.addEventListener('DOMContentLoaded', populateOlympicSports);

    // Call the function to populate the dropdown menu when the page loads
    await populateStudentList();
    await populateOlympicSports();
});

// Staff members will use this to update a selected student's details in their database entry
// When update details is pressed for a selected student, update either or both the Olympic sport or medal
document.addEventListener('DOMContentLoaded', () => {
    const updateDetailsButton = document.getElementById('updateDetailsButton');

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
                    await refreshStudentDetails(studentId);
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

    // Function to refresh student details for viewing database entry
    async function refreshStudentDetails(studentId) {
        try {
            // Fetch updated student details
            const response = await fetch(`/users/student/${studentId}`);
            if (response.ok) {
                const responseData = await response.json();
                const studentDetails = responseData.studentDetails;

                // Fetch college name using fetchCollegeName function
                const collegeName = await fetchCollegeName(studentDetails.college_id);

                // Update student details section
                const studentDetailsSection = document.getElementById('studentDetails');
                studentDetailsSection.innerHTML = `
                    <h2>${studentDetails.first_name} ${studentDetails.last_name}</h2>
                    <p><strong>College:</strong> ${collegeName}</p>
                    <p><strong>Username:</strong> ${studentDetails.username}</p>
                    <p><strong>Email:</strong> ${studentDetails.email}</p>
                    <p><strong>Olympic Sport:</strong> ${studentDetails.olympic_sport}</p>
                    <p><strong>Olympic Medal:</strong> ${studentDetails.olympic_medal}</p>
                `;
                studentDetailsSection.style.display = 'flex';
            } else {
                console.error('Failed to fetch student details:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching student details:', error);
        }
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    // Call displayStudentInfo() when the DOM content is loaded
    await displayUserInfo();
    await populateUserList();
});

// Event listener for form submission
document.getElementById('messageForm').addEventListener('submit', sendMessage);