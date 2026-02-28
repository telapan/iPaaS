"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

interface ExportRecord {
  id: string;
  exportedAt: string;
  rowCount: number;
  status: string;
  errorMsg: string | null;
  pipeline: {
    name: string;
    sourceTable: string;
    sourceSchema: string;
    project: { name: string };
  };
}

export default function ExportsPage() {
  const [exports, setExports] = useState<ExportRecord[]>([]);

  useEffect(() => {
    fetch("/api/exports")
      .then((r) => r.json())
      .then(setExports);
  }, []);

  function getStatusBadge(status: string) {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "partial":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Export History</h1>

      {exports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Download className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No exports yet. Export a pipeline to see history here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Pipeline</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(exp.exportedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{exp.pipeline.project.name}</TableCell>
                    <TableCell className="font-medium">
                      {exp.pipeline.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {exp.pipeline.sourceSchema}.{exp.pipeline.sourceTable}
                    </TableCell>
                    <TableCell>
                      {exp.rowCount.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(exp.status)}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-red-600">
                      {exp.errorMsg}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
