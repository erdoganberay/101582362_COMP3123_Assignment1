const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

router.get('/', (req, res) => {
	const isConnected = mongoose.connection.readyState === 1

	res.status(isConnected ? 200 : 503).json({
		status: isConnected ? 'ok!' : 'degraded',
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
		database: isConnected ? 'connected' : 'disconnected',
	})

})

module.exports = router
