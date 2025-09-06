const mysql = require('mysql2');

class Database {
    constructor() {
        this.host = process.env.DB_HOST || 'localhost';
        this.username = process.env.DB_USER || 'root';
        this.password = process.env.DB_PASSWORD || '';
        this.dbname = process.env.DB_NAME || 'verified_db';
        this.connection = null;
    }

    connect() {
        try {
            if (this.connection === null) {
                this.connection = mysql.createConnection({
                    host: this.host,
                    user: this.username,
                    password: this.password,
                    database: this.dbname,
                    port: 3306
                });
            }

            return this.connection;
        } catch (error) {
            console.error("Database Connection Error: " + error.message);
            throw new Error("Database connection failed: " + error.message);
        }
    }
}

module.exports = Database;
