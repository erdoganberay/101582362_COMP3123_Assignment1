/*
 * config/db.js
 *
 * Exports an async function that connects to the database in env.mongoUri
 * and logs the database name on success.
 *
 * Usage
 *
 * const connectDB = require('./config/db');
 * await connectDB();
 *
 * */

const mongoose = require('mongoose')
const env = require('./env')
const logger = require('../utils/logger')


const connectDB = async () => {
	await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 })
	logger.info(`MongoDB connected: ${mongoose.connection.name}`)
}

mongoose.connection.on('disconnected', () => {
	logger.warn('MongoDB disconnected')
})

mongoose.connection.on('reconnected', () => {
	logger.info('MongoDB reconnected')
})

module.exports = connectDB
