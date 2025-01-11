const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000,
    application_name: 'Vide-Heroku'
});

module.exports = pool;