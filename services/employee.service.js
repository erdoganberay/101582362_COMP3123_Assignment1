/**
 * Employee business logic with ownership enforcement.
 *
 * Every function takes the authenticated user's id (from the JWT) and only
 * ever reads or changes that user's employees. The owner is never taken
 * from client input.
 *
 * Usage (controllers):
 *   const employeeService = require('../services/employee.service')
 *
 *   await employeeService.list(userId)              -> array of own employees
 *   await employeeService.create(data, userId)      -> new employee (owner = userId)
 *   await employeeService.getOne(eid, userId)       -> employee | AppError 404 / 403
 *   await employeeService.update(eid, data, userId) -> updated employee | 404 / 403
 *   await employeeService.remove(eid, userId)       -> nothing | 404 / 403
 */
const Employee = require('../models/Employee')
const AppError = require('../utils/AppError')
const logger = require('../utils/logger')

// Single place that decides between 404 (no such employee) and 403 (not yours)
const findOwnedEmployee = async (eid, userId) => {
	const employee = await Employee.findById(eid)
	if (!employee) {
		throw new AppError('Employee not found', 404)
	}

	if (!employee.user.equals(userId)) {
		logger.warn('Forbidden employee access attempt', { userId, eid })
		throw new AppError('You do not have access to this employee', 403)
	}

	return employee
}

const list = (userId) => Employee.find({ user: userId }).sort({ created_at: -1 })

const create = (data, userId) => Employee.create({ ...data, user: userId })

const getOne = (eid, userId) => findOwnedEmployee(eid, userId)

const update = async (eid, data, userId) => {
	await findOwnedEmployee(eid, userId)

	// The owner is part of the filter as well (defence in depth)
	return Employee.findOneAndUpdate(
		{ _id: eid, user: userId },
		data,
		{ new: true, runValidators: true }
	)
}

const remove = async (eid, userId) => {
	await findOwnedEmployee(eid, userId)
	await Employee.deleteOne({ _id: eid, user: userId })
}

module.exports = { list, create, getOne, update, remove }
