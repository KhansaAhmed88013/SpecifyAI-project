const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
        username: { type: String, required: true},
		email: { type: String, required: true, unique: true },
		passwordHash: { type: String, required: true },
		resetCodeHash: { type: String, default: null },
		resetCodeExpiresAt: { type: Date, default: null },
		resetTokenVersion: { type: Number, default: 0 },
	},
	{
		collection: 'users',
		timestamps: { createdAt: true, updatedAt: false },
	}
);

module.exports = mongoose.model('User', userSchema);
