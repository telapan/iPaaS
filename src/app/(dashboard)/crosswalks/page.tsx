"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

interface Crosswalk {
  id: string;
  name: string;
  mappings: { sourceValue: string; targetValue: string }[];
  createdAt: string;
  updatedAt: string;
}

export default function CrosswalksPage() {
  const [crosswalks, setCrosswalks] = useState<Crosswalk[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCrosswalks = useCallback(async () => {
    const res = await fetch("/api/crosswalks");
    if (res.ok) setCrosswalks(await res.json());
  }, []);

  useEffect(() => {
    loadCrosswalks();
  }, [loadCrosswalks]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/crosswalks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Crosswalk created");
      setShowForm(false);
      setName("");
      loadCrosswalks();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this crosswalk?")) return;
    const res = await fetch(`/api/crosswalks/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Crosswalk deleted");
      loadCrosswalks();
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Crosswalks</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Crosswalk
        </Button>
      </div>

      {crosswalks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ArrowLeftRight className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No crosswalks yet. Create one to map values from one format to
              another.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Value Mapping Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mappings</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crosswalks.map((cw) => (
                  <TableRow key={cw.id}>
                    <TableCell>
                      <Link
                        href={`/crosswalks/${cw.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {cw.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {cw.mappings.length} mappings
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(cw.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cw.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Crosswalk</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="py-4">
              <Label>Crosswalk Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="State Code to Name"
                required
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
