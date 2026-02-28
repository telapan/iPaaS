import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";

const createSchema = z.object({
  name: z.string().min(1),
  connectionString: z.string().min(1),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const connections = await prisma.connection.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(connections);
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { encrypted, iv, authTag } = encrypt(parsed.data.connectionString);

  const connection = await prisma.connection.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      encryptedConnStr: encrypted,
      iv,
      authTag,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(connection, { status: 201 });
}
