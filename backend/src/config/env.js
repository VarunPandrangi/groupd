import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'PORT',
  'CORS_ORIGIN',
];

const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

if (missing.length > 0) {
  for (const name of missing) {
    // eslint-disable-next-line no-console
    console.error(`[env] Missing required environment variable: ${name}`);
  }
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}`
  );
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  PORT: parseInt(process.env.PORT, 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
