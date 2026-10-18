/**
 * Authentication business logic. Knows nothing about HTTP (no req/res);
 * throws AppError so the error handler can choose the response.
 *
 * Usage (controllers):
 *   const authService = require('../services/auth.service')
 *
 *   const user = await authService.signup({ username, email, password })
 *     -> the saved user (password hash removed when sent as JSON)
 *     -> throws AppError 409 if the username or email is taken
 */
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const env = require('../config/env')
const User = require('../models/User')
const AppError = require('../utils/AppError')

// Cost factor: each +1 doubles the time needed to hash (and to brute-force)
const SALT_ROUNDS = 12

const signup = async ({ username, email, password }) => {
	const existing = await User.findOne({ $or: [{ username }, { email }] })
	if (existing) {
		const field = existing.username === username ? 'Username' : 'Email'
		throw new AppError(`${field} already exists`, 409)
	}

	const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
	const user = await User.create({ username, email, password: hashedPassword })

	return user
}

const login = async ({ username, email, password }) => {
	const query = email ? { email } : { username }
	const user = await User.findOne(query).select('+password')

	const passwordOk = user ? await bcrypt.compare(password, user.password) : false
	if (!passwordOk) {
		throw new AppError('Invalid credentials', 401)
	}

	const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
	return { token, user }
}

module.exports = { signup, login }
