"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "../../components/layout/dashboard-shell";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { FileText, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

type ClientRow = {
  id: string;
  firm_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  pan: string | null;
  gstin: string | null;
  address: string | null;
  risk_level: string | null;
  created_at: string | null;
};

type EngagementRow = {
  id: string;
  firm_id: string | null;
  client_id: string;
  title: string;
  type: string;
  status: string;
  risk: string | null;
  due_date: string | null;
  priority: string | null;
  created_at: string | null;
};

type ChecklistItemRow = {
  id: string;
  engagement_id: string;
  title: string;
  description: string | null;
  status: string;
  requested_at: string | null;
  due_date: string | null;
  assigned_staff: string | null;
  created_at: string | null;
};

type DocumentRow = {
  id: string;
  engagement_id: string;
  title: string | null;
  file_name: string;
  file_url: string | null;
  file_type: string | null;
  status: string;
  uploaded_by: string | null;
  uploaded_at: string | null;
  created_at: string | null;
};

type DocumentStatus = "Uploaded" | "Verified" | "Rejected";
type ChecklistStatus = "Pending" | "Requested" | "Uploaded" | "Approved" | "Rejected";

type StatusFilter = "All" | DocumentStatus;
const statusFilters: StatusFilter[] = ["All", "Uploaded", "Verified", "Rejected"];

