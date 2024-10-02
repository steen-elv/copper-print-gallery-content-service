const jwt = require('jsonwebtoken');

const extractJwtInfo = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>

        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.sub) {
                req.keycloak_id = decoded.sub;
                next();
            } else {
                res.status(400).json({ error: 'Invalid token format' });
            }
        } catch (error) {
            res.status(400).json({ error: 'Error decoding token' });
        }
    } else {
        res.status(401).json({ error: 'Authorization header missing' });
    }
};

module.exports = extractJwtInfo;