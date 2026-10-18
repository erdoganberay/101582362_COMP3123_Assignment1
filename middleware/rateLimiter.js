/**
 * Rate limiters (per client IP, in-memory store).
 *
 *   authLimiter: 10 requests / 15 min  -> POST /signup, POST /login
 *   apiLimiter: 100 requests / 15 min  -> everything under /api
 *
 * When a limit is exceeded the client gets 429 Too Many Requests with a
 * JSON body, and RateLimit-* headers tell it when it can retry.
 *
 * Usage:
 *   app.use('/api', apiLimiter)                               // app.js
 *   router.post('/login', authLimiter, loginRules, validate, login) // routes
 */
const rateLimit = require('express-rate-limit')
const logger = require('../utils/logger')

const handler = (req, res, next, options) => {
	logger.warn(`Rate limit exceeded: ${req.method} ${req.originalUrl}`, { ip: req.ip })
	res.status(options.statusCode).json({ status: 'error', message: options.message })
}

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 20,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	message: 'Too many authentication attempts, please try again in 15 minutes',
	handler,
})

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	message: 'Too many requests, please try again later',
	handler,
})

module.exports = { authLimiter, apiLimiter }
