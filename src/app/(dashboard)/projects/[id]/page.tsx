"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { PipelineBuilder } from "@/components/pipeline/PipelineBuilder";
import type { PipelineConfig } from "@/lib/transformations/types";

interface Connection {
  id: string;
  name: string;
}

interface Pipeline {
  id: string;
  name: string;
  sourceTable: string;
  sourceSchema: string;
  connectionId: string;
  config: PipelineConfig;
  connection: Connection;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  pipelines: Pipeline[];
}

interface TableInfo {
  schema: string;
  name: string;
  rowCount: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [crosswalks, setCrosswalks] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(
    null
  );
  const [showCreatePipeline, setShowCreatePipeline] = useState(false);

  // Create pipeline form state
  const [pipelineName, setPipelineName] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("dbo");
  const [loadingTables, setLoadingTables] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    if (res.ok) setProject(await res.json());
  }, [projectId]);

  useEffect(() => {
    loadProject();
    fetch("/api/connections")
      .then((r) => r.json())
      .then(setConnections);
    fetch("/api/crosswalks")
      .then((r) => r.json())
      .then(setCrosswalks);
  }, [loadProject]);

  async function handleConnectionChange(connId: string) {
    setSelectedConnectionId(connId);
    setSelectedTable("");
    setLoadingTables(true);
    const res = await fetch(`/api/connections/${connId}/tables`);
    if (res.ok) {
      setTables(await res.json());
    }
    setLoadingTables(false);
  }

  async function handleCreatePipeline(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const res = await fetch("/api/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        connectionId: selectedConnectionId,
        sourceTable: selectedTable,
        sourceSchema: selectedSchema,
        name: pipelineName,
      }),
    });

    setCreating(false);

    if (res.ok) {
      toast.success("Pipeline created");
      setShowCreatePipeline(false);
      setPipelineName("");
      setSelectedConnectionId("");
      setSelectedTable("");
      loadProject();
    } else {
      toast.error("Failed to create pipeline");
    }
  }

  async function handleDeletePipeline(pipelineId: string) {
    if (!confirm("Delete this pipeline?")) return;
    const res = await fetch(`/api/pipelines/${pipelineId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Pipeline deleted");
      if (selectedPipeline?.id === pipelineId) {
        setSelectedPipeline(null);
      }
      loadProject();
    }
  }

  if (!project) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  if (selectedPipeline) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedPipeline(null)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
          <h1 className="text-xl font-bold">{selectedPipeline.name}</h1>
          <Badge variant="secondary">
            {selectedPipeline.connection.name} / {selectedPipeline.sourceSchema}
            .{selectedPipeline.sourceTable}
          </Badge>
        </div>
        <PipelineBuilder
          pipelineId={selectedPipeline.id}
          initialConfig={selectedPipeline.config}
          connectionId={selectedPipeline.connectionId}
          sourceTable={selectedPipeline.sourceTable}
          sourceSchema={selectedPipeline.sourceSchema}
          connections={connections}
          crosswalks={crosswalks}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Projects
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pipelines</h2>
        <Button onClick={() => setShowCreatePipeline(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Pipeline
        </Button>
      </div>

      {project.pipelines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pipelines yet. Create one to start transforming data.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {project.pipelines.map((pipeline) => (
            <Card
              key={pipeline.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setSelectedPipeline(pipeline)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{pipeline.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePipeline(pipeline.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Connection: {pipeline.connection.name}</p>
                  <p>
                    Table: {pipeline.sourceSchema}.{pipeline.sourceTable}
                  </p>
                  <Badge variant="outline">
                    {(pipeline.config as PipelineConfig).steps?.length || 0}{" "}
                    steps
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreatePipeline} onOpenChange={setShowCreatePipeline}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Pipeline</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePipeline}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Pipeline Name</Label>
                <Input
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  placeholder="My Transformation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Connection</Label>
                <Select
                  value={selectedConnectionId}
                  onValueChange={handleConnectionChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a connection" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id}>
                        {conn.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedConnectionId && (
                <div className="space-y-2">
                  <Label>
                    Source Table{" "}
                    {loadingTables && (
                      <span className="text-muted-foreground">
                        (loading...)
                      </span>
                    )}
                  </Label>
                  <Select
                    value={
                      selectedTable
                        ? `${selectedSchema}.${selectedTable}`
                        : ""
                    }
                    onValueChange={(v) => {
                      const [s, t] = v.split(".");
                      setSelectedSchema(s);
                      setSelectedTable(t);
                    }}
                    disabled={loadingTables}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((t) => (
                        <SelectItem
                          key={`${t.schema}.${t.name}`}
                          value={`${t.schema}.${t.name}`}
                        >
                          {t.schema}.{t.name} ({t.rowCount.toLocaleString()}{" "}
                          rows)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreatePipeline(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  creating || !selectedConnectionId || !selectedTable
                }
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
