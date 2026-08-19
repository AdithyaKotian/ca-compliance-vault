"use client";

import React, { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export type EngagementRow = {
  id: string;
  firm_id: string | null;
  client_id: string;
  title: string;
  type: string;
  status: string;
  risk?: string | null;
  due_date: string | null;
  priority: string | null;
  created_at: string | null;
};

export type ClientOption = {
  id: string;
  name: string;
};

interface EngagementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementToEdit?: EngagementRow | null;
  clients: ClientOption[];
  onSuccess: () => void;
}

const FIRM_ID = "11111111-1111-1111-1111-111111111111";

export const ENGAGEMENT_TYPES = [
  "ITR Filing",
  "GST Return",
  "Audit",
  "ROC Filing",
  "TDS Return",
  "Other",
] as const;

export const ENGAGEMENT_STATUSES = [
  "Not Started",
  "In Progress",
  "Waiting for Client",
  "In Review",
  "Completed",
  "Overdue",
] as const;

export const ENGAGEMENT_PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Urgent",
] as const;

export default function EngagementFormDialog({
  open,
  onOpenChange,
  engagementToEdit,
  clients,
  onSuccess,
}: EngagementFormProps) {
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("GST Return");
  const [status, setStatus] = useState<string>("Not Started");
  const [priority, setPriority] = useState<string>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (engagementToEdit) {
      setClientId(engagementToEdit.client_id || "");
      setTitle(engagementToEdit.title || "");
      setType(engagementToEdit.type || "GST Return");
      setStatus(engagementToEdit.status || "Not Started");
      setPriority(engagementToEdit.priority || "Medium");
      setDueDate(
        engagementToEdit.due_date
          ? new Date(engagementToEdit.due_date).toISOString().split("T")[0]
          : ""
      );
    } else {
      setClientId(clients[0]?.id || "");
      setTitle("");
      setType("GST Return");
      setStatus("Not Started");
      setPriority("Medium");
      setDueDate("");
    }
  }, [engagementToEdit, clients, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Please select a client");
      return;
    }

    if (!title.trim()) {
      toast.error("Engagement title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (engagementToEdit) {
        // Update existing engagement
        const { error } = await supabase
          .from("engagements")
          .update({
            client_id: clientId,
            title: title.trim(),
            type,
            status,
            priority,
            due_date: dueDate || null,
          })
          .eq("id", engagementToEdit.id);

        if (error) {
          toast.error(error.message || "Failed to update engagement");
          return;
        }

        await supabase.from("audit_logs").insert([
          {
            firm_id: FIRM_ID,
            client_id: clientId,
            engagement_id: engagementToEdit.id,
            action: "engagement_updated",
            metadata: { title: title.trim() },
            created_by: null,
          },
        ]);

        toast.success("Engagement updated successfully");
      } else {
        // Create new engagement
        const { data: inserted, error } = await supabase
          .from("engagements")
          .insert([
            {
              firm_id: FIRM_ID,
              client_id: clientId,
              title: title.trim(),
              type,
              status,
              priority,
              risk: priority === "Urgent" ? "High" : "Low",
              due_date: dueDate || null,
            },
          ])
          .select()
          .single();

        if (error) {
          toast.error(error.message || "Failed to create engagement");
          return;
        }

        // Add standard checklist item
        await supabase.from("checklist_items").insert([
          {
            engagement_id: inserted.id,
            title: "Initial Documents & Supporting Statements",
            status: "Pending",
            required: true,
            due_date: dueDate || null,
          },
        ]);

        await supabase.from("audit_logs").insert([
          {
            firm_id: FIRM_ID,
            client_id: clientId,
            engagement_id: inserted.id,
            action: "engagement_created",
            metadata: { title: inserted.title },
            created_by: null,
          },
        ]);

        toast.success("Engagement created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {engagementToEdit ? "Edit Engagement" : "Create New Engagement"}
          </DialogTitle>
          <DialogDescription>
            {engagementToEdit
              ? "Update engagement status, deadlines, and parameters."
              : "Set up a compliance or tax filing workflow for a client."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Client *</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
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
              Engagement Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GSTR-3B Filing for Q3 / FY24 ITR-6 Audit"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENGAGEMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENGAGEMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENGAGEMENT_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : engagementToEdit ? (
                "Save Changes"
              ) : (
                "Create Engagement"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
