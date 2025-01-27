// Not in use - by Jake

db = require('../conf/database');

// Middleware for queries
/* 
Tip: Place queries that would be repeated in multiple routes here and use them as middleware instead of repeating code
*/
module.exports = {
    /*
    Uses username in request's parameter to get a user's avatar and places it in res.locals
    */
    queryUserAvatar: async function (req, res, next) {
        try {
            const username = req.params.user_id;

            const avatarQuery = 'SELECT avatar FROM users_table WHERE username = ?;';
            const [avatarRows] = await db.query(avatarQuery, [username]);

            if (avatarRows.length > 0) {
                res.locals.avatar = avatarRows[0].avatar;
                next();
            } else {
                next(res.status(404).json({error: `no user with username ${username}`}));
            }
        } catch (error) {
            console.error('Error querying for avatar:', error);
            next(res.status(500).json({error: 'Internal server error'}));
        }
    }
};