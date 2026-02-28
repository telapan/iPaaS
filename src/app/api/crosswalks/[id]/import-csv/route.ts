import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";
import { parseCsv } from "@/lib/csv";

export async function POST(
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

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const { data, fields } = parseCsv<Record<string, string>>(text);

  if (
    !fields.includes("sourceValue") ||
    !fields.includes("targetValue")
  ) {
    return NextResponse.json(
      {
        error:
          "CSV must have 'sourceValue' and 'targetValue' columns. Found: " +
          fields.join(", "),
      },
      { status: 400 }
    );
  }

  const mappings = data.map((row) => ({
    sourceValue: String(row.sourceValue ?? ""),
    targetValue: String(row.targetValue ?? ""),
  }));

  const crosswalk = await prisma.crosswalk.update({
    where: { id },
    data: { mappings },
  });

  return NextResponse.json(crosswalk);
}
