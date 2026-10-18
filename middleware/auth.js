/**
 * JWT authentication middleware.
 *
 * Expects:  Authorization: Bearer <token>
 * On success: sets req.user = { id } and calls next()
 * On failure: forwards AppError 401 (missing, malformed, invalid or expired token)
 *
 * Usage (routes):
 *   const authenticate = require('../middleware/auth')
 *   router.use(authenticate)            // protect every route below
 *   router.get('/me', authenticate, fn) // or a single route
 *
 * The user id comes only from the verified token, never from the request body.
 */
const jwt = require('jsonwebtoken')
const env = require('../config/env')
const AppError = require('../utils/AppError')

const authenticate = (req, res, next) => {
	const header = req.headers.authorization || ''
	const [scheme, token] = header.split(' ')

	if (scheme !== 'Bearer' || !token) {
		return next(new AppError('Authentication required', 401))
	}

	try {
		const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] })
		req.user = { id: payload.sub }
		next()
	} catch (err) {
		const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
		next(new AppError(message, 401))
	}
}

module.exports = authenticate
