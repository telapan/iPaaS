import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const exports = await prisma.exportHistory.findMany({
    where: { userId: user.id },
    include: {
      pipeline: {
        select: {
          name: true,
          sourceTable: true,
          sourceSchema: true,
          project: { select: { name: true } },
        },
      },
    },
    orderBy: { exportedAt: "desc" },
    take: 100,
  });

  return NextResponse.json(exports);
}
