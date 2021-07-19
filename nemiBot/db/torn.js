const { Pool } = require('pg');
const logger = require('../helpers/logger');
const config = require('../config');
const dbconfig = config.database.torn;

module.exports = {
  Query: Query
};

/**
 * Execute a postgres query
 * @param {String} query Querystring
 * @param {Array} params Array of paramters for the query (empty array for none)
 */
const db = new Pool({
  user: dbconfig.user,
  host: dbconfig.host,
  database: dbconfig.database,
  password: dbconfig.password,
  port: dbconfig.port,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

async function Query (query, params) {
  try {
    await db.connect();
    const start = Date.now();
    const res = await db.query(query, params);
    const duration = Date.now() - start;
    logger.log(`executed query, ${query}, ${duration}, rows: ${res.rowCount}`, 'debug');
    return res.rows;
  } catch (err) {
    logger.log(err.stack, 'error');
  }
}
