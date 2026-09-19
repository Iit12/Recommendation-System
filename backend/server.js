import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env and root .env
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import app from './src/app.js';
import { initDatabase, database } from './src/database/index.js';

const PORT = process.env.PORT || 5000;

// Initialize Database and start listening
let server;

async function startServer() {
  try {
    // Initialize MongoDB and verify indexes
    await initDatabase();
  } catch (dbError) {
    console.warn(`[Server] Warning: MongoDB initialization failed (${dbError.message}). Starting server in fallback mode.`);
  }

  server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Smart Shopping REST API (Phase 5 MongoDB Persistence)`);
    console.log(`📡 Server running on: http://127.0.0.1:${PORT}`);
    console.log(`🏥 Health check:      http://127.0.0.1:${PORT}/api/health`);
    console.log(`📚 API v1 Root:       http://127.0.0.1:${PORT}/api/v1`);
    console.log(`💾 Database:          smart_shopping (127.0.0.1:27017)`);
    console.log(`⚙️  Environment:       ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
}

startServer();

// Handle graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Gracefully shutting down Smart Shopping API server...');
  try {
    await database.close();
  } catch (e) {
    // Ignore close errors
  }
  if (server) {
    server.close(() => {
      console.log('✅ Server closed cleanly.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default server;
