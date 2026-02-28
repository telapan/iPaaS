import sql from "mssql";
import { decrypt } from "./encryption";
import { prisma } from "./db";

export async function getConnectionPool(
  connectionId: string,
  userId: string
): Promise<sql.ConnectionPool> {
  const conn = await prisma.connection.findFirst({
    where: { id: connectionId, userId },
  });

  if (!conn) {
    throw new Error("Connection not found");
  }

  const connectionString = decrypt(
    conn.encryptedConnStr,
    conn.iv,
    conn.authTag
  );

  const pool = await sql.connect(connectionString);
  return pool;
}

export async function testConnection(
  connectionString: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pool = await sql.connect(connectionString);
    await pool.request().query("SELECT 1 AS test");
    await pool.close();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function getTables(
  pool: sql.ConnectionPool
): Promise<{ schema: string; name: string; rowCount: number }[]> {
  const result = await pool.request().query(`
    SELECT
      s.name AS [schema],
      t.name AS [name],
      p.rows AS [rowCount]
    FROM sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    INNER JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
    ORDER BY s.name, t.name
  `);
  return result.recordset;
}

export async function getTableSchema(
  pool: sql.ConnectionPool,
  schemaName: string,
  tableName: string
): Promise<
  { name: string; type: string; nullable: boolean; maxLength: number }[]
> {
  const result = await pool
    .request()
    .input("schema", sql.NVarChar, schemaName)
    .input("table", sql.NVarChar, tableName)
    .query(`
      SELECT
        c.name,
        t.name AS type,
        c.is_nullable AS nullable,
        c.max_length AS maxLength
      FROM sys.columns c
      INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
      INNER JOIN sys.tables tbl ON c.object_id = tbl.object_id
      INNER JOIN sys.schemas s ON tbl.schema_id = s.schema_id
      WHERE s.name = @schema AND tbl.name = @table
      ORDER BY c.column_id
    `);
  return result.recordset;
}

export async function getTableData(
  pool: sql.ConnectionPool,
  schemaName: string,
  tableName: string,
  offset: number = 0,
  limit: number = 50
): Promise<{ rows: Record<string, unknown>[]; totalCount: number }> {
  const safeName = `[${schemaName.replace(/]/g, "]]")}].[${tableName.replace(/]/g, "]]")}]`;

  const countResult = await pool
    .request()
    .query(`SELECT COUNT(*) AS total FROM ${safeName}`);
  const totalCount = countResult.recordset[0].total;

  const safeOffset = Math.max(0, Math.floor(offset));
  const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));

  const dataResult = await pool
    .request()
    .query(
      `SELECT * FROM ${safeName} ORDER BY (SELECT NULL) OFFSET ${safeOffset} ROWS FETCH NEXT ${safeLimit} ROWS ONLY`
    );

  return { rows: dataResult.recordset, totalCount };
}
