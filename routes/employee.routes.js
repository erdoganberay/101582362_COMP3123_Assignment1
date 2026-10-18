// Mounted at /api/v1/emp. Every route requires a valid JWT.
const express = require('express')
const authenticate = require('../middleware/auth')
const validate = require('../middleware/validate')
const { createRules, updateRules, eidParam, eidQuery } = require('../validators/employee.validators')
const { list, create, getOne, update, remove } = require('../controllers/employee.controller')

const router = express.Router()

router.use(authenticate)

router.get('/employees', list)
router.post('/employees', createRules, validate, create)
router.get('/employees/:eid', eidParam, validate, getOne)
router.put('/employees/:eid', eidParam, updateRules, validate, update)
router.delete('/employees', eidQuery, validate, remove)

module.exports = router
