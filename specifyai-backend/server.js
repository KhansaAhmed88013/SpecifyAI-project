require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');

const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

const ensureCollections = async (db, collectionNames) => {
	for (const name of collectionNames) {
		const exists = await db.listCollections({ name }).hasNext();
		if (!exists) {
			await db.createCollection(name);
		}
	}
};

const startServer = async () => {
	try {
		await mongoose.connect(mongoUri);
		console.log('MongoDB connected');
		await ensureCollections(mongoose.connection.db, ['users', 'projects']);
		console.log('MongoDB collections ensured');
		const server = app.listen(port, () => {
			console.log(`Server is running on http://localhost:${port}`);
		});
		// Set timeout to 120 seconds for AI operations (specification generation)
		server.timeout = 120000;
		server.keepAliveTimeout = 120000;
		server.headersTimeout = 125000;
	} catch (error) {
		console.error('MongoDB connection error:', error);
		process.exit(1);
	}
};

startServer();

