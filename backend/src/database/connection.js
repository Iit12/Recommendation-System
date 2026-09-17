/**
 * Phase 5 Database Connection Manager
 * Native MongoDB Driver singleton connection handler.
 */

import { MongoClient } from 'mongodb';

let client = null;
let dbInstance = null;

export const database = {
  /**
   * Connects to MongoDB server and initializes database handle.
   * 
   * @param {string} uri MongoDB connection string
   * @param {string} dbName Database name
   * @returns {Promise<Db>} Connected Db instance
   */
  async connect(
    uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
    dbName = process.env.MONGODB_DB_NAME || 'smart_shopping'
  ) {
    if (dbInstance && client) {
      return dbInstance;
    }

    try {
      console.log(`[MongoDB] Connecting to ${uri} (Database: "${dbName}")...`);

      client = new MongoClient(uri, {
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      await client.connect();
      dbInstance = client.db(dbName);

      // Verify connection with ping
      await dbInstance.command({ ping: 1 });
      console.log(`[MongoDB] Connected successfully to database "${dbName}".`);

      return dbInstance;
    } catch (error) {
      console.error(`[MongoDB] Connection failed:`, error.message);
      client = null;
      dbInstance = null;
      throw error;
    }
  },

  /**
   * Returns the active database instance.
   * Throws error if not yet connected.
   */
  getDb() {
    if (!dbInstance) {
      throw new Error('[MongoDB] Database is not connected. Call database.connect() first.');
    }
    return dbInstance;
  },

  /**
   * Returns the active MongoClient instance.
   */
  getClient() {
    return client;
  },

  /**
   * Checks database connectivity status.
   */
  async ping() {
    if (!dbInstance) return false;
    try {
      await dbInstance.command({ ping: 1 });
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Gracefully closes the database connection.
   */
  async close() {
    if (client) {
      await client.close();
      client = null;
      dbInstance = null;
      console.log('[MongoDB] Connection closed.');
    }
  }
};
