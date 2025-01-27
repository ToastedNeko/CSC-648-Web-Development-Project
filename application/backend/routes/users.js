/*
* by Tori & Jake
*
* users.js route allows for user to be able to:
* authenticate, register, send and receive messages, retrieve user information,
* display a user rating so a user can rate a college, and allow a user to
* favorite a college.
* This uses express.js for handling bycrypt password encryption and storing
* and retrieving information from the database.
* It also supports POST and GET HTTP methods.
*
* */

var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../conf/database');
const {colors} = require("debug");
const {query} = require("express");
const fs = require('fs');
const sharp = require('sharp');
const {isLoggedIn} = require('../middleware/protectors');
const {collegeExists} = require('../middleware/exists');
const {queryUserAvatar} = require('../middleware/query');
const {getAvatarPath, getThumbnailPath, getDefaultAvatar} = require('../helpers/avatar');

// Login with database for either student, staff or admin user
router.post('/login', async (req, res) => {
    const {username, password} = req.body;

    try {
        const userQuery = `
            SELECT *
            FROM users_table
            WHERE username = ?;
        `;
        const [userRows] = await db.query(userQuery, [username]);

        let passwordMatched = false;
        let foundUser;
        if (userRows.length > 0) {
            // User is a student
            foundUser = userRows[0];
            passwordMatched = await bcrypt.compare(password, foundUser.password);
        }
        if (passwordMatched) {
            res.status(200).json(foundUser);
        } else {
            res.status(401).json({error: 'Invalid credentials'});
        }
    } catch (error) {
        console.error('Error executing login query:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Register a new user--staff, student, or admin--to the database
router.post('/register', async (req, res) => {
    const {userType, firstName, lastName, username, email, password, image, olympicSport} = req.body;

    try {
        let query, queryParams;

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 2);

        // Check if the username already exists
        const userExistsQuery = `SELECT COUNT(*) AS count FROM users_table WHERE username = ?`;
        const [userExistsResult] = await db.query(userExistsQuery, [username]);

        if (userExistsResult[0].count > 0) {
            return res.status(400).json({error: 'Username already exists. Please choose a different username.'});
        }

        // Determine whether staff, student, or admin user and insert the user into the users_table
        const userTypes = ['student', 'staff', 'admin'];
        if (userTypes.includes(userType)) {
            query = `INSERT INTO users_table (first_name, last_name, username, email, password, avatar, olympic_sport, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            queryParams = [firstName, lastName, username, email, hashedPassword, image, olympicSport, userType];
        } else {
            return res.status(400).json({error: 'Invalid user type'});
        }

        // Execute the query to insert user data
        await db.query(query, queryParams);

        // Respond with success message
        res.status(201).json({message: 'User registered successfully'});
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({error: 'An error occurred while registering user'});
    }
});

/*
* Users can send a message to other users.
* Individual users' messages stored under user_messages.
* Accessed by message_id.
* */
router.post('/send-message', async (req, res) => {
    try {
        res.status(201).json({message: 'Message sent successfully'});
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({error: 'An error occurred while sending the message'});
    }
});

// Retrieve messages with websockets
router.get('/messages/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    try {
        res.status(200).json({messages});
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).json({error: 'An error occurred while retrieving messages'});
    }
});

// Retrieve user account information to display on their account details
router.get('/user-info/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    try {
        const userInfoQuery = `
        SELECT avatar, college_id, email, first_name, last_name, olympic_medal, olympic_sport, user_id, user_type, username 
        FROM users_table 
        WHERE user_id = ?
        `;

        const [userInfoRows] = await db.query(userInfoQuery, [userId]);
        if (userInfoRows.length > 0) {
            console.log(userInfoRows);
            res.json(userInfoRows[0]); // Assuming user_id is unique, so only one row will be returned
        } else {
            res.status(404).json({error: 'User not found'});
        }
    } catch (error) {
        console.error('Error fetching user information:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Retrieve the list of users from the database for displaying on the front-end
router.get('/users-list', async (req, res) => {
    try {
        // Query to fetch users along with their user_type
        const query = `
            SELECT user_id, username, user_type, first_name, last_name
            FROM users_table;
        `;

        // Execute the query
        const [usersRows] = await db.query(query);

        // Send the list of users as a JSON response
        res.json(usersRows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Add a favorite for the user based on the id of the college
router.post('/create-favorite/:userId/:collegeId', collegeExists, async (req, res) => {
    // if (req.locals.user_type != 'student') {
    //     res.status(403).json({ error: 'Must be a student to add a favorite'});
    // } else {
    const collegeId = parseInt(req.params.collegeId);
    const userId = req.params.userId;

    try {
        const favoriteQuery = 'INSERT IGNORE INTO favorite_college_table (user_id, college_id) VALUES (?, ?)';
        const [favoriteRows] = await db.query(favoriteQuery, [userId, collegeId]);

        if (favoriteRows.affectedRows > 0) {
            res.status(200).json({message: 'favorite added successfully'});
        } else {
            res.status(200).json({message: 'already favorited'});
        }
    } catch (error) {
        console.error('Error querying favorite table:', error);
        res.status(500).json({error: 'Internal server error'});
    }
    //}
})

// Removes a favorite with collegeId from the logged-in user
router.post('/remove-favorite/:userId/:collegeId', async (req, res) => {
    try {
        const removeFavoriteQuery = 'DELETE FROM favorite_college_table WHERE user_id= ? AND college_id = ?;'
        const [removedFavoriteRows] = await db.query(removeFavoriteQuery, [req.params.userId, req.params.collegeId])

        if (removedFavoriteRows.affectedRows === 0) {
            res.status(200).json({message: 'no such favorite to remove'});
        } else {
            res.status(200).json({message: 'favorite removed'});
        }
    } catch (error) {
        console.error('Error querying for favorites:', error);
        res.status(500).json({error: 'Internal server error'});
    }
})

// Responds with a list of the logged-in user's favorites
router.get('/favorites/:userId', async (req, res) => {
    try {
        const favoritesQuery =
            `SELECT c.college_id, c.college_name, c.image, fav.date_added
        FROM favorite_college_table fav
        INNER JOIN colleges_table c ON fav.college_id=c.college_id
        WHERE fav.user_id = ?;`;

        const [favoriteRows] = await db.query(favoritesQuery, [req.params.userId]);
        res.status(200).json(favoriteRows);
    } catch (error) {
        console.error('Error querying for favorites:', error);
        res.status(500).json({error: 'Internal server error'});
    }
})

// Route that gets a users avatar - not being used
router.get('/:username/avatar', queryUserAvatar, async (req, res) => {
    let avatar = res.locals.avatar; // from middleware

    if (avatar == null) {
        avatar = getDefaultAvatar();
    }

    res.status(200).sendFile(getAvatarPath(avatar));
})

// (Not being used) - Route that gets a user's avatar thumbnail and creates it if it does not exist
router.get('/:userId/avatar/thumbnail', queryUserAvatar, async (req, res) => {
    let avatar = res.locals.avatar; // from middleware

    if (avatar == null) { // default avatar
        avatar = getDefaultAvatar();
    }

    const thumbnailPath = getThumbnailPath(avatar);

    if (!fs.existsSync(thumbnailPath)) {
        try {
            await sharp(getAvatarPath(avatar)).resize(80).toFile(thumbnailPath);

        } catch (error) {
            console.error('Error creating thumbnail: ', error)
            res.status(500).json('internal server error');
        }
    }

    res.status(200).sendFile(thumbnailPath);
})

// (Not being used) - Route that changes a logged-in user's avatar
router.post('/change-avatar/:userId/:avatar', async (req, res) => {
    const avatarPath = getAvatarPath(req.params.avatar);

    if (fs.existsSync(avatarPath)) {
        try {
            const avatarChangeQuery = `UPDATE users_table SET avatar = ? WHERE username = ?;`;
            const [userRows] = await db.query(avatarChangeQuery, [req.params.avatar, req.params.user_id]);

            if (userRows.affectedRows === 1) {
                res.status(200).json({message: 'updated avatar'});
            } else { // What would be the case where this even happens?
                res.status(500).json({error: 'Internal server error'});
            }

        } catch (error) {
            console.error('Error querying for avatar:', error);
            res.status(500).json({error: 'Internal server error'});
        }
    } else {
        res.status(404).json({error: 'requested avatar does not exist'});
    }
})

// Rate a college from the front-end - already has rating, update rating, or insert new rating for college
router.post('/rate-college/:collegeId/:userId/', async (req, res) => {
    const {collegeId, userId} = req.params;
    const {rating} = req.body;

    try {
        // Check if the user has already rated this college
        const existingRatingQuery = 'SELECT * FROM college_ratings WHERE college_id = ? AND user_id = ?';
        const [existingRatingRows] = await db.query(existingRatingQuery, [collegeId, userId]);

        if (existingRatingRows.length > 0) {
            // If the user has already rated, update the existing rating
            const updateRatingQuery = 'UPDATE college_ratings SET rating = ? WHERE college_id = ? AND user_id = ?';
            await db.query(updateRatingQuery, [rating, collegeId, userId]);
        } else {
            // If the user has not rated yet, insert a new rating
            const insertRatingQuery = 'INSERT INTO college_ratings (college_id, user_id, rating) VALUES (?, ?, ?)';
            await db.query(insertRatingQuery, [collegeId, userId, rating]);
        }

        res.status(200).json({message: 'Rating submitted successfully'});
        console.log('Rating submitted successfully');
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({error: 'An error occurred while submitting rating'});
    }
});

// Route to fetch user's (student or admin user(s)) rating for a college
router.get('/fetch-college-rating/:collegeId/:userId/', async (req, res) => {
    const {collegeId, userId} = req.params;

    try {
        // Query the database to get the user's rating for the specified college
        const ratingQuery = 'SELECT rating FROM college_ratings WHERE college_id = ? AND user_id = ?';
        const [ratingRows] = await db.query(ratingQuery, [collegeId, userId]);

        // If a rating exists for the user and college, send it in the response
        if (ratingRows.length > 0) {
            const userRating = ratingRows[0].rating;
            res.status(200).json({userRating});
        } else {
            // If no rating exists for the user and college, set their rating to 0.00
            // and send the updated rating in the response
            const defaultRating = "No Rating";
            res.status(200).json({userRating: defaultRating});
        }
    } catch (error) {
        console.error('Error fetching user rating:', error);
        res.status(500).json({error: 'An error occurred while fetching user rating'});
    }
});

// Route for staff management for students and their Olympic participation
router.get('/student-list/', async (req, res) => {
    try {
        // Retrieve the student list with their Olympic sport and medal
        const query = `
            SELECT  u.user_id, u.first_name, u.last_name, u.college_id, u.olympic_sport, u.olympic_medal
            FROM users_table u
            WHERE u.user_type = 'student';
        `;
        const [rows] = await db.query(query);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching student list:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Get the list of sports that a student user can have as their Olympic sport
router.get('/olympic-sports/', async (req, res) => {
    try {
        // Fetch enum options for Olympic Sport
        const enumQuery = `
            SHOW COLUMNS FROM users_table LIKE 'olympic_sport';
        `;
        const [enumRows] = await db.query(enumQuery);
        const enumOptions = enumRows[0].Type.match(/'([^']+)'/g).map(option => option.replace(/'/g, ''));

        res.status(200).json(enumOptions);
    } catch (error) {
        console.error('Error fetching Olympic sports list:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Route for admin management of staff members
router.get('/staff-list/', async (req, res) => {
    try {
        // Retrieve the student list with their Olympic sport and medal
        const query = `
            SELECT  u.user_id, u.first_name, u.last_name, u.college_id
            FROM users_table u
            WHERE u.user_type = 'staff';
        `;
        const [rows] = await db.query(query);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching staff list:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Route for retrieving student details for a staff member to see
router.get('/student/:userId/', async (req, res) => {
    const studentId = parseInt(req.params.userId);

    try {
        // Retrieve the student details
        const query = `
            SELECT first_name, last_name, username, email, college_id, IFNULL(olympic_sport, '') AS olympic_sport, IFNULL(olympic_medal, '') AS olympic_medal
            FROM users_table
            WHERE user_id = ? AND user_type = 'student';
        `;
        const [rows] = await db.query(query, [studentId]);

        if (rows.length === 1) {
            // Fetch enum options for Olympic Sport
            const enumQuery = `
                SHOW COLUMNS FROM users_table LIKE 'olympic_sport';
            `;
            const [enumRows] = await db.query(enumQuery);
            const enumOptions = enumRows[0].Type.match(/'([^']+)'/g).map(option => option.replace(/'/g, ''));

            // Send the student details along with enum options as JSON response
            res.status(200).json({studentDetails: rows[0], olympicSports: enumOptions});
        } else {
            res.status(404).json({error: 'Student not found'});
        }
    } catch (error) {
        console.error('Error fetching student details:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Allow a staff user to change student's Olympic sport or Olympic medal
router.post('/update-student/:userId', async (req, res) => {
    const studentId = parseInt(req.params.userId);
    const {olympicSport, olympicMedal} = req.body;

    // If there is either a sport or a medal, allow the staff user to change a student's details
    // Will keep old sport or medal from the student's entry otherwise
    try {
        // Construct the update query conditionally
        let updateQuery = 'UPDATE users_table SET ';
        const queryParams = [];

        if (olympicSport !== undefined && olympicSport !== '') {
            updateQuery += 'olympic_sport = ?, ';
            queryParams.push(olympicSport);
        }

        if (olympicMedal !== undefined && olympicMedal !== '') {
            updateQuery += 'olympic_medal = ?, ';
            queryParams.push(olympicMedal);
        }

        // Remove the trailing comma and space
        updateQuery = updateQuery.slice(0, -2);

        updateQuery += ' WHERE user_id = ? AND user_type = "student";';
        queryParams.push(studentId);

        await db.query(updateQuery, queryParams);

        res.status(200).json({message: 'Student details updated successfully'});
    } catch (error) {
        console.error('Error updating student details:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Allow an admin user to change staff's college
router.post('/update-staff/:staffId/:collegeId', async (req, res) => {
    const staffId = parseInt(req.params.staffId);
    const collegeId = parseInt(req.params.collegeId);

    // Change the staff's college
    try {
        // Construct the update query conditionally
        let updateQuery = `UPDATE users_table SET college_id=? WHERE user_id = ? AND user_type = 'staff';`;

        await db.query(updateQuery, [collegeId, staffId]);

        res.status(200).json({message: "staff's details updated successfully"});
    } catch (error) {
        console.error('Error updating staff details:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.post('/remove/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const baseSQL = 'DELETE FROM users_table WHERE user_id=?';

        const [results] = await db.query(baseSQL, [userId]);
        if (results.affectedRows !== 1) {
            res.status(404);
            return;
        }
        res.status(200).json({message: 'user removed successfully'});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'An error occurred while removing the user'});
    }
})

module.exports = router;