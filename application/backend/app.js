/*
* by Tori & Jake
*
* app.js sets up Express.js along with middleware and route handlers.
* It shows HTTP errors, express, cors, path, cookie-parser, logger, fs, body parser,
* and express-ws related modules. It sets up the static files for use on the front-end.
* It also defines the routes for /users and /colleges, sets up a websocket endpoint for real-time
* messaging, and fetches the messages for a user from the database.
*
* */

const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const path = require("path");
var cookieParser = require('cookie-parser');
const logger = require("morgan");
const fs = require('fs');
const db = require('./conf/database');
var bodyParser = require('body-parser');
const expressWs = require('express-ws');

const collegesRouter = require('./routes/colleges');
const usersRouter = require('./routes/users');

const app = express();
expressWs(app);

// Middleware setup
// Let localhost use api to test without the server
app.use(cors());
// Middleware to serve static files (including our_profile_images) with caching headers
app.use(express.static(path.join(__dirname, '../frontend')));
// Parse body as json for post endpoints
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

// Router middleware
app.use('/users', usersRouter);
app.use('/colleges', collegesRouter);

// Websocket endpoint testing code

// app.ws('/echo', function(ws, req) {
//     ws.on('message', function(msg) {
//         ws.send(msg);
//     });
// });

/*
* WebSockets used for real-time communication between clients.
* This allows users to message each other without a delay or refreshing the page.
* It reduces latency and allows for immediate feedback, since it's a persistent
* connection.
*
* */

// Store websocket connections
const connections = [];
app.ws('/users/messages/:userId', async function (ws, req) {
    console.log('Request params:', req.params);
    console.log("Testing");
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
        // Handle invalid user ID
        ws.send(JSON.stringify({error: 'Invalid user ID'}));
        return;
    }

    // Add a websocket connection to the list of connections
    connections.push({
        ws,
        userId
    });
    console.log(`WebSocket connection opened for user ${userId}`);

    // Retrieve the old messages for a user and send them to the client
    const oldMessages = await fetchMessages(userId);
    ws.send(JSON.stringify({messages: oldMessages}));

// Listen for messages coming from the websocket connection
    ws.on('message', async function (msg) {
        try {
            const {senderId, receiverIdentifier, messageContent} = JSON.parse(msg);
            console.log("1 check body for sender, receiver, messagecontent: ", senderId, receiverIdentifier, messageContent);

            // Retrieve receiver's information from the database using either username or user_id
            const [rows] = await db.query(`SELECT user_id FROM users_table WHERE username = ? OR user_id = ?`, [receiverIdentifier, receiverIdentifier]);
            const receiver = rows[0];

            // If receiver doesn't exist, send an error message to the sender
            if (receiver === undefined) {
                ws.send(JSON.stringify({error: 'Recipient does not exist'}));
                return; // Exit the function here if receiver doesn't exist
            }

            // Insert message into the user_messages of that specific user
            const query = `
            INSERT INTO user_messages (sender_id, receiver_id, message_content)
            VALUES (?, ?, ?)
        `;
            const queryParams = [senderId, receiver.user_id, messageContent];
            await db.query(query, queryParams);

            // Broadcast the fetched messages to all the connected clients
            for (const conn of connections) {
                // Fetch messages for the specified user ID from the database
                const newMessages = await fetchMessages(conn.userId);
                conn.ws.send(JSON.stringify({messages: newMessages}));
            }
        } catch (error) {
            console.error('Error retrieving messages:', error);
            ws.send(JSON.stringify({error: 'An error occurred while retrieving messages'}));
        }
    });
});

/*
* For the query:
*  Fetches messages along with sender and receiver for specific user.
*  It then checks if the user is the receiver of each message, ordering results
*  in ascending order by message ID.
*
* */

// Function to fetch messages for a user from the database
async function fetchMessages(userId) {
    try {
        // Query messages from the database for the specified user ID
        const [rows] = await db.query(`
            SELECT
                um.sender_id,
                um.message_content,
                sender.username AS sender_name,
                receiver.username AS receiver_name,
                um.message_id,
                CASE WHEN um.receiver_id = ${userId} THEN 1 ELSE 0 END AS is_receiver
            FROM user_messages um
            INNER JOIN users_table sender
                ON sender.user_id = um.sender_id
            INNER JOIN users_table receiver
                ON receiver.user_id = um.receiver_id    
            WHERE um.receiver_id = ${userId}
            OR um.sender_id = ${userId}
            ORDER by um.message_id ASC
        `, []);

        // Extract and return the message content, sender, and receiver ID from the rows
        return rows.map(row => ({
            senderId: row.sender_id,
            messageContent: row.message_content,
            senderName: row.sender_name,
            receiverName: row.receiver_name,
            isReceiver: row.is_receiver
        }));
    } catch (error) {
        console.error('Error fetching messages from the database:', error);
        throw error;
    }
}

module.exports = app;