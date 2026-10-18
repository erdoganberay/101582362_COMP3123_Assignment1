// Validation rules for /api/v1/user. Used together with middleware/validate.js.
const { body } = require('express-validator')

const signupRules = [
	body('username')
		.trim()
		.notEmpty().withMessage('Username is required')
		.isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
		.matches(/^[a-zA-Z0-9_]+$/).withMessage('Username may contain only letters, numbers and _'),

	body('email')
		.trim()
		.notEmpty().withMessage('Email is required')
		.isEmail().withMessage('Invalid email format')
		.isLength({ max: 254 }).withMessage('Email is too long')
		.toLowerCase(),

	body('password')
		.notEmpty().withMessage('Password is required')
		// bcrypt only uses the first 72 bytes of a password, so longer ones are rejected
		.isLength({ min: 8, max: 72 }).withMessage('Password must be 8-72 characters')
		.isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
		.withMessage('Password needs an uppercase letter, a lowercase letter and a number'),
]

const loginRules = [
	body('username').optional().trim().notEmpty().withMessage('Username cannot be empty'),
	body('email').optional().trim().isEmail().withMessage('Invalid email format').toLowerCase(),
	body('password').notEmpty().withMessage('Password is required'),
	// At least one identifier must be present
	body().custom((value) => {
		if (!value.username && !value.email) {
			throw new Error('Provide a username or an email')
		}
		return true
	}),
]

module.exports = { signupRules, loginRules }