const formatDate = (date?: string) => {
  if (!date) return "-";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const documentStatusVariant = (status: DocumentStatus) => {
  if (status === "Verified") return "secondary" as const;
  if (status === "Rejected") return "destructive" as const;
  return "outline" as const;
};

const requestStatusVariant = (status: ChecklistStatus) => {
  if (status === "Requested") return "destructive" as const;
  if (status === "Pending") return "outline" as const;
  return "secondary" as const;
};

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [selectedEngagementId, setSelectedEngagementId] = useState<string>("all");
  const [uploadClientId, setUploadClientId] = useState<string>("all");
  const [uploadEngagementId, setUploadEngagementId] = useState<string>("all");
  const [uploadChecklistId, setUploadChecklistId] = useState<string>("all");
  const [uploadNotes, setUploadNotes] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [engagements, setEngagements] = useState<EngagementRow[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const [clientsRes, engagementsRes, checklistRes, documentsRes] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("engagements").select("*"),
        supabase.from("checklist_items").select("*"),
        supabase.from("documents").select("*"),
      ]);

      const fetchError = clientsRes.error || engagementsRes.error || checklistRes.error || documentsRes.error;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setClients((clientsRes.data ?? []) as ClientRow[]);
      setEngagements((engagementsRes.data ?? []) as EngagementRow[]);
      setChecklistItems((checklistRes.data ?? []) as ChecklistItemRow[]);
      setDocuments((documentsRes.data ?? []) as DocumentRow[]);
      setLoading(false);
    };

    void load();
  }, []);

  const clientOptions = useMemo(() => clients, [clients]);

  const filteredEngagements = useMemo(
    () => (selectedClientId === "all" ? engagements : engagements.filter((engagement) => engagement.client_id === selectedClientId)),
    [engagements, selectedClientId]
  );

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return documents.filter((document) => {
      const engagement = filteredEngagements.find((eng) => eng.id === document.engagement_id) ?? engagements.find((eng) => eng.id === document.engagement_id);
      const client = engagement ? clients.find((clientRow) => clientRow.id === engagement.client_id) : undefined;
      if (selectedClientId !== "all" && engagement?.client_id !== selectedClientId) return false;
      if (selectedEngagementId !== "all" && document.engagement_id !== selectedEngagementId) return false;
      if (statusFilter !== "All" && document.status !== statusFilter) return false;
      if (!normalizedSearch) return true;
      return [document.title, document.file_name, engagement?.title, client?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [documents, engagements, filteredEngagements, clients, searchTerm, selectedClientId, selectedEngagementId, statusFilter]);

  const uploadEngagementOptions = useMemo(
    () => engagements.filter((engagement) => engagement.client_id === uploadClientId),
    [engagements, uploadClientId]
  );

  const uploadChecklistOptions = useMemo(
    () => checklistItems.filter((item) => item.engagement_id === uploadEngagementId),
    [checklistItems, uploadEngagementId]
  );

  const missingRequests = useMemo(
    () => checklistItems.filter((item) => {
      const status = item.status.toLowerCase();
      return status === "pending" || status === "requested";
    }),
    [checklistItems]
  );

  const totalDocuments = documents.length;
  const uploadedDocuments = documents.filter((document) => document.status === "Uploaded").length;
  const verifiedDocuments = documents.filter((document) => document.status === "Verified").length;
  const rejectedDocuments = documents.filter((document) => document.status === "Rejected").length;

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <header className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm shadow-slate-200/50">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
              <p className="text-sm text-slate-600">Loading document data from Supabase.</p>
            </div>
          </header>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-3xl py-24">
          <Card>
            <CardHeader>
              <CardTitle>Unable to load documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  const handleUploadClientChange = (clientId: string) => {
    setUploadClientId(clientId);
    const firstEngagement = engagements.find((engagement) => engagement.client_id === clientId);
    setUploadEngagementId(firstEngagement?.id ?? "all");
    setUploadChecklistId(
      checklistItems.find((item) => item.engagement_id === firstEngagement?.id)?.id ?? "all"
    );
  };

  const handleUploadEngagementChange = (engagementId: string) => {
    setUploadEngagementId(engagementId);
    setUploadChecklistId(
      checklistItems.find((item) => item.engagement_id === engagementId)?.id ?? "all"
    );
  };

  const handlePreviewClick = async (filePath?: string | null) => {
    if (!filePath) {
      toast.error("No file path available");
      return;
    }
    try {
      const { data, error } = await supabase.storage.from("documents").createSignedUrl(filePath, 60);
      if (error || !data) {
        toast.error("Unable to create preview link");
        return;
      }
      window.open(data.signedUrl, "_blank");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Preview error";
      toast.error(message);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }
    if (uploadClientId === "all" || uploadEngagementId === "all") {
      toast.error("Please select client and engagement");
      return;
    }

    const FIRM_ID = "11111111-1111-1111-1111-111111111111";
    try {
      const timestamp = Date.now();
      const safeName = `${timestamp}-${uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const path = `${FIRM_ID}/${uploadClientId}/${uploadEngagementId}/${uploadChecklistId ?? "uncategorized"}/${safeName}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage.from("documents").upload(path, uploadFile, { cacheControl: "3600", upsert: false });
      if (uploadErr) {
        toast.error(uploadErr.message || "Upload failed");
        return;
      }

      // Insert document row
      const { data: docRow, error: docErr } = await supabase.from("documents").insert([{ firm_id: FIRM_ID, client_id: uploadClientId, engagement_id: uploadEngagementId, checklist_item_id: uploadChecklistId === "all" ? null : uploadChecklistId, file_name: uploadFile.name, file_url: uploadData.path, file_type: uploadFile.type || null, status: "Uploaded", uploaded_by: null }]).select().single();
      if (docErr) {
        toast.error(docErr.message || "Failed to save document record");
        return;
      }

      // If checklist item provided, mark it uploaded
      if (uploadChecklistId && uploadChecklistId !== "all") {
        await supabase.from("checklist_items").update({ status: "Uploaded" }).eq("id", uploadChecklistId);
      }

      // Audit log
      await supabase.from("audit_logs").insert([{ firm_id: FIRM_ID, client_id: uploadClientId, engagement_id: uploadEngagementId, action: "document_uploaded", metadata: { file: docRow.id }, created_by: null }]);

      // Refresh lists
      const { data: refreshedDocs } = await supabase.from("documents").select("*");
      setDocuments((refreshedDocs ?? []) as DocumentRow[]);

      const { data: refreshedChecklist } = await supabase.from("checklist_items").select("*");
      setChecklistItems((refreshedChecklist ?? []) as ChecklistItemRow[]);

      setUploadFile(null);
      setUploadNotes("");
      toast.success("Document uploaded");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload error";
      toast.error(message);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm shadow-slate-200/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Documents</div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Documents</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Track uploaded files, missing records, and review status across every client engagement.
              </p>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="inline-flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Choose client, engagement, checklist item and add a note for the document upload request.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Client</label>
                    <Select value={uploadClientId} onValueChange={handleUploadClientChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Client</SelectLabel>
                          {clientOptions.map((client) => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Engagement</label>
                    <Select value={uploadEngagementId} onValueChange={handleUploadEngagementChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select engagement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Engagement</SelectLabel>
                          {uploadEngagementOptions.map((engagement) => (
                            <SelectItem key={engagement.id} value={engagement.id}>{engagement.title}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Checklist Item</label>
                  <Select value={uploadChecklistId} onValueChange={setUploadChecklistId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select checklist item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Checklist</SelectLabel>
                        {uploadChecklistOptions.length > 0 ? (
                          uploadChecklistOptions.map((item) => (
                            <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="all" disabled>No checklist items available</SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">Choose a file to upload</div>
                  <p>Files are uploaded to the Supabase `documents` bucket.</p>
                  <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Notes</label>
                  <Textarea
                    value={uploadNotes}
                    onChange={(event) => setUploadNotes(event.target.value)}
                    placeholder="Add any context for the document upload request"
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button className="w-full" onClick={handleUploadSubmit}>Upload Document</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{totalDocuments}</p>
              <CardDescription>All uploaded files across every engagement.</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{uploadedDocuments}</p>
              <CardDescription>Files waiting for review or verification.</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Verified Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{verifiedDocuments}</p>
              <CardDescription>Files already validated by the CA team.</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rejected Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{rejectedDocuments}</p>
              <CardDescription>Files that need resubmission or correction.</CardDescription>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_auto]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-2xl bg-slate-100 p-2 text-slate-500">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search documents, clients, engagements..."
                  className="min-w-0"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
              {statusFilters.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Client</label>
                <Select value={selectedClientId} onValueChange={(value) => { setSelectedClientId(value); setSelectedEngagementId("all"); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Client</SelectLabel>
                      <SelectItem value="all">All</SelectItem>
                      {clientOptions.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Engagement</label>
                <Select value={selectedEngagementId} onValueChange={setSelectedEngagementId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All engagements" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Engagement</SelectLabel>
                      <SelectItem value="all">All</SelectItem>
                      {filteredEngagements.map((engagement) => (
                        <SelectItem key={engagement.id} value={engagement.id}>{engagement.title}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
          <CardHeader className="px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>Document Library</CardTitle>
                <CardDescription>Review uploaded files, client context, and current review status.</CardDescription>
              </div>
              <div className="text-sm text-slate-500">{filteredDocuments.length} results</div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            {filteredDocuments.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No documents found.</div>
            ) : (
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Checklist Item</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Uploaded Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => {
                    const engagement = engagements.find((eng) => eng.id === document.engagement_id);
                    const client = engagement ? clients.find((clientRow) => clientRow.id === engagement.client_id) : undefined;
                    const relatedChecklist = checklistItems.find((item) => item.engagement_id === document.engagement_id);
                    return (
                      <TableRow key={document.id}>
                        <TableCell className="max-w-[14rem] truncate text-slate-900">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-500" />
                            <span className="truncate">{document.file_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client ? (
                            <Link href={`/clients/${client.id}`} className="font-medium text-slate-900 hover:text-primary">{client.name}</Link>
                          ) : (
                            "Unknown"
                          )}
                        </TableCell>
                        <TableCell>
                          {engagement ? (
                            <Link href={`/engagements/${engagement.id}`} className="text-slate-700 hover:text-slate-900">{engagement.title}</Link>
                          ) : (
                            "Unknown"
                          )}
                        </TableCell>
                        <TableCell>{relatedChecklist?.title ?? "—"}</TableCell>
                        <TableCell>{document.uploaded_by ?? "—"}</TableCell>
                        <TableCell>{formatDate(document.uploaded_at ?? undefined)}</TableCell>
                        <TableCell><Badge variant={documentStatusVariant(document.status as DocumentStatus)}>{document.status}</Badge></TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handlePreviewClick(document.file_url ?? undefined)}>View File</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Missing Document Requests</h2>
              <p className="text-sm text-slate-600">Checklist items awaiting files from clients and updated follow-up reminders.</p>
            </div>
            <Badge variant="outline">{missingRequests.length} pending</Badge>
          </div>

          <div className="mt-6 space-y-4">
            {missingRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No pending document requests.</div>
            ) : (
              missingRequests.map((item) => {
                const engagement = engagements.find((engagementRow) => engagementRow.id === item.engagement_id);
                const client = engagement ? clients.find((clientRow) => clientRow.id === engagement.client_id) : undefined;
                return (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span>{client?.name ?? "Unknown client"}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span>{engagement?.title ?? "Unknown engagement"}</span>
                        </div>
                        <div className="text-base font-medium text-slate-900">{item.title}</div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          {item.due_date ? (
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">Due {formatDate(item.due_date ?? undefined)}</span>
                          ) : null}
                          {item.assigned_staff ? <span>Assigned to {item.assigned_staff}</span> : null}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <Badge variant={requestStatusVariant(item.status as ChecklistStatus)}>{item.status}</Badge>
                        <Button variant="outline" size="sm" onClick={() => toast.success("Document request reminder copied")}>Copy Reminder</Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
