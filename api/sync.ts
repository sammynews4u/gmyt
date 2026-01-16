import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req: any, res: any) {
  const rawKey = req?.query?.key;
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;

  if (!key || typeof key !== "string") {
    return res.status(400).json({ error: "Strategic Sync Key required for node handshake" });
  }

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
    if (req.method === "GET") {
      const result = await pool.query(
        "SELECT payload FROM gmyt_enterprise_sync WHERE sync_key = $1",
        [key]
      );

      if (result.rows.length === 0) {
        return res.status(200).json({ message: "Node detected but uninitialized", data: null });
      }

      return res.status(200).json({
        message: "Pull successful",
        data: result.rows[0].payload,
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === "POST") {
      const data = req.body;

      if (!data || typeof data !== "object") {
        return res.status(400).json({ error: "Invalid payload format" });
      }

      await pool.query(
        `
        INSERT INTO gmyt_enterprise_sync (sync_key, payload, last_updated)
        VALUES ($1, $2, now())
        ON CONFLICT (sync_key)
        DO UPDATE SET payload = EXCLUDED.payload, last_updated = now();
        `,
        [key, JSON.stringify(data)]
      );

      return res.status(200).json({
        message: "Cloud Node Hydrated successfully",
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Database Transaction Error:", error);
    return res.status(500).json({
      error: "Strategic Link Failure",
      details: error?.message || String(error)
    });
  }
}
