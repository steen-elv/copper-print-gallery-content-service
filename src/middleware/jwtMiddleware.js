const jwt = require('jsonwebtoken');
const { isAuthRequired } = require('../config/authConfig');

const extractJwtInfo = (req, res, next) => {
    // Check if the route requires authentication
    if (!isAuthRequired(req.path)) {
        // If authentication is not required, proceed without checking JWT
        return next();
    }

    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>

        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.sub) {
                req.keycloak_id = decoded.sub;
                next();
            } else {
                res.status(401).json({ error: 'Invalid token' });
            }
        } catch (error) {
            res.status(401).json({ error: 'Error decoding token' });
        }
    } else {
        res.status(401).json({ error: 'Authorization header missing' });
    }
};

module.exports = extractJwtInfo;