const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
	{
		id: { type: String },
		text: { type: String },
	},
	{ _id: false }
);

const clarificationSchema = new mongoose.Schema(
	{
		questions: [questionSchema],
		answers: { type: Map, of: String },
	},
	{ _id: false }
);

const projectSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
		requirement: { type: String, required: true },
		clarifications: [clarificationSchema],
		allowExtraRound: { type: Boolean, default: false },
		finalSpec: { type: mongoose.Schema.Types.Mixed, default: null },
		status: {
			type: String,
			enum: ['IN_PROGRESS','READY_FOR_SPEC', 'COMPLETED'],
			default: 'IN_PROGRESS',
		},
	},
	{
		collection: 'projects',
		timestamps: true,
	}
);

module.exports = mongoose.model('Project', projectSchema);
