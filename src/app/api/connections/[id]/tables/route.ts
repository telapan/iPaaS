import { NextResponse } from "next/server";
import { getConnectionPool, getTables } from "@/lib/mssql";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;

  try {
    const pool = await getConnectionPool(id, user.id);
    const tables = await getTables(pool);
    await pool.close();
    return NextResponse.json(tables);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch tables";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
