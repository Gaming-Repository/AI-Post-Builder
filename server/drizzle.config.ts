import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '../.env' });

const url = process.env.DATABASE_URL;

export default defineConfig({
  dialect: url?.startsWith('mysql') ? 'mysql' : 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: url?.startsWith('mysql')
    ? { url }
    : { url: './dev.db' },
});
