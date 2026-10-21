import cron from 'node-cron';
import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { startDailyResetScheduler } from './services/daily-reset.service.js';
import { notificationService } from './services/notification.service.js';

let resetTask = null;
let notificationTask = null;

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Life OS API running on http://0.0.0.0:${env.PORT}`);
  console.log(`[SERVER] Environment: ${env.NODE_ENV}`);
  console.log(`[SERVER] CORS Origin: ${env.CLIENT_ORIGIN}`);

  resetTask = startDailyResetScheduler(pool);
  console.log('[SERVER] Daily midnight reset scheduler started (interval: */15 * * * *).');

  notificationTask = cron.schedule('* * * * *', async () => {
    try {
      await notificationService.processScheduledNotifications();
    } catch (err) {
      console.error('[NOTIFICATIONS_CRON] Scheduled processing error:', err.message);
    }
  });
  console.log('[SERVER] Smart notification scheduler started (interval: * * * * *).');
});

function handleShutdown(signal) {
  console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);
  if (resetTask) {
    resetTask.stop();
  }
  if (notificationTask) {
    notificationTask.stop();
  }
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
