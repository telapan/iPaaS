"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface Mapping {
  sourceValue: string;
  targetValue: string;
}

interface Crosswalk {
  id: string;
  name: string;
  mappings: Mapping[];
}

export default function CrosswalkEditorPage() {
  const params = useParams();
  const crosswalkId = params.id as string;

  const [crosswalk, setCrosswalk] = useState<Crosswalk | null>(null);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCrosswalk = useCallback(async () => {
    const res = await fetch(`/api/crosswalks/${crosswalkId}`);
    if (res.ok) {
      const data = await res.json();
      setCrosswalk(data);
      setMappings(data.mappings || []);
    }
  }, [crosswalkId]);

  useEffect(() => {
    loadCrosswalk();
  }, [loadCrosswalk]);

  function addRow() {
    setMappings((prev) => [...prev, { sourceValue: "", targetValue: "" }]);
    setIsDirty(true);
  }

  function updateMapping(
    index: number,
    field: "sourceValue" | "targetValue",
    value: string
  ) {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
    setIsDirty(true);
  }

  function removeMapping(index: number) {
    setMappings((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/crosswalks/${crosswalkId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mappings }),
    });
    setSaving(false);
    if (res.ok) {
      setIsDirty(false);
      toast.success("Crosswalk saved");
    } else {
      toast.error("Failed to save");
    }
  }

  async function handleDownloadCsv() {
    const res = await fetch(
      `/api/crosswalks/${crosswalkId}/export-csv`
    );
    if (!res.ok) {
      toast.error("Failed to download");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${crosswalk?.name || "crosswalk"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }

  async function handleUploadCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `/api/crosswalks/${crosswalkId}/import-csv`,
      { method: "POST", body: formData }
    );

    if (res.ok) {
      const data = await res.json();
      setMappings(data.mappings || []);
      setIsDirty(false);
      toast.success(
        `Loaded ${(data.mappings || []).length} mappings from CSV`
      );
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to import CSV");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const filteredMappings = search
    ? mappings
        .map((m, i) => ({ ...m, originalIndex: i }))
        .filter(
          (m) =>
            m.sourceValue.toLowerCase().includes(search.toLowerCase()) ||
            m.targetValue.toLowerCase().includes(search.toLowerCase())
        )
    : mappings.map((m, i) => ({ ...m, originalIndex: i }));

  if (!crosswalk) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <Link href="/crosswalks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Crosswalks
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{crosswalk.name}</h1>
        <Badge variant="secondary">{mappings.length} mappings</Badge>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button onClick={handleSave} disabled={!isDirty || saving} size="sm">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleUploadCsv}
        />
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
        {isDirty && (
          <Badge variant="secondary" className="ml-2">
            Unsaved changes
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle className="text-base">Mappings</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mappings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Source Value</TableHead>
                  <TableHead>Target Value</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map((m) => (
                  <TableRow key={m.originalIndex}>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.originalIndex + 1}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={m.sourceValue}
                        onChange={(e) =>
                          updateMapping(
                            m.originalIndex,
                            "sourceValue",
                            e.target.value
                          )
                        }
                        className="h-8 font-mono text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={m.targetValue}
                        onChange={(e) =>
                          updateMapping(
                            m.originalIndex,
                            "targetValue",
                            e.target.value
                          )
                        }
                        className="h-8 font-mono text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMapping(m.originalIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMappings.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {search
                        ? "No mappings match your search"
                        : "No mappings yet. Click 'Add Row' or 'Upload CSV' to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
