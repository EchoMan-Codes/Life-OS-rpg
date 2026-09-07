import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env') });

async function checkDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query('SELECT NOW() as now');
  await pool.end();
  return rows[0].now;
}

async function checkMail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.verify();
  return true;
}

const results = { db: false, mail: false };
try { await checkDb(); results.db = true; } catch (e) { results.dbError = e.message; }
try { await checkMail(); results.mail = true; } catch (e) { results.mailError = e.message; }
console.log(JSON.stringify(results, null, 2));
process.exit(results.db && results.mail ? 0 : 1);
