import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

import app from './src/app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Smart Shopping REST API (Phase 2)`);
  console.log(`📡 Server running on: http://127.0.0.1:${PORT}`);
  console.log(`🏥 Health check:      http://127.0.0.1:${PORT}/api/health`);
  console.log(`📚 API v1 Root:       http://127.0.0.1:${PORT}/api/v1`);
  console.log(`⚙️  Environment:       ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================================`);
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Gracefully shutting down Smart Shopping API server...');
  server.close(() => {
    console.log('✅ Server closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default server;
