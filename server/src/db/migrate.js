import fs from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env') });

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Neither DIRECT_DATABASE_URL nor DATABASE_URL is defined.');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function runMigration() {
  const isDown = process.argv.includes('--down');
  const migrationFile = resolve(__dirname, 'migrations', '0001_users_and_tokens.sql');
  const sqlContent = fs.readFileSync(migrationFile, 'utf8');

  const [upPart, downPart] = sqlContent.split('-- DOWN');

  const client = await pool.connect();
  try {
    if (isDown) {
      if (!downPart) {
        throw new Error('No -- DOWN section found in migration file.');
      }
      console.log('Running migration 0001 DOWN (rollback)...');
      // Uncomment lines starting with '-- '
      const downSql = downPart
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('--') && !line.startsWith('---'))
        .map((line) => line.replace(/^--\s*/, ''))
        .join('\n');

      await client.query('BEGIN');
      await client.query(downSql);
      await client.query('COMMIT');
      console.log('Migration 0001 rollback successful.');
    } else {
      console.log('Running migration 0001 UP...');
      await client.query('BEGIN');
      await client.query(upPart);
      await client.query('COMMIT');
      console.log('Migration 0001 UP applied successfully.');
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
