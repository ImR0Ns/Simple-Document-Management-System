const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    name: {
        type: String,
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { collection: "users" });

module.exports = mongoose.model('User', userSchema);