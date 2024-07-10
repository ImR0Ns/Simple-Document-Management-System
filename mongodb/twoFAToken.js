const mongoose = require('mongoose');

const twoFATokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300, // 5 min 
    },
});

module.exports = mongoose.model('TwoFAToken', twoFATokenSchema);
