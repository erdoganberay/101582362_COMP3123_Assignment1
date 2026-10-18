// HTTP layer for /api/v1/user: reads the validated request,
// calls the auth service and sends the response with the right status code.
const { matchedData } = require('express-validator')
const authService = require('../services/auth.service')
const logger = require('../utils/logger')

const signup = async (req, res) => {
	const data = matchedData(req)
	const user = await authService.signup(data)

	logger.info(`User signed up: ${user.username}`, { userId: user.id })
	res.status(201).json({ status: 'success', data: { user } })
}

module.exports = { signup }
