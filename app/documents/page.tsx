"use client"

import { useMemo, useState } from "react";
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
import { ClipboardCopy, FileText, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  checklistItems,
  clients,
  documents,
  engagements,
  getClientById,
  getEngagementById,
  type ChecklistStatus,
  type DocumentStatus,
} from "../../lib/mock-data";

type StatusFilter = "All" | DocumentStatus;

const statusFilters: StatusFilter[] = ["All", "Uploaded", "Verified", "Rejected"];

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
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
  const [uploadClientId, setUploadClientId] = useState<string>(clients[0]?.id ?? "");
  const [uploadEngagementId, setUploadEngagementId] = useState<string>(
    engagements.find((eng) => eng.clientId === clients[0]?.id)?.id ?? ""
  );
  const [uploadChecklistId, setUploadChecklistId] = useState<string>(
    checklistItems.find((item) => item.engagementId === uploadEngagementId)?.id ?? ""
  );
  const [uploadNotes, setUploadNotes] = useState<string>("");

  const filteredEngagements = useMemo(
    () =>
      selectedClientId === "all"
        ? engagements
        : engagements.filter((engagement) => engagement.clientId === selectedClientId),
    [selectedClientId]
  );

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return documents.filter((document) => {
      const engagement = getEngagementById(document.engagementId);
      if (!engagement) return false;
      const client = getClientById(engagement.clientId);
      if (selectedClientId !== "all" && engagement.clientId !== selectedClientId) return false;
      if (selectedEngagementId !== "all" && document.engagementId !== selectedEngagementId) return false;
      if (statusFilter !== "All" && document.status !== statusFilter) return false;
      if (!normalizedSearch) return true;

      return [document.title, document.fileName, engagement.title, client?.name]
        .filter(Boolean)
        .some((value) => {
          const text = value ? String(value).toLowerCase() : "";
          return text.includes(normalizedSearch);
        });
    });
  }, [searchTerm, selectedClientId, selectedEngagementId, statusFilter]);

  const uploadEngagementOptions = useMemo(
    () => engagements.filter((engagement) => engagement.clientId === uploadClientId),
    [uploadClientId]
  );

  const uploadChecklistOptions = useMemo(
    () => checklistItems.filter((item) => item.engagementId === uploadEngagementId),
    [uploadEngagementId]
  );

  const missingRequests = useMemo(
    () => checklistItems.filter((item) => item.status === "Pending" || item.status === "Requested"),
    []
  );

  const clientOptions = useMemo(
    () => clients,
    []
  );

  const handleClientFilterChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedEngagementId("all");
  };

  const handleUploadClientChange = (clientId: string) => {
    setUploadClientId(clientId);
    const firstEngagement = engagements.find((engagement) => engagement.clientId === clientId);
    setUploadEngagementId(firstEngagement?.id ?? "");
    setUploadChecklistId(
      checklistItems.find((item) => item.engagementId === firstEngagement?.id)?.id ?? ""
    );
  };

  const handleUploadEngagementChange = (engagementId: string) => {
    setUploadEngagementId(engagementId);
    setUploadChecklistId(
      checklistItems.find((item) => item.engagementId === engagementId)?.id ?? ""
    );
  };

  const handlePreviewClick = () => {
    toast.success("File preview will be connected in Supabase Storage step.");
  };

  const handleUploadSubmit = () => {
    toast.success("Document upload will be connected in Supabase Storage step.");
  };

  const totalDocuments = documents.length;
  const uploadedDocuments = documents.filter((document) => document.status === "Uploaded").length;
  const verifiedDocuments = documents.filter((document) => document.status === "Verified").length;
  const rejectedDocuments = documents.filter((document) => document.status === "Rejected").length;

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
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
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
                            <SelectItem key={engagement.id} value={engagement.id}>
                              {engagement.title}
                            </SelectItem>
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
                            <SelectItem key={item.id} value={item.id}>
                              {item.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No checklist items available
                          </SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">Mock file upload area</div>
                  <p>Drag and drop a file here, or click to select a document. This is a placeholder for the Supabase storage integration.</p>
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
                  <Button className="w-full" onClick={handleUploadSubmit}>
                    Upload Document
                  </Button>
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
                <Select value={selectedClientId} onValueChange={handleClientFilterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Client</SelectLabel>
                      <SelectItem value="all">All</SelectItem>
                      {clientOptions.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
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
                        <SelectItem key={engagement.id} value={engagement.id}>
                          {engagement.title}
                        </SelectItem>
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
                    const engagement = getEngagementById(document.engagementId);
                    const client = engagement ? getClientById(engagement.clientId) : undefined;
                    const relatedChecklist = checklistItems.find(
                      (item) => item.engagementId === document.engagementId
                    );
                    return (
                      <TableRow key={document.id}>
                        <TableCell className="max-w-[14rem] truncate text-slate-900">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-500" />
                            <span className="truncate">{document.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client ? (
                            <Link href={`/clients/${client.id}`} className="font-medium text-slate-900 hover:text-primary">
                              {client.name}
                            </Link>
                          ) : (
                            "Unknown"
                          )}
                        </TableCell>
                        <TableCell>
                          {engagement ? (
                            <Link href={`/engagements/${engagement.id}`} className="text-slate-700 hover:text-slate-900">
                              {engagement.title}
                            </Link>
                          ) : (
                            "Unknown"
                          )}
                        </TableCell>
                        <TableCell>{relatedChecklist?.title ?? "—"}</TableCell>
                        <TableCell>{document.uploadedBy ?? "—"}</TableCell>
                        <TableCell>{formatDate(document.uploadedAt)}</TableCell>
                        <TableCell>
                          <Badge variant={documentStatusVariant(document.status)}>{document.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={handlePreviewClick}>
                            View File
                          </Button>
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
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No pending document requests.
              </div>
            ) : (
              missingRequests.map((item) => {
                const engagement = getEngagementById(item.engagementId);
                const client = engagement ? getClientById(engagement.clientId) : undefined;
                const reminderMessage = `Hi ${client?.name ?? "Client"}, please upload ${item.title} for ${engagement?.title ?? "your engagement"} through your CA Compliance Vault portal.`;

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
                          {item.dueDate ? (
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                              Due {formatDate(item.dueDate)}
                            </span>
                          ) : null}
                          {item.assignee ? <span>Assigned to {item.assignee}</span> : null}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <Badge variant={requestStatusVariant(item.status)}>{item.status}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await navigator.clipboard.writeText(reminderMessage);
                            toast.success("Reminder copied");
                          }}
                        >
                          <ClipboardCopy className="mr-2 h-4 w-4" />
                          Copy Reminder
                        </Button>
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
