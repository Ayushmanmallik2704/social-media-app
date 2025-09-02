
const jwt = require('jsonwebtoken'); // For handling JWTs
const User = require('../models/User'); // Import the User model

// Middleware to protect routes by verifying JWT
const protect = async (req, res, next) => {
    let token; // Declare a variable to hold the token

    // Check if Authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token from the Authorization header
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using the JWT secret from environment variables
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the user by ID from the decoded token and attach to the request object
            // .select('-password') prevents the password hash from being returned
            req.user = await User.findById(decoded.id).select('-password');

            // If user is not found, throw an error
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Call the next middleware function or route handler
        } catch (error) {
            console.error(error); // Log the error for debugging
            res.status(401).json({ message: 'Not authorized, token failed' }); // Respond with an error
        }
    }

    // If no token is provided in the header
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' }); // Respond with an error
    }
};

module.exports = { protect }; // Export the protect middleware
