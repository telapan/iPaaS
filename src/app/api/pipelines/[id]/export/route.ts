import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";
import { getConnectionPool, getTableData } from "@/lib/mssql";
import {
  executePipeline,
  type TransformContext,
} from "@/lib/transformations/engine";
import type { PipelineConfig, DataRow } from "@/lib/transformations/types";
import { generateCsv } from "@/lib/csv";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const pipeline = await prisma.transformationPipeline.findFirst({
    where: { id, project: { userId: user.id } },
  });
  if (!pipeline) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const csvOptions = body.options || {};

  try {
    const pool = await getConnectionPool(pipeline.connectionId, user.id);
    const { rows: sourceRows } = await getTableData(
      pool,
      pipeline.sourceSchema,
      pipeline.sourceTable,
      0,
      999999
    );
    await pool.close();

    const ctx: TransformContext = {
      userId: user.id,
      fetchTableData: async (connId, schema, table) => {
        const p = await getConnectionPool(connId, user.id);
        const { rows } = await getTableData(p, schema, table, 0, 999999);
        await p.close();
        return rows as DataRow[];
      },
      loadCrosswalk: async (crosswalkId) => {
        const cw = await prisma.crosswalk.findFirstOrThrow({
          where: { id: crosswalkId, userId: user.id },
        });
        const map = new Map<string, string>();
        for (const m of cw.mappings as { sourceValue: string; targetValue: string }[]) {
          map.set(m.sourceValue, m.targetValue);
        }
        return map;
      },
    };

    const config = pipeline.config as unknown as PipelineConfig;
    const transformedRows = await executePipeline(
      sourceRows as DataRow[],
      config,
      ctx
    );

    const csv = generateCsv(
      transformedRows as Record<string, unknown>[],
      csvOptions
    );

    await prisma.exportHistory.create({
      data: {
        pipelineId: pipeline.id,
        userId: user.id,
        rowCount: transformedRows.length,
        status: "success",
      },
    });

    const filename = `${pipeline.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Export failed";

    await prisma.exportHistory.create({
      data: {
        pipelineId: pipeline.id,
        userId: user.id,
        rowCount: 0,
        status: "failed",
        errorMsg: message,
      },
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
