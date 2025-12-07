import mysql from 'mysql2/promise';

// Support both individual config and DATABASE_URL (for Railway)
const createPool = () => {
  if (process.env.DATABASE_URL) {
    // Parse DATABASE_URL for Railway/Heroku
    const url = new URL(process.env.DATABASE_URL);
    return mysql.createPool({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading '/'
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  } else {
    // Use individual env variables for local development
    return mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'educore_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
};

const pool = createPool();

export default pool;

