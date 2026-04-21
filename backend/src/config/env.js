import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
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
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  PORT: parseInt(process.env.PORT, 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  NODE_ENV: process.env.NODE_ENV || 'development',
};