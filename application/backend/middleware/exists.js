// Not in use - by Jake

db = require('../conf/database');

// Middleware to check if an id of a certain type exists in the database
module.exports = {
    /* Checks if a college with collegeId exists in the database
        requires existence of collegeId in req.params.collegeId
    */
    collegeExists: async function (req, res, next) {
        let collegeId;

        try {
            collegeId = parseInt(req.params.collegeId);
        } catch (error) {
            console.error('collegeId not found when checking for existence:', error);
            res.status(400).json({error: 'college id needed'});
            next(error);
        }

        try {
            const collegeQuery = 'SELECT college_id FROM colleges_table WHERE college_id = ?';
            const [collegeRows] = await db.query(collegeQuery, [collegeId]);
            if (collegeRows.length == 0) {
                next(res.status(404).json({error: `no college with id: ${collegeId}`}));
            }

            next()
        } catch (error) {
            console.error('Error querying college information:', error);
            res.status(500).json({error: 'Internal server error'});
            next(error);
        }
    }
};