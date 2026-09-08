import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

const server = app.listen(env.PORT, () => {
  console.log(`[SERVER] Life OS API running on http://localhost:${env.PORT}`);
  console.log(`[SERVER] Environment: ${env.NODE_ENV}`);
  console.log(`[SERVER] CORS Origin: ${env.CLIENT_ORIGIN}`);
});

function handleShutdown(signal) {
  console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('[SERVER] Database pool closed. Shutdown complete.');
      process.exit(0);
    } catch (err) {
      console.error('[SERVER] Error during shutdown:', err.message);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('[SERVER] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
