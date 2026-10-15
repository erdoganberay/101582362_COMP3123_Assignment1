/*
 * config/env.js
 *
 * If .env exists,loads
 * the env variables from it
 * otherwise variables injected from the platform
 *
 * Usage:
 * const env = require('../config/env');
 *
 * env.port          // 3000
 * env.mongoUri      // MongoDB connection string
 * env.jwtSecret     // secret used to sign JWTs
 * env.jwtExpiresIn  // e.g. '1h'
 * env.nodeEnv       // 'development' | 'production'
 * env.isProduction  // true | false
 */ 


const path = require('path')
const dotenv = require('dotenv')

const envPath = path.resolve(__dirname, '..', '.env')

dotenv.config({ path: `${envPath}` })

// Fail Fast
const requiredKeys = ['MONGODB_URI', 'JWT_SECRET']
for (const key of requiredKeys) {
	if (!process.env[key]) {
		console.error(`Error: Missing environment variable ${key}`)
		process.exit(1)
	}
}


// check if secret key is long enough
if (process.env.JWT_SECRET.length < 32) {
	console.error("Error: JWT key too short")
	process.exit(1)
}

// save the keys
const env = {
	nodeEnv: process.env.NODE_ENV || 'development',
	port: Number(process.env.PORT) || 3000,
	mongoUri: process.env.MONGODB_URI,
	jwtSecret: process.env.JWT_SECRET,
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

if (env.nodeEnv === 'production') {
	env.isProduction = true;
} else {
	env.isProduction = false;
}

module.exports = Object.freeze(env);
