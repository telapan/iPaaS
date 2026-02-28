import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";
import { generateCsv } from "@/lib/csv";

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

  const mappings = crosswalk.mappings as {
    sourceValue: string;
    targetValue: string;
  }[];

  const csv = generateCsv(mappings);
  const filename = `${crosswalk.name.replace(/[^a-zA-Z0-9-_]/g, "_")}_crosswalk.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
