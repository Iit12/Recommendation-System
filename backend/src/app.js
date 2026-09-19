import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env and root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiV1Routes from './routes/index.js';

const app = express();

// Configure CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin '${origin}' not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use(requestLogger);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Smart Shopping API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Root Welcome Endpoint
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    name: 'Smart Shopping REST API',
    version: '1.0.0',
    phase: 'Phase 2: Backend + REST API Foundation',
    documentation: '/api/v1/docs or backend/API.md',
    health: '/api/health',
  });
});

// Mount Versioned API Routes (/api/v1)
app.use(process.env.API_PREFIX || '/api/v1', apiV1Routes);

// Catch 404 Not Found
app.use(notFoundHandler);

// Centralized Error Handling
app.use(errorHandler);

export default app;
