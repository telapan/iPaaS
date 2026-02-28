"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, Pencil, TestTube, Eye } from "lucide-react";
import { ConnectionForm } from "@/components/connections/ConnectionForm";
import { SchemaViewer } from "@/components/connections/SchemaViewer";
import { toast } from "sonner";

interface Connection {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(
    null
  );
  const [viewingSchema, setViewingSchema] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    const res = await fetch("/api/connections");
    if (res.ok) {
      setConnections(await res.json());
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this connection?")) return;
    const res = await fetch(`/api/connections/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Connection deleted");
      loadConnections();
    } else {
      toast.error("Failed to delete connection");
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    const res = await fetch(`/api/connections/${id}/test`, { method: "POST" });
    const result = await res.json();
    setTestingId(null);
    if (result.success) {
      toast.success("Connection successful!");
    } else {
      toast.error(`Connection failed: ${result.error}`);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Connections</h1>
        <Button
          onClick={() => {
            setEditingConnection(null);
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SQL Server Connections</CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No connections yet. Add your first SQL Server connection to get
              started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((conn) => (
                  <TableRow key={conn.id}>
                    <TableCell className="font-medium">{conn.name}</TableCell>
                    <TableCell>
                      {new Date(conn.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(conn.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(conn.id)}
                          disabled={testingId === conn.id}
                        >
                          <TestTube className="mr-1 h-4 w-4" />
                          {testingId === conn.id ? "Testing..." : "Test"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingSchema(conn.id)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Browse
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingConnection(conn);
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(conn.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <ConnectionForm
          connection={editingConnection}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadConnections();
          }}
        />
      )}

      {viewingSchema && (
        <SchemaViewer
          connectionId={viewingSchema}
          onClose={() => setViewingSchema(null)}
        />
      )}
    </div>
  );
}
