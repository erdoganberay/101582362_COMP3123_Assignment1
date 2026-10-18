// HTTP layer for /api/v1/emp: reads validated input, calls the employee
// service with the authenticated user's id and sends the right status code.
const { matchedData } = require('express-validator')
const employeeService = require('../services/employee.service')
const AppError = require('../utils/AppError')
const logger = require('../utils/logger')

const list = async (req, res) => {
	const employees = await employeeService.list(req.user.id)
	res.status(200).json({ status: 'success', results: employees.length, data: { employees } })
}

const create = async (req, res) => {
	const employee = await employeeService.create(matchedData(req), req.user.id)

	logger.info('Employee created', { userId: req.user.id, eid: employee.id })
	res.status(201).json({ status: 'success', data: { employee } })
}

const getOne = async (req, res) => {
	const { eid } = matchedData(req)
	const employee = await employeeService.getOne(eid, req.user.id)
	res.status(200).json({ status: 'success', data: { employee } })
}

const update = async (req, res) => {
	const { eid, ...data } = matchedData(req)
	if (Object.keys(data).length === 0) {
		throw new AppError('Provide at least one field to update', 400)
	}

	const employee = await employeeService.update(eid, data, req.user.id)

	logger.info('Employee updated', { userId: req.user.id, eid })
	res.status(200).json({ status: 'success', data: { employee } })
}

const remove = async (req, res) => {
	const { eid } = matchedData(req)
	await employeeService.remove(eid, req.user.id)

	logger.info('Employee deleted', { userId: req.user.id, eid })
	res.status(204).send()
}

module.exports = { list, create, getOne, update, remove }
