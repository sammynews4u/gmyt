
import { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const { Pool } = pg;

// Create a connection pool to CockroachDB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for CockroachDB Serverless
  }
});

/**
 * PRODUCTION PROTOCOL: GMYT-SYNC-V2
 * Handles global state persistence using CockroachDB JSONB storage.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { key } = req.query;

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'Strategic Sync Key required for node handshake' });
  }

  // Ensure table exists on first run
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gmyt_enterprise_sync (
        sync_key TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        last_updated TIMESTAMPTZ DEFAULT now()
      );
    `);
  } catch (e) {
    console.error("Schema initialization failed", e);
  }

  try {
    if (req.method === 'GET') {
      // PULL: Retrieve the global state for the given sync key
      const result = await pool.query(
        'SELECT payload FROM gmyt_enterprise_sync WHERE sync_key = $1',
        [key]
      );

      if (result.rows.length === 0) {
        return res.status(200).json({ 
          message: 'Node detected but uninitialized', 
          data: null 
        });
      }

      return res.status(200).json({ 
        message: 'Pull successful', 
        data: result.rows[0].payload,
        timestamp: new Date().toISOString() 
      });
    }

    if (req.method === 'POST') {
      // PUSH: Synchronize local state to the cloud cluster
      const data = req.body;
      
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'Invalid payload format' });
      }

      await pool.query(`
        INSERT INTO gmyt_enterprise_sync (sync_key, payload, last_updated)
        VALUES ($1, $2, now())
        ON CONFLICT (sync_key) 
        DO UPDATE SET payload = EXCLUDED.payload, last_updated = now();
      `, [key, JSON.stringify(data)]);

      return res.status(200).json({ 
        message: 'Cloud Node Hydrated successfully', 
        timestamp: new Date().toISOString() 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error("Database Transaction Error:", error);
    return res.status(500).json({ 
      error: 'Strategic Link Failure', 
      details: error.message 
    });
  }
}
