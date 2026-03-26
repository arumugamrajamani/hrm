const jwt = require('jsonwebtoken');
const config = require('./index');

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role_id: user.role_id,
            type: 'access'
        },
        config.JWT.SECRET,
        { expiresIn: config.JWT.ACCESS_EXPIRY }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            type: 'refresh'
        },
        config.JWT.REFRESH_SECRET,
        { expiresIn: config.JWT.REFRESH_EXPIRY }
    );
};

const verifyAccessToken = (token) => {
    return jwt.verify(token, config.JWT.SECRET);
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, config.JWT.REFRESH_SECRET);
};

const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken
};
