"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ConnectionFormProps {
  connection: { id: string; name: string } | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ConnectionForm({
  connection,
  onClose,
  onSaved,
}: ConnectionFormProps) {
  const [name, setName] = useState(connection?.name || "");
  const [connectionString, setConnectionString] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = !!connection;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = isEditing
      ? `/api/connections/${connection.id}`
      : "/api/connections";
    const method = isEditing ? "PUT" : "POST";

    const body: Record<string, string> = { name };
    if (connectionString) {
      body.connectionString = connectionString;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.ok) {
      toast.success(isEditing ? "Connection updated" : "Connection created");
      onSaved();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to save connection");
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Connection" : "Add Connection"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="connName">Connection Name</Label>
              <Input
                id="connName"
                placeholder="My SQL Server"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="connString">Connection String</Label>
              <Input
                id="connString"
                type="password"
                placeholder={
                  isEditing
                    ? "Leave empty to keep current"
                    : "Server=...;Database=...;User Id=...;Password=..."
                }
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                required={!isEditing}
              />
              <p className="text-xs text-muted-foreground">
                Example: Server=myserver.database.windows.net;Database=mydb;User
                Id=admin;Password=pass;Encrypt=true;TrustServerCertificate=true
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
