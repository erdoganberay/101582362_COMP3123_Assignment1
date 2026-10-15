/*
 * utils/logger.js
 *
 * Writes timestamped JSON logs to:
 * 	logs/app.log    - info, warn and error
 * 	logs/error.log  - error only
 * 
 * Usage:
 * const logger = require('../utils/logger');
 *
 * logger.info('Server started on port 3000');
 * logger.warn('Login failed', { identifier: 'beray', ip: req.ip });
 * logger.error('Database connection failed', err);
 */


const path = require('path')
const winston = require('winston')
const env = require('../config/env')

const logPath = path.resolve(__dirname, '..', 'logs')


// json format in files for easier parsing later 
const fileFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.errors({ stack: true }),
	winston.format.json()
)

// simple console log format
const consoleLogFormat = winston.format.combine(
	winston.format.colorize(),
	winston.format.printf(({ timestamp, level, message, stack }) => {
		return `${timestamp.slice(11,19)} ${level}: ${stack || message}`;
	})
)

const logger = winston.createLogger({
	level: 'info',
	format: fileFormat,
	transports: [
		new winston.transports.File({
			filename: path.join(logPath, 'error.log'),
			level: 'error',
		}),
		new winston.transports.File({
			filename: path.join(logPath, 'app.log'),
		}),
	],
})


if (!env.isProduction) {
	logger.add(new winston.transports.Console({ format: consoleLogFormat }))
}

module.exports = logger
