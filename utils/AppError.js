/*
 * utils/AppError.js
 * 
 * Adds HTTP codes to error messages.
 *
 * usage:
 *
 *   const AppError = require('../utils/AppError')
 *
 *   throw new AppError('Employee not found', 404)
 *   throw new AppError('Validation failed', 400, [{ field: 'email', message: 'Invalid email' }])
 *
 * Arguments: message, statusCode, optional details (e.g. a list of field errors)*
 *
 * */




class AppError extends Error {
	constructor(message, statusCode, details) {
		super(message)
		this.name = 'AppError'
		this.statusCode = statusCode
		this.details = details

	}
}
module.exports = AppError
