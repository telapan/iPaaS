import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth-helpers";
import { getConnectionPool, getTableData } from "@/lib/mssql";
import {
  executePipeline,
  executePipelineUpTo,
  inferColumns,
  type TransformContext,
} from "@/lib/transformations/engine";
import type { PipelineConfig, DataRow } from "@/lib/transformations/types";

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
  const stepIndex = body.stepIndex as number | undefined;
  const limit = Math.min(body.limit || 100, 500);
  // Use client-provided config if available, otherwise fall back to saved config
  const clientConfig = body.config as PipelineConfig | undefined;

  const previewSourceLimit = Math.min(
    Math.max(body.sourceLimit || 10000, 100),
    100000
  );

  try {
    const pool = await getConnectionPool(pipeline.connectionId, user.id);
    const { rows: sourceRows, totalCount: sourceTotalCount } = await getTableData(
      pool,
      pipeline.sourceSchema,
      pipeline.sourceTable,
      0,
      previewSourceLimit
    );
    await pool.close();

    const ctx: TransformContext = {
      userId: user.id,
      fetchTableData: async (connId, schema, table) => {
        const p = await getConnectionPool(connId, user.id);
        const { rows } = await getTableData(p, schema, table, 0, 10000);
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

    const config = clientConfig || (pipeline.config as unknown as PipelineConfig);
    let resultRows: DataRow[];

    if (stepIndex !== undefined && stepIndex >= 0) {
      resultRows = await executePipelineUpTo(
        sourceRows as DataRow[],
        config,
        stepIndex,
        ctx
      );
    } else if (stepIndex === -1) {
      resultRows = sourceRows as DataRow[];
    } else {
      resultRows = await executePipeline(sourceRows as DataRow[], config, ctx);
    }

    const columns = inferColumns(resultRows);

    return NextResponse.json({
      rows: resultRows.slice(0, limit),
      columns,
      totalCount: resultRows.length,
      sourceTotalCount,
      sourceRowsFetched: sourceRows.length,
      isPartialPreview: sourceRows.length < sourceTotalCount,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
