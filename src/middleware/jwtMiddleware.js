const jwt = require('jsonwebtoken');
const { isAuthRequired } = require('../config/authConfig');

const extractJwtInfo = (req, res, next) => {
    if (!isAuthRequired(req.path)) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(400).json({ error: 'Invalid token format' });
    }

    const token = parts[1];

    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.sub) {
            return res.status(400).json({ error: 'Invalid token' });
        }
        req.keycloak_id = decoded.sub;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Error decoding token' });
    }
};

module.exports = extractJwtInfo;