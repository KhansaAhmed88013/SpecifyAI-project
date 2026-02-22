const express = require('express');
const cors = require('cors');
const createError = require('./utils/createError');
const errorHandler = require('./utils/errorHandler');
const app = express();
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const aiTestRoutes = require('./routes/aiTestRoutes');

// Middleware to parse JSON bodies
app.use(express.json());

// CORS for local frontend
app.use(
	cors({
		origin: 'http://localhost:5173',
		credentials: true,
	})
);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiTestRoutes);

app.use((req, res, next) => {
	next(createError(404, 'Not found'));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;