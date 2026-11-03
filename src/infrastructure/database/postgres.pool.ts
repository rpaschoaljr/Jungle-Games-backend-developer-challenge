import { Pool } from "pg";

export class DatabasePool {
  private static instance: Pool | null = null;

  static getPool(): Pool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new Pool({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || "jungle_user",
        password: process.env.DB_PASSWORD || "jungle_secret",
        database: process.env.DB_NAME || "jungle_wagering",
        max: 50,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 0,
      });

      // Blindagem contra quedas de rede / queda do PostgreSQL:
      // Anexa listener no client uma única vez ao conectar para evitar MaxListenersExceeded
      DatabasePool.instance.on("connect", (client) => {
        client.on("error", () => {});
      });

      // Impede que o processo Bun/Node seja encerrado por conexões cortadas
      DatabasePool.instance.on("error", () => {
        // Conexão morta pelo PostgreSQL (crash/restart) - descartada com segurança pelo Pool
      });
    }
    return DatabasePool.instance;
  }

  static async close(): Promise<void> {
    if (DatabasePool.instance) {
      await DatabasePool.instance.end();
      DatabasePool.instance = null;
    }
  }
}
