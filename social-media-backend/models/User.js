// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For hashing passwords

// Define the User Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'], // Username is required
        unique: true, // Username must be unique
        trim: true, // Remove whitespace from both ends of a string
        minlength: [3, 'Username must be at least 3 characters long'] // Minimum length
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'], // Email is required
        unique: true, // Email must be unique
        trim: true,
        lowercase: true, // Store email in lowercase
        match: [/.+@.+\..+/, 'Please enter a valid email address'] // Email format validation
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'], // Password is required
        minlength: [6, 'Password must be at least 6 characters long'], // Minimum length
        select: false // Do not return password in query results by default
    },
    bio: {
        type: String,
        maxlength: [200, 'Bio cannot be more than 200 characters'], // Maximum length
        default: '' // Default empty string
    },
    profilePicture: {
        type: String, // URL to the profile picture
    default: 'https://placehold.co/150x150/cccccc/000000?text=Profile' // Default placeholder image
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId, // Array of Object IDs referencing other User documents
        ref: 'User' // Reference the User model
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId, // Array of Object IDs referencing other User documents
        ref: 'User' // Reference the User model
    }],
    createdAt: {
        type: Date,
        default: Date.now // Automatically set creation date
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps automatically
});

// Middleware to hash password before saving the user document
UserSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) {
        return next();
    }

    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds
    this.password = await bcrypt.hash(this.password, salt); // Hash the password
    next(); // Move to the next middleware or save operation
});

// Method to compare entered password with hashed password in the database
UserSchema.methods.matchPassword = async function(enteredPassword) {
    // Compare the entered password with the stored hashed password
    return await bcrypt.compare(enteredPassword, this.password);
};

// Export the User model
module.exports = mongoose.model('User', UserSchema);
