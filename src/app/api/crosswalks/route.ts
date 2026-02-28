import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";

const createSchema = z.object({
  name: z.string().min(1),
  mappings: z
    .array(
      z.object({
        sourceValue: z.string(),
        targetValue: z.string(),
      })
    )
    .default([]),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const crosswalks = await prisma.crosswalk.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(crosswalks);
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

  const crosswalk = await prisma.crosswalk.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      mappings: parsed.data.mappings,
    },
  });

  return NextResponse.json(crosswalk, { status: 201 });
}
