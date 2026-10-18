// Validation rules for /api/v1/emp. Used together with middleware/validate.js.
const { body, param, query } = require('express-validator')


// Builds the field rules; on update every field becomes optional
const employeeFieldRules = (optional) => {
	const field = (name) => (optional ? body(name).optional() : body(name))

	return [
		field('first_name')
			.trim()
			.notEmpty().withMessage('First name is required')
			.isLength({ max: 50 }).withMessage('First name must be at most 50 characters'),

		field('last_name')
			.trim()
			.notEmpty().withMessage('Last name is required')
			.isLength({ max: 50 }).withMessage('Last name must be at most 50 characters'),

		field('email')
			.trim()
			.notEmpty().withMessage('Email is required')
			.isEmail().withMessage('Invalid email format')
			.toLowerCase(),

		field('position')
			.trim()
			.notEmpty().withMessage('Position is required')
			.isLength({ max: 100 }).withMessage('Position must be at most 100 characters'),

		field('department')
			.trim()
			.notEmpty().withMessage('Department is required')
			.isLength({ max: 100 }).withMessage('Department must be at most 100 characters'),

		field('salary')
			.notEmpty().withMessage('Salary is required')
			.isFloat({ gt: 0 }).withMessage('Salary must be a positive number')
			.toFloat(),

		field('date_of_joining')
			.notEmpty().withMessage('Date of joining is required')
			.isISO8601({ strict: true }).withMessage('Date of joining must be a valid date (YYYY-MM-DD)')
			.toDate(),
		body('user')
			.optional()
			.custom(() => {
				throw new Error('The owner of an employee cannot be set by the client')
			}),	

	]
}

const createRules = employeeFieldRules(false)

const updateRules = employeeFieldRules(true)

const eidParam = [param('eid').isMongoId().withMessage('Invalid employee ID')]
const eidQuery = [query('eid').isMongoId().withMessage('Invalid employee ID')]

module.exports = { createRules, updateRules, eidParam, eidQuery }
