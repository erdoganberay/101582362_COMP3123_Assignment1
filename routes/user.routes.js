// Mounted at /api/v1/user. Public endpoints (no JWT required).
const express = require('express')
const { signupRules, loginRules } = require('../validators/user.validators')
const validate = require('../middleware/validate')
const { signup, login } = require('../controllers/auth.controller')
const { authLimiter } = require('../middleware/rateLimiter')

const router = express.Router()

router.post('/signup', authLimiter, signupRules, validate, signup)
router.post('/login', authLimiter, loginRules, validate, login)

module.exports = router
