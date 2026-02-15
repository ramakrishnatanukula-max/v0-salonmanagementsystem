import mysql, { type Pool, type PoolOptions } from "mysql2/promise"

// Augment global type
declare global {
  var _mysql_pool: Pool | undefined
}

function getConfig(): PoolOptions {
  const host = process.env.MYSQL_HOST || "194.163.45.105"
  const user = process.env.MYSQL_USER || "marketingOwner"
  const password = process.env.MYSQL_PASSWORD || "M@rketing123!"
  const database = process.env.MYSQL_DATABASE || "Sap"

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
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  }
}

export function getPool(): Pool {
  if (!global._mysql_pool) {
    const url = process.env.MYSQL_URL || process.env.DATABASE_URL
    global._mysql_pool = url ? mysql.createPool(url) : mysql.createPool(getConfig())
  }
  return global._mysql_pool
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const [rows] = await getPool().query(sql, params)
    return rows as T[]
  } catch (error: any) {
    console.error("Database query error:", error)
    throw error
  }
}

export async function execute(sql: string, params?: any[]) {
  try {
    const [result] = await getPool().execute(sql, params)
    return result
  } catch (error: any) {
    console.error("Database execute error:", error)
    throw error
  }
}
