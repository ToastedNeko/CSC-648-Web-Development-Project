// Not in use - by Jake

const path = require('path')

// helpers for dealing with avatars
module.exports = {
    /*
    returns the expected path for an avatar
    */
    getAvatarPath: (avatar) => {
        return path.join(__dirname, `../../frontend/assets/avatars/${avatar}`);
    },
    /*
    returns the expected path for an avatar's thumbnail
    */
    getThumbnailPath: (avatar) => {
        return path.join(__dirname, `../../frontend/assets/avatars/thumbnails/${avatar}`);
    },
    /*
    returns the default avatar for a user with no avatar set
    */
    getDefaultAvatar: () => {
        return 'Diversity-Avatars-Avatars-Batman.512.png'
    }
};