// Mock data for CA Compliance Vault
// Single-file dataset with types, realistic Indian mock data, and helper functions.

type ID = string;

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type EngagementStatus =
  | 'Draft'
  | 'Active'
  | 'Waiting for Client'
  | 'In Review'
  | 'Filed'
  | 'Completed'
  | 'Overdue';

export type ChecklistStatus = 'Pending' | 'Requested' | 'Uploaded' | 'Approved' | 'Rejected';

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

export type DocumentStatus = 'Uploaded' | 'Verified' | 'Rejected';

export interface Firm {
  id: ID;
  name: string;
  address: string;
  gstin?: string;
  phone?: string;
  email?: string;
}

export interface Client {
  id: ID;
  name: string;
  type: 'Proprietorship' | 'Private Limited' | 'Partnership' | 'LLP' | 'Public';
  pan?: string;
  gstin?: string | null;
  primaryContactId?: ID;
  address?: string;
}

export interface Contact {
  id: ID;
  clientId: ID;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
}

export interface Engagement {
  id: ID;
  clientId: ID;
  title: string;
  type?: string;
  status: EngagementStatus;
  risk: RiskLevel;
  assignedTo: string;
  startDate: string; // ISO
  dueDate: string; // ISO
  createdAt: string;
  notes?: ID[]; // note ids
}

export interface ChecklistItem {
  id: ID;
  engagementId: ID;
  title: string;
  status: ChecklistStatus;
  assignee?: string;
  dueDate?: string;
  requestedAt?: string;
}

export interface Document {
  id: ID;
  engagementId: ID;
  title: string;
  fileName: string;
  uploadedBy?: string;
  uploadedAt?: string;
  status: DocumentStatus;
  sizeKb?: number;
}

export interface Invoice {
  id: ID;
  clientId: ID;
  engagementId?: ID | null;
  number: string;
  amountINR: number; // whole rupees
  currency?: 'INR';
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  paymentLink?: string; // fake Razorpay style
}

export interface Reminder {
  id: ID;
  engagementId?: ID | null;
  invoiceId?: ID | null;
  message: string;
  remindAt: string;
  createdBy?: string;
}

export interface Note {
  id: ID;
  engagementId?: ID | null;
  clientId?: ID | null;
  author: string;
  content: string;
  createdAt: string;
}

export interface AuditLog {
  id: ID;
  entityType: 'Engagement' | 'Invoice' | 'Document' | 'Checklist' | 'Client' | 'Note';
  entityId: ID;
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
}

// Small date helpers used to produce relative realistic dates at runtime.
const now = () => new Date();
const toISO = (d: Date) => d.toISOString();
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
const subDays = (d: Date, days: number) => addDays(d, -days);

// Single firm
export const firm: Firm = {
  id: 'firm_1',
  name: 'Kottian & Co., Chartered Accountants',
  address: 'No. 12, MG Road, Mangalore, Karnataka 575001',
  gstin: '29AAACB1234Q1Z2',
  phone: '+91-824-1234567',
  email: 'info@kottianco.in',
};

// Clients
export const clients: Client[] = [
  {
    id: 'client_abc',
    name: 'ABC Traders',
    type: 'Proprietorship',
    pan: 'AAAPS1234C',
    gstin: null,
    primaryContactId: 'contact_abc_1',
    address: '1st Cross, Bangalore, Karnataka',
  },
  {
    id: 'client_rao',
    name: 'Rao Foods Pvt Ltd',
    type: 'Private Limited',
    pan: 'AAACR1234M',
    gstin: '29AABCR1234M1Z5',
    primaryContactId: 'contact_rao_1',
    address: 'Industrial Estate, Pune, Maharashtra',
  },
  {
    id: 'client_coastal',
    name: 'Coastal Logistics',
    type: 'LLP',
    pan: 'AABPC1234D',
    gstin: '27AABPC1234D1Z3',
    primaryContactId: 'contact_coastal_1',
    address: 'Marine Drive, Chennai, Tamil Nadu',
  },
  {
    id: 'client_shree',
    name: 'Shree Ganesh Textiles',
    type: 'Partnership',
    pan: 'AABSG1234G',
    gstin: null,
    primaryContactId: 'contact_shree_1',
    address: 'Textile Market, Surat, Gujarat',
  },
  {
    id: 'client_mangalore',
    name: 'Mangalore Tech Services',
    type: 'Private Limited',
    pan: 'AAMCM1234K',
    gstin: '29AAMCM1234K1Z8',
    primaryContactId: 'contact_mangalore_1',
    address: 'Mangalore SEZ, Karnataka',
  },
];

