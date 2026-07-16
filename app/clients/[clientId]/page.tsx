"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardShell from "../../../components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type ClientRow = {
  id: string;
  firm_id: string | null;
  name: string;
  type: "individual" | "business" | string | null;
  email: string | null;
  phone: string | null;
  pan: string | null;
  gstin: string | null;
  address: string | null;
  risk_level: "low" | "medium" | "high" | string | null;
  created_at: string | null;
};

type ContactRow = {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  created_at: string | null;
};

type EngagementRow = {
  id: string;
  firm_id: string | null;
  client_id: string;
  title: string;
  type: string;
  status: string;
  due_date: string | null;
  priority: string | null;
  created_at: string | null;
};

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  
  const [client, setClient] = useState<ClientRow | null>(null);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [engagements, setEngagements] = useState<EngagementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [clientRes, contactsRes, engagementsRes] = await Promise.all([
          supabase.from("clients").select("*").eq("id", clientId).single(),
          supabase.from("contacts").select("*").eq("client_id", clientId),
          supabase.from("engagements").select("*").eq("client_id", clientId),
        ]);

        if (clientRes.error) throw clientRes.error;
        if (contactsRes.error) throw contactsRes.error;
        if (engagementsRes.error) throw engagementsRes.error;

        setClient(clientRes.data);
        setContacts(contactsRes.data ?? []);
        setEngagements(engagementsRes.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load client details");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [clientId]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="h-8 w-48 rounded bg-slate-200 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 w-32 rounded bg-slate-200 animate-pulse mb-2" />
                  <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error || !client) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-3xl py-24">
          <Card>
            <CardHeader>
              <CardTitle>Client not found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">{error ?? "This client does not exist or has been removed."}</p>
              <Link href="/clients">
                <Button variant="outline" className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Clients
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  const primaryContact = contacts[0];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">{client.name}</h1>
              <p className="text-sm text-slate-600">
                {client.type ? client.type.charAt(0).toUpperCase() + client.type.slice(1) : "N/A"} • Client since {client.created_at ? new Date(client.created_at).toLocaleDateString("en-IN") : "N/A"}
              </p>
            </div>
          </div>
          <Badge 
            variant={
              client.risk_level === "high" ? "destructive" : 
              client.risk_level === "medium" ? "secondary" : 
              "default"
            }
            className="text-sm px-4 py-2"
          >
            {client.risk_level ? client.risk_level.charAt(0).toUpperCase() + client.risk_level.slice(1) : "Low"} Risk
          </Badge>
        </div>

        {/* Client Details & Contact */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span className="text-sm">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                  <span className="text-sm">{client.address}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase">PAN</div>
                  <div className="text-sm mt-1">{client.pan ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase">GSTIN</div>
                  <div className="text-sm mt-1">{client.gstin ?? "—"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Primary Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {primaryContact ? (
                <>
                  <div>
                    <div className="text-sm font-medium">{primaryContact.name}</div>
                    {primaryContact.designation && (
                      <div className="text-sm text-slate-500">{primaryContact.designation}</div>
                    )}
                  </div>
                  {primaryContact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-sm">{primaryContact.email}</span>
                    </div>
                  )}
                  {primaryContact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span className="text-sm">{primaryContact.phone}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">No contact person added yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Engagements */}
        <Card>
          <CardHeader>
            <CardTitle>Active Engagements</CardTitle>
          </CardHeader>
          <CardContent>
            {engagements.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">No engagements yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {engagements.map((engagement) => (
                  <div key={engagement.id} className="flex items-center justify-between rounded-md border px-4 py-3">
                    <div>
                      <div className="font-medium">{engagement.title}</div>
                      <div className="text-sm text-slate-600">
                        {engagement.type} • Due {engagement.due_date ? new Date(engagement.due_date).toLocaleDateString("en-IN") : "—"}
                      </div>
                    </div>
                    <Badge variant={engagement.status === "Overdue" ? "destructive" : "secondary"}>
                      {engagement.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}