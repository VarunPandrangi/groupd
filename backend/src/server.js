import { env } from './config/env.js';
import { connectDB } from './config/database.js';
import app from './app.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  await connectDB();

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

bootstrap();