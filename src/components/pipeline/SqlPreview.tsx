"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import type { PipelineConfig } from "@/lib/transformations/types";
import { generatePipelineSql } from "@/lib/transformations/sql-generator";

interface SqlPreviewProps {
  config: PipelineConfig;
  sourceSchema: string;
  sourceTable: string;
}

export function SqlPreview({
  config,
  sourceSchema,
  sourceTable,
}: SqlPreviewProps) {
  const [copied, setCopied] = useState(false);

  const sql = useMemo(
    () => generatePipelineSql(config, sourceSchema, sourceTable),
    [config, sourceSchema, sourceTable]
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">SQL Preview</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-1 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="max-h-64 overflow-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
          <code>{sql}</code>
        </pre>
      </CardContent>
    </Card>
  );
}
