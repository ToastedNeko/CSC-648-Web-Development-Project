// Not in use - by Jake

const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Store the file in disk using multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../frontend/assets/university_images'));
    },
    filename: function (req, file, cb) {
        // image/jpeg should be the mimetype
        const fileExt = file.mimetype.split("/")[1];
        const fileName = req.body.college_name.replace(' ', '-');
        cb(null, `${fileName}.${fileExt}`)
    }
});

// For filtering to only take jpeg and png files
const imageFilterConfig = function (req, file, cb) {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
    } else {
        cb(null, false)
    }
}

const upload = multer({
    storage: storage,
    fileFilter: imageFilterConfig
});


module.exports = upload;
