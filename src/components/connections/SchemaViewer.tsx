"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";

interface TableInfo {
  schema: string;
  name: string;
  rowCount: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  maxLength: number;
}

interface SchemaViewerProps {
  connectionId: string;
  onClose: () => void;
}

export function SchemaViewer({ connectionId, onClose }: SchemaViewerProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<Record<string, ColumnInfo[]>>({});
  const [previewData, setPreviewData] = useState<{
    table: string;
    rows: Record<string, unknown>[];
    columns: ColumnInfo[];
    totalCount: number;
    offset: number;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    async function loadTables() {
      const res = await fetch(`/api/connections/${connectionId}/tables`);
      if (res.ok) {
        setTables(await res.json());
      }
      setLoading(false);
    }
    loadTables();
  }, [connectionId]);

  async function toggleTable(tableName: string, schema: string) {
    const key = `${schema}.${tableName}`;
    if (expandedTable === key) {
      setExpandedTable(null);
      return;
    }
    setExpandedTable(key);

    if (!columns[key]) {
      const res = await fetch(
        `/api/connections/${connectionId}/tables/${tableName}?schema=${schema}&limit=0`
      );
      if (res.ok) {
        const data = await res.json();
        setColumns((prev) => ({ ...prev, [key]: data.columns }));
      }
    }
  }

  async function loadPreview(tableName: string, schema: string, offset = 0) {
    setLoadingPreview(true);
    const res = await fetch(
      `/api/connections/${connectionId}/tables/${tableName}?schema=${schema}&offset=${offset}&limit=50`
    );
    if (res.ok) {
      const data = await res.json();
      setPreviewData({
        table: `${schema}.${tableName}`,
        rows: data.rows,
        columns: data.columns,
        totalCount: data.totalCount,
        offset,
      });
    }
    setLoadingPreview(false);
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-[800px] max-w-full overflow-y-auto sm:max-w-[800px]">
        <SheetHeader>
          <SheetTitle>Database Schema</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : tables.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No tables found
            </p>
          ) : (
            tables.map((table) => {
              const key = `${table.schema}.${table.name}`;
              const isExpanded = expandedTable === key;
              return (
                <div key={key} className="rounded-md border">
                  <button
                    onClick={() => toggleTable(table.name, table.schema)}
                    className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {table.schema}.{table.name}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {table.rowCount.toLocaleString()} rows
                    </Badge>
                  </button>
                  {isExpanded && columns[key] && (
                    <div className="border-t p-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Column</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Nullable</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {columns[key].map((col) => (
                            <TableRow key={col.name}>
                              <TableCell className="font-mono text-sm">
                                {col.name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{col.type}</Badge>
                              </TableCell>
                              <TableCell>
                                {col.nullable ? "Yes" : "No"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => loadPreview(table.name, table.schema)}
                        disabled={loadingPreview}
                      >
                        {loadingPreview ? "Loading..." : "Preview Data"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {previewData && (
            <div className="mt-4 rounded-md border p-4">
              <h3 className="mb-2 font-semibold">
                Preview: {previewData.table}
              </h3>
              <p className="mb-2 text-sm text-muted-foreground">
                Showing {previewData.offset + 1}-
                {Math.min(
                  previewData.offset + previewData.rows.length,
                  previewData.totalCount
                )}{" "}
                of {previewData.totalCount.toLocaleString()} rows
              </p>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewData.columns.map((col) => (
                        <TableHead key={col.name}>{col.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.rows.map((row, i) => (
                      <TableRow key={i}>
                        {previewData.columns.map((col) => (
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
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={previewData.offset === 0}
                  onClick={() => {
                    const parts = previewData.table.split(".");
                    loadPreview(
                      parts[1],
                      parts[0],
                      previewData.offset - 50
                    );
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    previewData.offset + previewData.rows.length >=
                    previewData.totalCount
                  }
                  onClick={() => {
                    const parts = previewData.table.split(".");
                    loadPreview(
                      parts[1],
                      parts[0],
                      previewData.offset + 50
                    );
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
