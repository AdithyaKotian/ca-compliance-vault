"use client"

import { useState, useMemo } from "react";
import DashboardShell from "../../components/layout/dashboard-shell";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [firmName, setFirmName] = useState("Kotian & Co.");
  const [email, setEmail] = useState("info@kottianco.in");
  const [phone, setPhone] = useState("+91-824-1234567");
  const [address, setAddress] = useState("No. 12, MG Road, Mangalore, Karnataka 575001");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [website, setWebsite] = useState("");

  const [portalName, setPortalName] = useState("CA Compliance Vault");
  const [customDomain, setCustomDomain] = useState("portal.kotianandco.in");
  const [primaryColor, setPrimaryColor] = useState("#0f172a");
  const [welcomeMessage, setWelcomeMessage] = useState("Secure document collection and compliance tracking for our clients.");

  const [emailReminders, setEmailReminders] = useState(true);
  const [whatsappTemplateEnabled, setWhatsappTemplateEnabled] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState("2");
  const [escalationDays, setEscalationDays] = useState("3");
  const [reminderMessage, setReminderMessage] = useState("Hi [Client Name], your documents for [Engagement Name] are pending. Please upload them through your CA Compliance Vault portal.");

  const templates = useMemo(() => [
    { name: "GST Monthly Filing", checkCount: 3, type: "GST" },
    { name: "GST Quarterly Filing", checkCount: 2, type: "GST" },
    { name: "ITR Individual", checkCount: 4, type: "ITR" },
    { name: "ITR Business", checkCount: 5, type: "ITR" },
    { name: "TDS Return", checkCount: 2, type: "TDS" },
    { name: "Statutory Audit Documentation", checkCount: 6, type: "Audit" },
    { name: "ROC Annual Filing", checkCount: 3, type: "ROC" },
  ], []);

  const staff = useMemo(() => [
    { name: "Adithya Kotian", role: "Admin", email: "adithya@kottianco.in" },
    { name: "Priya Sharma", role: "Senior Accountant", email: "priya@kottianco.in" },
    { name: "Rahul Rao", role: "Staff", email: "rahul@kottianco.in" },
    { name: "Neha Shetty", role: "Reviewer", email: "neha@kottianco.in" },
  ], []);

  const handleSave = () => {
    toast.success("Settings save will be connected in Supabase step.");
  };

  const handleInvite = () => {
    toast.success("Staff invitations will be connected in Supabase step.");
  };

  const handleTemplateEdit = () => {
    toast.success("Template editing will be connected in Supabase step.");
  };

  const handleDanger = (_label?: string) => {
    void _label;
    toast.error("This action will be connected in backend step.");
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="flex items-start justify-between rounded-3xl border border-slate-200 bg-white px-6 py-6">
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-slate-700" />
              <div>
                <h1 className="text-2xl font-semibold">Settings</h1>
                <p className="text-sm text-slate-600">Manage firm profile, portal branding, reminder preferences, templates, and staff access.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Firm Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Firm name</label>
                  <Input value={firmName} onChange={(e) => setFirmName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Contact email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Phone number</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Address</label>
                  <Textarea value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">GSTIN</label>
                    <Input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="GSTIN" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">PAN</label>
                    <Input value={pan} onChange={(e) => setPan(e.target.value)} placeholder="PAN" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Website</label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
                </div>

                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Upload firm logo (mock)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portal Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Portal name</label>
                  <Input value={portalName} onChange={(e) => setPortalName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Custom domain</label>
                  <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Primary color</label>
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#HEX" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Client portal welcome message</label>
                  <Textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} />
                </div>

                <div className="rounded-md border p-3">
                  <div className="font-medium">Preview</div>
                  <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="font-semibold">Kotian & Co. Client Portal</div>
                    <div className="text-sm text-slate-600">Secure document collection and compliance tracking.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reminder Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Email reminders</div>
                  <input type="checkbox" checked={emailReminders} onChange={(e) => setEmailReminders(e.target.checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">WhatsApp reminder template</div>
                  <input type="checkbox" checked={whatsappTemplateEnabled} onChange={(e) => setWhatsappTemplateEnabled(e.target.checked)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Reminder frequency</label>
                  <Select value={reminderFrequency} onValueChange={setReminderFrequency}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Every 2 days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Frequency</SelectLabel>
                        <SelectItem value="2">Every 2 days</SelectItem>
                        <SelectItem value="3">Every 3 days</SelectItem>
                        <SelectItem value="7">Weekly</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Escalate overdue documents after</label>
                  <Select value={escalationDays} onValueChange={setEscalationDays}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="3 days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Escalation</SelectLabel>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="5">5 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Default reminder message</label>
                  <Textarea value={reminderMessage} onChange={(e) => setReminderMessage(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t.name} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-sm text-slate-600">{t.checkCount} checklist items</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{t.type}</Badge>
                      <Button size="sm" variant="outline" onClick={handleTemplateEdit}>Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Staff Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff.map((s) => (
                  <div key={s.email} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-sm text-slate-600">{s.role} • {s.email}</div>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
                <div className="mt-3">
                  <Button onClick={handleInvite}>Invite Staff</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security & Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><div>Role-based access</div><div>✅</div></div>
                <div className="flex items-center justify-between"><div>Client-only portal access</div><div>✅</div></div>
                <div className="flex items-center justify-between"><div>Audit logs</div><div>✅</div></div>
                <div className="flex items-center justify-between"><div>Secure document storage</div><div>✅</div></div>
                <div className="flex items-center justify-between"><div>Payment link tracking</div><div>✅</div></div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>Export workspace data</div>
                  <Button variant="outline" onClick={() => handleDanger("export")}>Export</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-destructive">Deactivate workspace</div>
                  <Button variant="destructive" onClick={() => handleDanger("deactivate")}>Deactivate</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspace Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-slate-600">
                <div><strong>Firm:</strong> Kotian & Co.</div>
                <div><strong>Portal:</strong> CA Compliance Vault</div>
                <div><strong>Admin:</strong> Adithya Kotian</div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardShell>
  );
}
