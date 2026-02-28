import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const pipeline = await prisma.transformationPipeline.findFirst({
    where: { id, project: { userId: user.id } },
    include: {
      connection: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (!pipeline) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(pipeline);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const existing = await prisma.transformationPipeline.findFirst({
    where: { id, project: { userId: user.id } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  if (body.name) updateData.name = body.name;
  if (body.config) updateData.config = body.config;
  if (body.sourceTable) updateData.sourceTable = body.sourceTable;
  if (body.sourceSchema) updateData.sourceSchema = body.sourceSchema;
  if (body.connectionId) updateData.connectionId = body.connectionId;

  const pipeline = await prisma.transformationPipeline.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(pipeline);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const existing = await prisma.transformationPipeline.findFirst({
    where: { id, project: { userId: user.id } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.transformationPipeline.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
