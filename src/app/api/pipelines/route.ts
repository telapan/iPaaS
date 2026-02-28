import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";

const createSchema = z.object({
  projectId: z.string().min(1),
  connectionId: z.string().min(1),
  sourceTable: z.string().min(1),
  sourceSchema: z.string().default("dbo"),
  name: z.string().min(1),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  const pipelines = await prisma.transformationPipeline.findMany({
    where: {
      project: { userId: user.id },
      ...(projectId ? { projectId } : {}),
    },
    include: {
      connection: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pipelines);
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

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, userId: user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const connection = await prisma.connection.findFirst({
    where: { id: parsed.data.connectionId, userId: user.id },
  });
  if (!connection) {
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  const pipeline = await prisma.transformationPipeline.create({
    data: {
      projectId: parsed.data.projectId,
      connectionId: parsed.data.connectionId,
      sourceTable: parsed.data.sourceTable,
      sourceSchema: parsed.data.sourceSchema,
      name: parsed.data.name,
      config: { steps: [] },
    },
  });

  return NextResponse.json(pipeline, { status: 201 });
}
