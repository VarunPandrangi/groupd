export const corsOptions = {
  origin: (origin, callback) => {
    const allowed = process.env.CORS_ORIGIN;

    // allow server-to-server or no-origin requests
    if (!origin) return callback(null, true);

    // allow your frontend (handles small variations)
    if (origin.startsWith(allowed)) {
      return callback(null, true);
    }

    // DO NOT throw error → just block silently
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};