// Not in use - by Jake

const createError = require('http-errors');
const db = require('../conf/database');
const bcrypt = require('bcrypt');

// Middleware for protecting routes from unauthorized access
module.exports = {
    isLoggedIn: async function (req, res, next) {
        const {username, password} = req.body;
        if (username && password) {
            const userQuery = `
                SELECT user_id, username, password, user_type
                FROM users_table
                WHERE username = ?;`;
            try {
                const [userRows] = await db.query(userQuery, [username]);

                let passwordMatched = false;
                let foundUser;

                if (userRows.length > 0) {
                    foundUser = userRows[0];
                    passwordMatched = await bcrypt.compare(password, foundUser.password);
                }

                if (passwordMatched) {
                    req.locals = foundUser;
                    req.locals.password = password; // replace the hashed password with non-hashed
                    next();
                } else {
                    next(res.status(401).json({error: 'invalid credentials'}));
                }
            } catch (err) {
                res.status(500).json({message: 'internal server error'});
                next(err);
            }
        } else {
            next(res.status(400).json({error: 'username and password required'}));
        }
    }
};