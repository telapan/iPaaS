"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import type { PipelineConfig, ColumnInfo } from "@/lib/transformations/types";

interface DataPreviewProps {
  pipelineId: string;
  stepIndex: number;
  config: PipelineConfig;
}

export function DataPreview({
  pipelineId,
  stepIndex,
  config,
}: DataPreviewProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sourceTotalCount, setSourceTotalCount] = useState(0);
  const [sourceRowsFetched, setSourceRowsFetched] = useState(0);
  const [isPartialPreview, setIsPartialPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/pipelines/${pipelineId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepIndex, limit: 200, config }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Preview failed");
        setRows([]);
        setColumns([]);
        return;
      }

      const data = await res.json();
      setRows(data.rows);
      setColumns(data.columns);
      setTotalCount(data.totalCount);
      setSourceTotalCount(data.sourceTotalCount || 0);
      setSourceRowsFetched(data.sourceRowsFetched || 0);
      setIsPartialPreview(data.isPartialPreview || false);
    } catch {
      setError("Failed to load preview");
    } finally {
      setLoading(false);
    }
  }, [pipelineId, stepIndex, config]);

  useEffect(() => {
    if (stepIndex >= -1) {
      fetchPreview();
    }
  }, [fetchPreview, stepIndex]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">Data Preview</CardTitle>
            {stepIndex === -1 ? (
              <Badge variant="outline">Source Data</Badge>
            ) : (
              <Badge variant="secondary">After Step {stepIndex + 1}</Badge>
            )}
            {totalCount > 0 && (
              <Badge variant="outline">
                {rows.length} of {totalCount.toLocaleString()} result rows
              </Badge>
            )}
            {sourceTotalCount > 0 && (
              <Badge variant="outline">
                Source: {sourceTotalCount.toLocaleString()} total rows
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPreview}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isPartialPreview && !loading && (
          <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <div className="ml-2 text-sm">
              Preview is based on {sourceRowsFetched.toLocaleString()} of{" "}
              {sourceTotalCount.toLocaleString()} source rows. The full export
              will process all {sourceTotalCount.toLocaleString()} rows and may
              produce different counts.
            </div>
          </Alert>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-muted-foreground">
              Loading preview...
            </span>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No data to preview. Click the eye icon on a step to preview data at
            that point.
          </p>
        ) : (
          <div className="max-h-96 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.name} className="whitespace-nowrap">
                      {col.name}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({col.type})
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell
                        key={col.name}
                        className="max-w-xs truncate font-mono text-xs"
                      >
                        {row[col.name] == null
                          ? "NULL"
                          : String(row[col.name])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
