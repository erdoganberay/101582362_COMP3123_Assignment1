// Employees managed by users. Each employee belongs to exactly one user
// (Employee.user -> User._id); users can only access their own employees.
const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema(
	{
		first_name: {
			type: String,
			required: [true, 'First name is required'],
			trim: true,
			maxlength: 50,
		},
		last_name: {
			type: String,
			required: [true, 'Last name is required'],
			trim: true,
			maxlength: 50,
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
		},
		position: {
			type: String,
			required: [true, 'Position is required'],
			trim: true,
			maxlength: 100,
		},
		salary: {
			type: Number,
			required: [true, 'Salary is required'],
			min: [0, 'Salary cannot be negative'],
		},
		date_of_joining: {
			type: Date,
			required: [true, 'Date of joining is required'],
		},
		department: {
			type: String,
			required: [true, 'Department is required'],
			trim: true,
			maxlength: 100,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true, // fast "all employees of this user" queries
		},
	},
	{
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
		toJSON: {
			transform: (doc, ret) => {
				delete ret.__v
				return ret
			},
		},
	}
)

module.exports = mongoose.model('Employee', employeeSchema)
