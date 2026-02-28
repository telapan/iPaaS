import { NextResponse } from "next/server";
import {
  getConnectionPool,
  getTableSchema,
  getTableData,
} from "@/lib/mssql";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; table: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id, table } = await params;
  const url = new URL(req.url);
  const schema = url.searchParams.get("schema") || "dbo";
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);

  try {
    const pool = await getConnectionPool(id, user.id);
    const [columns, data] = await Promise.all([
      getTableSchema(pool, schema, table),
      getTableData(pool, schema, table, offset, limit),
    ]);
    await pool.close();

    return NextResponse.json({
      columns,
      rows: data.rows,
      totalCount: data.totalCount,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch table data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
