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
  const crosswalk = await prisma.crosswalk.findFirst({
    where: { id, userId: user.id },
  });

  if (!crosswalk) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(crosswalk);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const existing = await prisma.crosswalk.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const updateData: Record<string, unknown> = {};
  if (body.name) updateData.name = body.name;
  if (body.mappings) updateData.mappings = body.mappings;

  const crosswalk = await prisma.crosswalk.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(crosswalk);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const existing = await prisma.crosswalk.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.crosswalk.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
