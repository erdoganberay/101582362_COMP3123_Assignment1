// Builds the Express app: middleware first, then routes.
const express = require('express')
const morgan = require('morgan')
const logger = require('./utils/logger')
const healthRoutes = require('./routes/health.routes')
const userRoutes = require('./routes/user.routes')
const { notFound, errorHandler } = require('./middleware/errorHandler')

const app = express()

app.use(express.json({ limit: '10kb' }))

app.use(morgan(':method :url :status :response-time ms', {
	stream: { write: (line) => logger.info(line.trim()) },
}))

// Routes
app.use('/health', healthRoutes)
app.use('/api/v1/user', userRoutes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
