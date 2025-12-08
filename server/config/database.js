import mysql from 'mysql2/promise';

const createPool = () => {
  let dbConfig = {
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_CA_CERT ? {
      ca: process.env.DB_CA_CERT,
      rejectUnauthorized: true
    } : undefined
  };

  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    dbConfig = {
      ...dbConfig,
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), 
    };
  } 
  else {
    dbConfig = {
      ...dbConfig,
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'educore_db',
    };
  }

  return mysql.createPool(dbConfig);
};

const pool = createPool();
export default pool;