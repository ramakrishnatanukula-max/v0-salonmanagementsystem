import mysql, { type Pool, type PoolOptions } from "mysql2/promise"

let _pool: Pool | null = null

function getConfig(): PoolOptions {
  const host = process.env.MYSQL_HOST ||  "194.163.45.105";
  const user = process.env.MYSQL_USER || "marketingOwner";
  const password = process.env.MYSQL_PASSWORD || "M@rketing123!";
  const database = process.env.MYSQL_DATABASE || "Sap";

  if (!host || !user || !password || !database) {
    throw new Error(
      "Missing MySQL env vars (set MYSQL_URL/DATABASE_URL or MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE)",
    )
  }

  return {
    host,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
  }
}

export function getPool(): Pool {
  if (!_pool) {
    const url = process.env.MYSQL_URL || process.env.DATABASE_URL
    _pool = url ? mysql.createPool(url) : mysql.createPool(getConfig())
  }
  return _pool
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await getPool().query(sql, params)
  return rows as T[]
}

export async function execute(sql: string, params?: any[]) {
  const [result] = await getPool().execute(sql, params)
  return result
}