// Contacts
export const contacts: Contact[] = [
  {
    id: 'contact_abc_1',
    clientId: 'client_abc',
    name: 'Mr. Ramesh Kumar',
    role: 'Proprietor',
    phone: '+91-98765-00001',
    email: 'ramesh@abctraders.in',
  },
  {
    id: 'contact_rao_1',
    clientId: 'client_rao',
    name: 'Ms. Priya Rao',
    role: 'CFO',
    phone: '+91-98234-11001',
    email: 'priya.rao@raofoods.com',
  },
  {
    id: 'contact_coastal_1',
    clientId: 'client_coastal',
    name: 'Capt. Suresh Nair',
    role: 'Operations Head',
    phone: '+91-94455-22002',
    email: 'suresh@coastallog.in',
  },
  {
    id: 'contact_shree_1',
    clientId: 'client_shree',
    name: 'Mr. Anil Mehta',
    role: 'Partner',
    phone: '+91-98765-33003',
    email: 'anil@shreeganeshtextiles.com',
  },
  {
    id: 'contact_mangalore_1',
    clientId: 'client_mangalore',
    name: 'Ms. Kavya Rao',
    role: 'Founder',
    phone: '+91-94444-44004',
    email: 'kavya@mgtech.in',
  },
];

// Engagements - include requested names and realistic assignments
export const engagements: Engagement[] = [
  {
    id: 'eng_gst_jul_2026',
    clientId: 'client_rao',
    title: 'GST Monthly Filing - July 2026',
    type: 'GST Return',
    status: 'Waiting for Client',
    risk: 'Medium',
    assignedTo: 'CA Neha Sharma',
    startDate: toISO(subDays(now(), 10)),
    dueDate: toISO(addDays(now(), 5)),
    createdAt: toISO(subDays(now(), 12)),
    notes: ['note_1'],
  },
  {
    id: 'eng_itr_ay2026',
    clientId: 'client_abc',
    title: 'ITR Filing - AY 2026-27',
    type: 'Income Tax Return',
    status: 'In Review',
    risk: 'Low',
    assignedTo: 'CA Ritu Menon',
    startDate: toISO(subDays(now(), 40)),
    dueDate: toISO(addDays(now(), 2)),
    createdAt: toISO(subDays(now(), 45)),
    notes: ['note_2'],
  },
  {
    id: 'eng_tds_q1',
    clientId: 'client_coastal',
    title: 'TDS Return - Q1',
    type: 'TDS Return',
    status: 'Overdue',
    risk: 'High',
    assignedTo: 'CA Mohit Singh',
    startDate: toISO(subDays(now(), 70)),
    dueDate: toISO(subDays(now(), 2)),
    createdAt: toISO(subDays(now(), 80)),
    notes: [],
  },
  {
    id: 'eng_audit_docs',
    clientId: 'client_shree',
    title: 'Statutory Audit Documentation',
    type: 'Audit',
    status: 'Active',
    risk: 'High',
    assignedTo: 'CA Arjun Pillai',
    startDate: toISO(subDays(now(), 20)),
    dueDate: toISO(addDays(now(), 14)),
    createdAt: toISO(subDays(now(), 22)),
    notes: ['note_3'],
  },
  {
    id: 'eng_roc_annual',
    clientId: 'client_mangalore',
    title: 'ROC Annual Filing',
    type: 'ROC',
    status: 'Draft',
    risk: 'Medium',
    assignedTo: 'CA Sneha Iyer',
    startDate: toISO(now()),
    dueDate: toISO(addDays(now(), 30)),
    createdAt: toISO(now()),
    notes: [],
  },
];

