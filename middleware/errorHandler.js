/**
 * Central error handling.
 *
 * notFound:      creates a 404 for any request that matched no route
 * errorHandler:  turns every error into a consistent JSON response:
 *                { status: 'error', message, errors? }
 *
 * Known errors are translated:
 *   AppError            - its own statusCode
 *   malformed JSON      - 400
 *   Mongoose CastError  - 400 (invalid ObjectId)
 *   ValidationError     - 400
 *   duplicate key 11000 - 409
 *   anything else       - 500 (details logged, never sent to the client)
 *
 * Usage (app.js), after all routes:
 *   app.use(notFound)
 *   app.use(errorHandler)   // must be the very last middleware
 */
const AppError = require('../utils/AppError')
const logger = require('../utils/logger')

const notFound = (req, res, next) => {
	next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404))
}

const errorHandler = (err, req, res, next) => {
	let statusCode = err.statusCode || 500
	let message = err.message
	let details = err.details

	if (err.type === 'entity.parse.failed') {
		statusCode = 400
		message = 'Malformed JSON body'
	} else if (err.name === 'CastError') {
		statusCode = 400
		message = `Invalid ${err.path}`
	} else if (err.name === 'ValidationError') {
		statusCode = 400
		message = 'Validation failed'
		details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
	} else if (err.code === 11000) {
		statusCode = 409
		const field = Object.keys(err.keyValue || {})[0] || 'Field'
		message = `${field} already exists`
	}

	if (statusCode >= 500) {
		// Full details go to the log only; the client gets a generic message
		logger.error(err)
		message = 'Internal server error'
		details = undefined
	} else {
		logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode}: ${message}`)
	}

	const body = { status: 'error', message }
	if (details) body.errors = details

	res.status(statusCode).json(body)
}

module.exports = { notFound, errorHandler }
