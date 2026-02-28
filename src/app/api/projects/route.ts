import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { pipelines: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
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

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