// Checklist items
export const checklistItems: ChecklistItem[] = [
  {
    id: 'chk_1',
    engagementId: 'eng_gst_jul_2026',
    title: 'Sales register for July 2026',
    status: 'Requested',
    assignee: 'Mr. Ramesh Kumar',
    dueDate: toISO(addDays(now(), 3)),
    requestedAt: toISO(subDays(now(), 2)),
  },
  {
    id: 'chk_2',
    engagementId: 'eng_gst_jul_2026',
    title: 'Purchase invoices - July 2026',
    status: 'Pending',
    assignee: 'Mr. Ramesh Kumar',
    dueDate: toISO(addDays(now(), 5)),
  },
  {
    id: 'chk_3',
    engagementId: 'eng_itr_ay2026',
    title: 'Form 16 / Salary proofs',
    status: 'Uploaded',
    assignee: 'Ms. Priya Rao',
    dueDate: toISO(addDays(now(), 1)),
  },
  {
    id: 'chk_4',
    engagementId: 'eng_tds_q1',
    title: 'TDS challans & payment proofs',
    status: 'Rejected',
    assignee: 'Capt. Suresh Nair',
    dueDate: toISO(subDays(now(), 2)),
  },
  {
    id: 'chk_5',
    engagementId: 'eng_audit_docs',
    title: 'Bank statements FY 2025-26',
    status: 'Pending',
    assignee: 'Mr. Anil Mehta',
    dueDate: toISO(addDays(now(), 10)),
  },
];

// Documents
export const documents: Document[] = [
  {
    id: 'doc_1',
    engagementId: 'eng_itr_ay2026',
    title: 'Form16_PriyaRao.pdf',
    fileName: 'Form16_PriyaRao.pdf',
    uploadedBy: 'Ms. Priya Rao',
    uploadedAt: toISO(subDays(now(), 3)),
    status: 'Verified',
    sizeKb: 256,
  },
  {
    id: 'doc_2',
    engagementId: 'eng_gst_jul_2026',
    title: 'Sales_Register_July.xlsx',
    fileName: 'Sales_Register_July.xlsx',
    uploadedBy: 'Mr. Ramesh Kumar',
    uploadedAt: toISO(subDays(now(), 1)),
    status: 'Uploaded',
    sizeKb: 512,
  },
  {
    id: 'doc_3',
    engagementId: 'eng_tds_q1',
    title: 'TDS_Challan_Q1.pdf',
    fileName: 'TDS_Challan_Q1.pdf',
    uploadedBy: 'Capt. Suresh Nair',
    uploadedAt: toISO(subDays(now(), 10)),
    status: 'Rejected',
    sizeKb: 128,
  },
  {
    id: 'doc_4',
    engagementId: 'eng_audit_docs',
    title: 'Bank_Stmt_Apr_Mar.xlsx',
    fileName: 'Bank_Stmt_Apr_Mar.xlsx',
    uploadedBy: 'Mr. Anil Mehta',
    uploadedAt: toISO(subDays(now(), 5)),
    status: 'Uploaded',
    sizeKb: 2048,
  },
];

// Invoices
export const invoices: Invoice[] = [
  {
    id: 'inv_1001',
    clientId: 'client_rao',
    engagementId: 'eng_gst_jul_2026',
    number: 'RZ-2026-1001',
    amountINR: 124000,
    currency: 'INR',
    status: 'Sent',
    issuedAt: toISO(subDays(now(), 8)),
    dueDate: toISO(addDays(now(), 22)),
    paymentLink: 'https://rzp.io/i/ca-raj-1001',
  },
  {
    id: 'inv_1002',
    clientId: 'client_abc',
    engagementId: 'eng_itr_ay2026',
    number: 'ABC-2026-2002',
    amountINR: 18000,
    currency: 'INR',
    status: 'Overdue',
    issuedAt: toISO(subDays(now(), 60)),
    dueDate: toISO(subDays(now(), 30)),
    paymentLink: 'https://rzp.io/i/ca-abc-2002',
  },
  {
    id: 'inv_1003',
    clientId: 'client_coastal',
    engagementId: 'eng_tds_q1',
    number: 'CL-2026-3003',
    amountINR: 45000,
    currency: 'INR',
    status: 'Draft',
    issuedAt: toISO(subDays(now(), 5)),
    dueDate: toISO(addDays(now(), 25)),
    paymentLink: 'https://rzp.io/i/ca-cl-3003',
  },
  {
    id: 'inv_1004',
    clientId: 'client_shree',
    engagementId: 'eng_audit_docs',
    number: 'SGT-2026-4004',
    amountINR: 98000,
    currency: 'INR',
    status: 'Sent',
    issuedAt: toISO(subDays(now(), 15)),
    dueDate: toISO(addDays(now(), 15)),
    paymentLink: 'https://rzp.io/i/ca-sg-4004',
  },
  {
    id: 'inv_1005',
    clientId: 'client_mangalore',
    engagementId: 'eng_roc_annual',
    number: 'MG-2026-5005',
    amountINR: 25000,
    currency: 'INR',
    status: 'Paid',
    issuedAt: toISO(subDays(now(), 40)),
    dueDate: toISO(subDays(now(), 10)),
    paymentLink: 'https://rzp.io/i/ca-mg-5005',
  },
];

