"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, File, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

export type ClientOption = {
  id: string;
  name: string;
};

export type EngagementOption = {
  id: string;
  client_id: string;
  title: string;
};

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientOption[];
  engagements: EngagementOption[];
  onSuccess: () => void;
}

const FIRM_ID = "11111111-1111-1111-1111-111111111111";

const ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "zip",
];

export default function DocumentUploadDialog({
  open,
  onOpenChange,
  clients,
  engagements,
  onSuccess,
}: DocumentUploadDialogProps) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedEngagementId, setSelectedEngagementId] = useState("none");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const availableEngagements = engagements.filter(
    (e) => e.client_id === selectedClientId
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (candidate: File) => {
    const ext = candidate.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(
        "Invalid file format. Allowed formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, ZIP"
      );
      return;
    }

    if (candidate.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    setFile(candidate);
    if (!title) {
      setTitle(candidate.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      toast.error("Please select a client");
      return;
    }

    if (!file) {
      toast.error("Please choose a file to upload");
      return;
    }

    setIsUploading(true);
    try {
      // Verify storage bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const documentsBucket = buckets?.find((b) => b.name === "documents");

      if (buckets && buckets.length > 0 && !documentsBucket) {
        toast.error("Storage not configured. Please create 'documents' bucket in Supabase.");
        setIsUploading(false);
        return;
      }

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `${selectedClientId}/${Date.now()}-${sanitizedName}`;

      // Upload file to Supabase storage 'documents' bucket
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        toast.error(uploadError.message || "Failed to upload file to storage");
        return;
      }

      // Record metadata in Supabase `documents` table
      const { data: docRow, error: dbError } = await supabase
        .from("documents")
        .insert([
          {
            firm_id: FIRM_ID,
            client_id: selectedClientId,
            engagement_id: selectedEngagementId === "none" ? null : selectedEngagementId,
            title: title.trim() || file.name,
            file_name: file.name,
            file_path: storagePath,
            file_type: file.type || file.name.split(".").pop() || "unknown",
            file_size: file.size,
            status: "Uploaded",
            uploaded_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (dbError) {
        toast.error(dbError.message || "Failed to store document record");
        return;
      }

      // Record audit log
      await supabase.from("audit_logs").insert([
        {
          firm_id: FIRM_ID,
          client_id: selectedClientId,
          engagement_id: selectedEngagementId === "none" ? null : selectedEngagementId,
          action: "document_uploaded",
          metadata: { document_id: docRow.id, file_name: file.name },
          created_by: null,
        },
      ]);

      toast.success("Document uploaded successfully");
      setFile(null);
      setTitle("");
      setSelectedEngagementId("none");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Securely upload compliance files, balance sheets, or tax returns.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpload} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Client *</label>
            <Select
              value={selectedClientId}
              onValueChange={(val) => {
                setSelectedClientId(val);
                setSelectedEngagementId("none");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Engagement (Optional)
            </label>
            <Select
              value={selectedEngagementId}
              onValueChange={setSelectedEngagementId}
              disabled={!selectedClientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select engagement (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General / No Specific Engagement</SelectItem>
                {availableEngagements.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Document Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. FY24 Balance Sheet & P&L Statement"
            />
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragActive
                ? "border-emerald-500 bg-emerald-50/50"
                : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            {file ? (
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 truncate">
                  <File className="h-8 w-8 text-emerald-600 shrink-0" />
                  <div className="text-left truncate">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4 text-slate-500" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud className="h-10 w-10 mx-auto text-slate-400" />
                <div className="text-sm font-medium text-slate-700">
                  Drag and drop your file here, or{" "}
                  <label
                    htmlFor="doc-file-upload"
                    className="text-emerald-600 font-semibold cursor-pointer hover:underline"
                  >
                    browse
                  </label>
                </div>
                <p className="text-xs text-slate-500">
                  Supported: PDF, JPG, PNG, DOCX, XLSX, ZIP (Max 10MB)
                </p>
                <input
                  id="doc-file-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.zip"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                "Upload Document"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
