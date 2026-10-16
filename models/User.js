// Users who can sign up and log in. One user owns many employees.
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: [true, 'Username is required'],
			unique: true,
			trim: true,
			minlength: 3,
			maxlength: 30,
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			select: false, 
		},
	},
	{
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
		toJSON: {
			// Strip the hash and internal fields whenever a user is sent as JSON
			transform: (doc, ret) => {
				delete ret.password
				delete ret.__v
				return ret
			},
		},
	}
)

module.exports = mongoose.model('User', userSchema)