// Reminders
export const reminders: Reminder[] = [
  {
    id: 'rem_1',
    engagementId: 'eng_gst_jul_2026',
    invoiceId: null,
    message: 'Reminder: Please upload purchase invoices for July',
    remindAt: toISO(addDays(now(), 2)),
    createdBy: 'CA Neha Sharma',
  },
  {
    id: 'rem_2',
    engagementId: null,
    invoiceId: 'inv_1002',
    message: 'Invoice overdue reminder for ABC Traders',
    remindAt: toISO(now()),
    createdBy: 'System',
  },
];

// Notes
export const notes: Note[] = [
  {
    id: 'note_1',
    engagementId: 'eng_gst_jul_2026',
    clientId: 'client_rao',
    author: 'CA Neha Sharma',
    content: 'Client to confirm zero-rated supplies for July.',
    createdAt: toISO(subDays(now(), 11)),
  },
  {
    id: 'note_2',
    engagementId: 'eng_itr_ay2026',
    clientId: 'client_abc',
    author: 'CA Ritu Menon',
    content: 'Reviewed Form 16; missing latest salary annexure.',
    createdAt: toISO(subDays(now(), 4)),
  },
  {
    id: 'note_3',
    engagementId: 'eng_audit_docs',
    clientId: 'client_shree',
    author: 'CA Arjun Pillai',
    content: 'Request bank reconciliations for all months.',
    createdAt: toISO(subDays(now(), 6)),
  },
];

// Audit logs
export const auditLogs: AuditLog[] = [
  {
    id: 'audit_1',
    entityType: 'Document',
    entityId: 'doc_2',
    action: 'Uploaded',
    actor: 'Mr. Ramesh Kumar',
    timestamp: toISO(subDays(now(), 1)),
    details: 'Uploaded sales register for July',
  },
  {
    id: 'audit_2',
    entityType: 'Invoice',
    entityId: 'inv_1002',
    action: 'Marked Overdue',
    actor: 'System',
    timestamp: toISO(subDays(now(), 30)),
    details: 'Payment not received by due date',
  },
  {
    id: 'audit_3',
    entityType: 'Checklist',
    entityId: 'chk_3',
    action: 'Item Approved',
    actor: 'CA Ritu Menon',
    timestamp: toISO(subDays(now(), 2)),
    details: 'Form16 accepted',
  },
];

// Helper functions (named exports as requested)

export function getPendingDocumentsCount(): number {
  // Count documents that are uploaded but not yet verified
  return documents.filter((d) => d.status === 'Uploaded').length;
}

export function getOverdueInvoicesTotal(): number {
  // Sum amounts for invoices with status 'Overdue'
  return invoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.amountINR, 0);
}

export function getJobsDueThisWeek(): Engagement[] {
  const start = now();
  const end = addDays(start, 7);
  return engagements.filter((e) => {
    const due = new Date(e.dueDate);
    return due >= start && due <= end && e.status !== 'Completed' && e.status !== 'Filed';
  });
}

export function getHighRiskEngagements(): Engagement[] {
  return engagements.filter((e) => e.risk === 'High');
}

export function getEngagementProgress(engagementId: string): number {
  const items = checklistItems.filter((c) => c.engagementId === engagementId);
  if (items.length === 0) return 0;
  const approved = items.filter((i) => i.status === 'Approved').length;
  return Math.round((approved / items.length) * 100);
}

export function getClientById(clientId: string): Client | undefined {
  return clients.find((c) => c.id === clientId);
}

export function getEngagementById(engagementId: string): Engagement | undefined {
  return engagements.find((e) => e.id === engagementId);
}

export function getClientEngagements(clientId: string): Engagement[] {
  return engagements.filter((e) => e.clientId === clientId);
}

export function getEngagementChecklist(engagementId: string): ChecklistItem[] {
  return checklistItems.filter((c) => c.engagementId === engagementId);
}

export function getEngagementDocuments(engagementId: string): Document[] {
  return documents.filter((d) => d.engagementId === engagementId);
}

export function getClientInvoices(clientId: string): Invoice[] {
  return invoices.filter((inv) => inv.clientId === clientId);
}
