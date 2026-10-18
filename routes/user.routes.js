// Mounted at /api/v1/user. Public endpoints (no JWT required).
const express = require('express')
const { signupRules } = require('../validators/user.validators')
const validate = require('../middleware/validate')
const { signup } = require('../controllers/auth.controller')

const router = express.Router()

router.post('/signup', signupRules, validate, signup)

module.exports = router
