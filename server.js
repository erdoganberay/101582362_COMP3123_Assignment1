// Entry point: connects to MongoDB, then starts the HTTP server.
const app = require('./app')
const env = require('./config/env')
const logger = require('./utils/logger')
const connectDB = require('./config/db')

const start = async () => {
	try {
		await connectDB()
		app.listen(env.port, () => {
			logger.info(`Server started on port ${env.port}`)
		})
	} catch (err) {
		logger.error(`Startup failed: ${err.message}`)
		process.exit(1)
	}
}

start()
