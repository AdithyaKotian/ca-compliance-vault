"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Upload,
  Download,
  Trash2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import DocumentUploadDialog, {
  ClientOption,
  EngagementOption,
} from "@/components/documents/upload-dialog";

export type DocumentRow = {
  id: string;
  firm_id?: string | null;
  client_id: string;
  engagement_id?: string | null;
  title: string | null;
  file_name: string;
  file_path?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  status: "Pending" | "Uploaded" | "Verified" | "Rejected" | string;
  uploaded_by?: string | null;
  uploaded_at?: string | null;
  created_at?: string | null;
};

const FIRM_ID = "11111111-1111-1111-1111-111111111111";

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "verified" || s === "approved") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1">
        <CheckCircle2 className="h-3 w-3" /> Verified
      </Badge>
    );
  }
  if (s === "rejected") {
    return (
      <Badge className="bg-red-50 text-red-700 border-red-200 text-xs gap-1">
        <XCircle className="h-3 w-3" /> Rejected
      </Badge>
    );
  }
  if (s === "uploaded") {
    return (
      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs gap-1">
        <Upload className="h-3 w-3" /> Uploaded
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs gap-1">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [engagements, setEngagements] = useState<EngagementOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");

  // Dialogs & Actions
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<DocumentRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [docsRes, clientsRes, engRes] = await Promise.all([
        supabase.from("documents").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("id, name").order("name", { ascending: true }),
        supabase.from("engagements").select("id, client_id, title"),
      ]);

      if (docsRes.error) throw docsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (engRes.error) throw engRes.error;

      setDocuments(docsRes.data ?? []);
      setClients(clientsRes.data ?? []);
      setEngagements(engRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clients]);

  const engagementMap = useMemo(() => {
    const map = new Map<string, string>();
    engagements.forEach((e) => map.set(e.id, e.title));
    return map;
  }, [engagements]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return documents.filter((doc) => {
      if (statusFilter !== "All" && doc.status !== statusFilter) return false;
      if (clientFilter !== "All" && doc.client_id !== clientFilter) return false;

      if (q) {
        const clientName = clientMap.get(doc.client_id) || "";
        const engTitle = doc.engagement_id ? engagementMap.get(doc.engagement_id) || "" : "";
        const matchTitle = (doc.title || "").toLowerCase().includes(q);
        const matchFile = doc.file_name.toLowerCase().includes(q);
        const matchClient = clientName.toLowerCase().includes(q);
        const matchEng = engTitle.toLowerCase().includes(q);

        if (!matchTitle && !matchFile && !matchClient && !matchEng) return false;
      }

      return true;
    });
  }, [documents, searchQuery, statusFilter, clientFilter, clientMap, engagementMap]);

  // Document Metrics
  const totalDocs = documents.length;
  const verifiedDocs = documents.filter(
    (d) => d.status.toLowerCase() === "verified" || d.status.toLowerCase() === "approved"
  ).length;
  const pendingDocs = documents.filter(
    (d) => d.status.toLowerCase() === "pending" || d.status.toLowerCase() === "uploaded"
  ).length;
  const rejectedDocs = documents.filter((d) => d.status.toLowerCase() === "rejected").length;

  const handleDownload = async (doc: DocumentRow) => {
    const filePath = doc.file_path || doc.file_url;
    if (!filePath) {
      toast.error("Document path is missing");
      return;
    }

    setDownloadingId(doc.id);
    try {
      // Generate secure signed URL with 60-second expiry
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 60);

      if (error || !data?.signedUrl) {
        toast.error(error?.message || "Failed to generate download link");
        return;
      }

      // Open download URL
      window.open(data.signedUrl, "_blank");
      toast.success("Download started (Link valid for 60s)");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download error");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStatusChange = async (doc: DocumentRow, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({ status: newStatus })
        .eq("id", doc.id);

      if (error) {
        toast.error(error.message || "Failed to update status");
        return;
      }

      await supabase.from("audit_logs").insert([
        {
          firm_id: FIRM_ID,
          client_id: doc.client_id,
          engagement_id: doc.engagement_id || null,
          action: "document_status_updated",
          metadata: { document_id: doc.id, new_status: newStatus },
          created_by: null,
        },
      ]);

      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, status: newStatus } : d))
      );
      toast.success(`Document marked as ${newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status change error");
    }
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;

    setIsDeleting(true);
    try {
      const filePath = deletingDoc.file_path || deletingDoc.file_url;

      // Delete from storage if path exists
      if (filePath) {
        await supabase.storage.from("documents").remove([filePath]);
      }

      // Delete from Supabase DB
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", deletingDoc.id);

      if (error) {
        toast.error(error.message || "Failed to delete document record");
        return;
      }

      await supabase.from("audit_logs").insert([
        {
          firm_id: FIRM_ID,
          client_id: deletingDoc.client_id,
          engagement_id: deletingDoc.engagement_id || null,
          action: "document_deleted",
          metadata: { document_id: deletingDoc.id, file_name: deletingDoc.file_name },
          created_by: null,
        },
      ]);

      await loadData();
      setDeleteOpen(false);
      setDeletingDoc(null);
      toast.success("Document deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Documents Vault</h1>
              <p className="text-sm text-slate-500">Loading stored documents...</p>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 w-28 rounded bg-slate-200" />
                </CardHeader>
                <CardContent>
                  <div className="h-7 w-20 rounded bg-slate-200" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-2xl py-16 text-center">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Unable to load documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-red-600">{error}</p>
              <Button onClick={() => void loadData()} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Documents Vault
            </h1>
            <p className="text-sm text-slate-500">
              Collect, verify, and securely store client tax files and compliance records.
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </header>

        {/* Stats Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Files Stored
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalDocs}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Verified &amp; Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{verifiedDocs}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{pendingDocs}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Rejected / Needs Reupload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedDocs}</div>
            </CardContent>
          </Card>
        </section>

        {/* Filters & Search */}
        <section className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search file name, client, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Uploaded">Uploaded</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Clients</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Documents Table */}
          <Card className="border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">File Name &amp; Title</TableHead>
                      <TableHead className="font-semibold text-slate-700">Client</TableHead>
                      <TableHead className="font-semibold text-slate-700">Engagement</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Size</TableHead>
                      <TableHead className="font-semibold text-slate-700">Uploaded</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-12 text-slate-500 text-sm"
                        >
                          No documents found matching your filter criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((doc) => {
                        const clientName = clientMap.get(doc.client_id) || "Unknown Client";
                        const engTitle = doc.engagement_id
                          ? engagementMap.get(doc.engagement_id) || "General"
                          : "General";
                        const isDownloading = downloadingId === doc.id;

                        return (
                          <TableRow key={doc.id} className="hover:bg-slate-50/80">
                            <TableCell>
                              <div className="flex items-start gap-2.5">
                                <FileText className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
                                <div>
                                  <div className="font-semibold text-slate-900 leading-snug">
                                    {doc.title || doc.file_name}
                                  </div>
                                  <div className="text-xs text-slate-500 font-mono">
                                    {doc.file_name}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium text-slate-800">
                                {clientName}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-600">
                                {engTitle}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={doc.status}
                                onValueChange={(val) => handleStatusChange(doc, val)}
                              >
                                <SelectTrigger className="h-7 w-32 text-xs border-0 bg-transparent p-0 shadow-none">
                                  <div>{getStatusBadge(doc.status)}</div>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Uploaded">Uploaded</SelectItem>
                                  <SelectItem value="Verified">Verified</SelectItem>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-600">
                                {formatFileSize(doc.file_size)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-600">
                                {formatDate(doc.uploaded_at || doc.created_at)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-slate-100"
                                  onClick={() => handleDownload(doc)}
                                  disabled={isDownloading}
                                  title="Download File (Signed URL)"
                                >
                                  {isDownloading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                                  ) : (
                                    <Download className="h-4 w-4 text-slate-600" />
                                  )}
                                  <span className="sr-only">Download</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => {
                                    setDeletingDoc(doc);
                                    setDeleteOpen(true);
                                  }}
                                  title="Delete Document"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Upload Dialog */}
        <DocumentUploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          clients={clients}
          engagements={engagements}
          onSuccess={() => void loadData()}
        />

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-slate-900">
                  {deletingDoc?.file_name}
                </span>
                ? This will remove the file from secure cloud storage and clear its metadata record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  "Delete Document"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardShell>
  );
}
