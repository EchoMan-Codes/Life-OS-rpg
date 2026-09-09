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

async function initMigrationTracking(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Seed 0001 if users table already exists from previous runs
  const usersCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    );
  `);
  if (usersCheck.rows[0].exists) {
    await client.query(`
      INSERT INTO schema_migrations (name)
      VALUES ('0001_users_and_tokens.sql')
      ON CONFLICT (name) DO NOTHING;
    `);
  }
}

async function runMigrations() {
  const isDown = process.argv.includes('--down');
  const rollbackAll = process.argv.includes('--all');
  const migrationsDir = resolve(__dirname, 'migrations');

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();

  try {
    await initMigrationTracking(client);

    const { rows: appliedRows } = await client.query(
      'SELECT name FROM schema_migrations ORDER BY name ASC'
    );
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    if (isDown) {
      // Rollback migrations in reverse order
      const migrationsToRollback = files
        .filter((f) => appliedSet.has(f))
        .reverse();

      if (migrationsToRollback.length === 0) {
        console.log('No applied migrations to roll back.');
        return;
      }

      // If --all is not passed, only roll back the latest applied migration
      const targetMigrations = rollbackAll ? migrationsToRollback : [migrationsToRollback[0]];

      for (const file of targetMigrations) {
        console.log(`Running migration ${file} DOWN (rollback)...`);
        const filePath = resolve(migrationsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const [, downPart] = content.split('-- DOWN');

        if (!downPart) {
          throw new Error(`No -- DOWN section found in ${file}`);
        }

        const downSql = downPart
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.startsWith('--') && !line.startsWith('---'))
          .map((line) => line.replace(/^--\s*/, ''))
          .join('\n');

        await client.query('BEGIN');
        await client.query(downSql);
        await client.query('DELETE FROM schema_migrations WHERE name = $1', [file]);
        await client.query('COMMIT');
        console.log(`Migration ${file} rollback successful.`);
      }
    } else {
      // Apply pending migrations in ascending order
      const pendingMigrations = files.filter((f) => !appliedSet.has(f));

      if (pendingMigrations.length === 0) {
        console.log('All migrations are up to date.');
        return;
      }

      for (const file of pendingMigrations) {
        console.log(`Running migration ${file} UP...`);
        const filePath = resolve(migrationsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const [upPart] = content.split('-- DOWN');

        await client.query('BEGIN');
        await client.query(upPart);
        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [file]
        );
        await client.query('COMMIT');
        console.log(`Migration ${file} applied successfully.`);
      }
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

runMigrations();
