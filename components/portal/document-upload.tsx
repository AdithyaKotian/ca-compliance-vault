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
import { UploadCloud, File, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

interface PortalDocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  engagementId?: string | null;
  checklistItemId?: string | null;
  checklistItemTitle?: string | null;
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

export default function PortalDocumentUpload({
  open,
  onOpenChange,
  clientId,
  engagementId,
  checklistItemId,
  checklistItemTitle,
  onSuccess,
}: PortalDocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(checklistItemTitle || "");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
      toast.error("Allowed formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, ZIP");
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Client identity not verified");
      return;
    }

    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `${clientId}/${Date.now()}-${sanitizedName}`;

      // Upload file into Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        toast.error(uploadError.message || "Failed to upload document to vault");
        return;
      }

      // Record in Supabase documents table
      const { data: docRow, error: dbError } = await supabase
        .from("documents")
        .insert([
          {
            firm_id: FIRM_ID,
            client_id: clientId,
            engagement_id: engagementId || null,
            title: title.trim() || checklistItemTitle || file.name,
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
        toast.error(dbError.message || "Failed to save document record");
        return;
      }

      // If tied to a checklist item, mark it as Uploaded
      if (checklistItemId) {
        await supabase
          .from("checklist_items")
          .update({ status: "Uploaded" })
          .eq("id", checklistItemId);
      }

      // Record audit log
      await supabase.from("audit_logs").insert([
        {
          firm_id: FIRM_ID,
          client_id: clientId,
          engagement_id: engagementId || null,
          action: "client_document_uploaded",
          metadata: {
            document_id: docRow.id,
            checklist_item_id: checklistItemId || null,
            file_name: file.name,
          },
          created_by: null,
        },
      ]);

      toast.success("Document uploaded successfully to CA vault");
      setFile(null);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            {checklistItemTitle
              ? `Upload requested file for: "${checklistItemTitle}"`
              : "Upload compliance documents or receipts to your CA firm."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpload} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Document Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bank Statement / Form 16"
            />
          </div>

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
                  <File className="h-7 w-7 text-emerald-600 shrink-0" />
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
                  className="h-7 w-7 p-0"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4 text-slate-500" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud className="h-10 w-10 mx-auto text-slate-400" />
                <div className="text-sm font-medium text-slate-700">
                  Drag and drop file here, or{" "}
                  <label
                    htmlFor="portal-file-input"
                    className="text-emerald-600 font-semibold cursor-pointer hover:underline"
                  >
                    browse
                  </label>
                </div>
                <p className="text-xs text-slate-500">PDF, JPG, PNG, DOCX, XLSX (Max 10MB)</p>
                <input
                  id="portal-file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.zip"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      validateAndSetFile(e.target.files[0]);
                    }
                  }}
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
                "Upload File"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
