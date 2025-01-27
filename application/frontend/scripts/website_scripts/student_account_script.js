/*
* by Tori
*
* Student Account Script.
* This is the account page for a student that allows a student to see their
* user details, college, etc. and also send and receive messages from other users.
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

    /*
    * This needs to be fixed
    * It needs to check if the user exists so it can print the correct error.
    *
    * */
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

    // // Handle receiving error responses
    socket.addEventListener('message', function (event) {
        const data = JSON.parse(event.data);
        if (data.error) {
            alert(data.error);
            // Clear the input field for the recipient identifier
            document.getElementById('recipientIdentifier').value = '';
        }
    });
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

// Call the function to establish WebSocket connection when the page loads
const userId = getUserId(); // Replace with the actual user ID
establishWebSocketConnection(userId);

async function displayUserInfo() {
    try {
        // Fetch student information based on the user ID
        const response = await fetch(`/users/user-info/${getUserId()}`);

        if (response.ok) {
            const userInfo = await response.json();

            // Function to fetch college name based on college ID
            const fetchCollegeName = async (collegeId) => {
                try {
                    const collegeResponse = await fetch(`/colleges/colleges/${collegeId}`);
                    if (!collegeResponse.ok) {
                        console.log("College Response data: ", collegeResponse);
                        throw new Error('Failed to fetch college information');
                    }
                    const collegeData = await collegeResponse.json();

                    console.log("Json response collegeData: ", collegeData)
                    return collegeData.college_name;
                } catch (error) {
                    console.error('Error fetching college information:', error);
                    return '';
                }
            };

            // Display student information dynamically
            const userInfoDiv = document.getElementById('userInfo');
            const collegeName = await fetchCollegeName(userInfo.college_id);
            userInfoDiv.innerHTML = `
                <p><strong>Your College:</strong> ${collegeName}</p>
                <p><strong>Student ID:</strong> ${userInfo.user_id}</p>
                <p><strong>First Name:</strong> ${userInfo.first_name}</p>
                <p><strong>Last Name:</strong> ${userInfo.last_name}</p>
                <p><strong>Username:</strong> ${userInfo.username}</p>
                <p><strong>Email:</strong> ${userInfo.email}</p>
                <p><strong>Olympic Sport:</strong> ${userInfo.olympic_sport}</p>
                <p><strong>Olympic Medal:</strong> ${userInfo.olympic_medal}</p>
            `;
        } else {
            console.error('Failed to fetch user information:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching user information:', error);
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // Call displayStudentInfo() when the DOM content is loaded
    await displayUserInfo();
    await populateUserList();
});

// Event listener for form submission
document.getElementById('messageForm').addEventListener('submit', sendMessage);