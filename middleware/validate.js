/**
 * Turns express-validator results into a 400 response.
 *
 * Place it right after a list of validation rules in a route:
 *   router.post('/signup', signupRules, validate, signup)
 *
 * If any rule failed, it forwards an AppError(400) with a list of
 * { field, message } to the central error handler; otherwise it calls next().
 */
const { validationResult } = require('express-validator')
const AppError = require('../utils/AppError')

const validate = (req, res, next) => {
	const result = validationResult(req)
	if (result.isEmpty()) return next()

	const errors = result
		.array({ onlyFirstError: true })
		.map((e) => ({ field: e.path || 'body', message: e.msg }))

	next(new AppError('Validation failed', 400, errors))
}

module.exports = validate
