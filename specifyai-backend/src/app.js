const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const createError = require('./utils/createError');
const errorHandler = require('./utils/errorHandler');

const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const aiTestRoutes = require('./routes/aiTestRoutes');

const app = express();

// Security headers
app.use(helmet());

// Rate limiting for API routes
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100 // limit each IP to 100 requests per window
});

app.use('/api', limiter);

// Logging
app.use(morgan("dev"));

// Middleware to parse JSON bodies
app.use(express.json());

// CORS configuration
app.use(
	cors({
		origin: [
			'http://localhost:5173',
			'http://specifyai.159.89.165.42.nip.io'
		],
		credentials: true
	})
);

// Swagger configuration
const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "SpecifyAI API",
			version: "1.0.0",
			description: "API documentation for SpecifyAI"
		},
		servers: [
			{
				url: "http://specifyai.159.89.165.42.nip.io"
			}
		]
	},
	apis: ["./src/routes/*.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerDocs));


// Health check endpoint
app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'running',
		service: 'SpecifyAI API'
	});
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiTestRoutes);

// 404 handler
app.use((req, res, next) => {
	next(createError(404, 'Not found'));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
