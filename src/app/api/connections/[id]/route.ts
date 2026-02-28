import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  connectionString: z.string().min(1).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const connection = await prisma.connection.findFirst({
    where: { id, userId: user.id },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  if (!connection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(connection);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const existing = await prisma.connection.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updateData: Record<string, string> = {};
  if (parsed.data.name) {
    updateData.name = parsed.data.name;
  }
  if (parsed.data.connectionString) {
    const { encrypted, iv, authTag } = encrypt(parsed.data.connectionString);
    updateData.encryptedConnStr = encrypted;
    updateData.iv = iv;
    updateData.authTag = authTag;
  }

  const connection = await prisma.connection.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(connection);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const existing = await prisma.connection.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.connection.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
