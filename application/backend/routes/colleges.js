/*
* by Tori & Jake
*
* colleges.js contains routes that pertain to the data
* that is sent to and retrieved from the database and the front-end.
* It uses express.js for route handling and the database connection,
* and supports GET and POST HTTP methods.
*
* */

var express = require('express');
var router = express.Router();
const db = require('../conf/database');
const upload = require('../conf/upload');
const sharp = require('sharp');

/*
* College filtering and rating for colleges
* This will sort all results from highest to lowest rated based on user's rating
*
* */
router.get('/data', async (req, res) => {
    const filter = req.query.filter;
    const input = req.query.input;
    const sortOrder = req.query.sortOrder || 'desc'; // Default to 'desc' for highest rated first

    const filterToCondition = {
        name: "college_name",
        state: "location",
        sport: "olympic_sport"
    };

    // Get all columns from colleges_table
    let queryStringAllColumns = `
        SELECT *
        FROM colleges_table
    `;

    // Do a LEFT JOIN to calculate average rating of the college_ratings
    let queryStringAverageRating = `
        SELECT c.college_id, AVG(cr.rating) AS average_rating
        FROM colleges_table c
        LEFT JOIN college_ratings cr ON c.college_id = cr.college_id
    `;

    // Filter the colleges
    const condition = filterToCondition[filter];
    if (condition) {
        const whereCondition = ` WHERE ${condition} LIKE '%${input}%'`;
        queryStringAllColumns += whereCondition;
        queryStringAverageRating += whereCondition;
    }

    // Group average by the college_id
    queryStringAverageRating += ' GROUP BY c.college_id';

    // Fetch data from colleges_table
    let colleges;
    try {
        const [collegesRows, collegesFields] = await db.query(queryStringAllColumns);
        colleges = collegesRows;
    } catch (error) {
        console.error("Error occurred while fetching colleges data:", error);
        return res.status(500).json({error: 'An error occurred while fetching colleges data'});
    }

    // Fetch average ratings
    let averageRatings;
    try {
        const [ratingRows, ratingFields] = await db.query(queryStringAverageRating);
        averageRatings = ratingRows;
    } catch (error) {
        console.error("Error occurred while fetching average ratings:", error);
        return res.status(500).json({error: 'An error occurred while fetching average ratings'});
    }

    // Merge data and sort by average_rating
    const mergedData = colleges.map(college => {
        const avgRatingObj = averageRatings.find(avg => avg.college_id === college.college_id);
        const average_rating = avgRatingObj ? avgRatingObj.average_rating : 0.00;
        return {...college, average_rating};
    });

    // Sort merged data based on sortOrder
    if (sortOrder === 'desc') {
        mergedData.sort((a, b) => b.average_rating - a.average_rating);
    } else {
        mergedData.sort((a, b) => a.average_rating - b.average_rating);
    }

    res.json(mergedData);
});

// (This is not being used for now since we want all colleges to be displayed regardless)
// Fetch all the colleges in the database via search
router.get('/colleges', async (req, res) => {
    try {
        const [colleges, fields] = await db.query('SELECT * FROM colleges_table');
        if (req.query.name) {
            // Sanitize and validate the search query
            const searchQuery = req.query.name.trim();
            if (searchQuery.length < 2) {
                return res.status(400).json({error: 'Search query must be at least 2 characters long'});
            }
            // If a name is passed in the query, then return the colleges matching that name
            const filteredColleges = colleges.filter(college => college.name.includes(searchQuery));
            return res.status(200).json(filteredColleges);
        }

        res.status(200).json(colleges);
    } catch (error) {
        console.error("Error occurred while fetching colleges data:", error);
        res.status(500).json({error: 'An error occurred while fetching colleges data'});
    }
});

// Add a college to the database
router.post('/create', async (req, res, next) => {
    try {
        // Store all the info from the body about the college
        const {
            name,
            sport,
            location,
            address,
            year,
            image,
            phone,
            email,
            website,
            cost
        } = req.body

        let baseSQL = `
        INSERT INTO colleges_table (
            college_name,
            olympic_sport, 
            location,
            address,
            founding_year,
            image,
            phone_number, 
            email, 
            college_website, 
            cost_details, 
            admissions) 
            VALUE (?,?,?,?,?,?,?,?,?,?,'')
        `
        const [results, fields] = await db.query(baseSQL, [
            name,
            sport,
            location,
            address,
            year,
            image,
            phone,
            email,
            website,
            cost
        ]);

        res.status(201).json({message: 'college created successfully'});
    } catch (error) {
        console.log(error);

        if (error.code && error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({error: 'Some field is already held uniquely in the database'});
        } else {
            res.status(500).json({error: 'An error occurred while adding the college'});
        }
    }
});

// Updates a college's details
router.post('/update', async (req, res, next) => {
    try {
        // Store all the info from the body about the college
        const {
            id,
            name,
            sport,
            location,
            address,
            year,
            image,
            phone,
            email,
            website,
            cost
        } = req.body

        let baseSQL = `
        UPDATE colleges_table
        SET
            college_name = ?,
            olympic_sport = ?, 
            location = ?, 
            address = ?, 
            founding_year = ?,
            image = ?,   
            phone_number = ?, 
            email = ?, 
            college_website = ?, 
            cost_details = ?
        WHERE college_id=?
        `
        const [results, _fields] = await db.query(baseSQL, [
            name,
            sport,
            location,
            address,
            year,
            image,
            phone,
            email,
            website,
            cost,
            id
        ]);

        if (results.affectedRows == 0) {
            return res.status(404);
        }

        res.status(200).json({message: 'college updated successfully'});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'An error occurred while adding the college'});
    }
});

router.post('/remove/:id', async (req, res) => {
    try {
        const collegeId = req.params.id;
        const baseSQL = 'DELETE FROM colleges_table WHERE college_id=?';

        const [results] = await db.query(baseSQL, [collegeId]);
        if (results.affectedRows !== 1) {
            res.status(404);
            return;
        }
        res.status(200).json({message: 'college removed successfully'});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'An error occurred while adding the college'});
    }
});

// Get the college_id for each user to display the name of the college they belong to.
router.get('/colleges/:id', async (req, res) => {
    const collegeId = parseInt(req.params.id);
    try {
        if (isNaN(collegeId)) {
            return res.status(400).json({error: ''});
        }

        // Check if collegeId is null, or if a user is not assigned to a college
        if (collegeId === null) {
            return res.status(200).json({college_name: 'Not Assigned'});
        }

        const [collegeRows, collegeFields] = await db.query('SELECT college_name FROM colleges_table WHERE college_id = ?', [collegeId]);
        if (collegeRows.length === 0 || !collegeRows[0].college_name) {
            return res.status(200).json({college_name: ''});
        }

        const college = collegeRows[0];
        res.status(200).json({college_name: college.college_name});
    } catch (error) {
        console.error("Error occurred while fetching college information:", error);
        res.status(500).json({error: 'An error occurred while fetching college information'});
    }
});

// Route for getting all information about a college with id
router.get('/details/:id(\\d+)', async (req, res) => {
    const collegeId = req.params.id;
    const sql = `
    SELECT
        olympic_sport, college_name, location, founding_year, image, phone_number, email, college_website, cost_details, address
    FROM
        colleges_table
    WHERE
        college_id = ?;
    `;

    try {
        const [college] = await db.query(sql, [collegeId]);
        // Ensure the college was found in the database
        if (college.length == 0) {
            res.status(404);
            return;
        }

        res.json(college[0]);
    } catch (err) {
        console.log(err);
        res.status(500);
    }
});

module.exports = router;