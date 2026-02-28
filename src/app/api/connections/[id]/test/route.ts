import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { testConnection } from "@/lib/mssql";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const conn = await prisma.connection.findFirst({
    where: { id, userId: user.id },
  });
  if (!conn) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const connectionString = decrypt(conn.encryptedConnStr, conn.iv, conn.authTag);
  const result = await testConnection(connectionString);

  return NextResponse.json(result);
}
