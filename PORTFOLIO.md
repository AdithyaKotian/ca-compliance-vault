# CA Compliance Vault — Portfolio Presentation

## 📌 Project Overview

**CA Compliance Vault** is a full-stack, enterprise-grade SaaS application designed for Chartered Accountants (CA), CPA firms, and tax consultancies. It automates compliance collection workflows, statutory filing management, document encryption, and client billing in one cohesive platform.

- **Live Demo**: [https://ca-compliance-vault.vercel.app](https://ca-compliance-vault.vercel.app)
- **GitHub Repository**: [https://github.com/adithyakotian/ca-compliance-vault](https://github.com/adithyakotian/ca-compliance-vault)

---

## 🎯 Problem Statement
CA firms and tax consultancies handle hundreds of recurring compliance filings (GST, ITR, TDS, ROC, Statutory Audits) each year. They face critical operational challenges:
1. **Document Chasing**: Hours lost following up on missing invoices, bank statements, and tax forms via unstructured email threads and WhatsApp.
2. **Missed Statutory Deadlines**: High penalties and compliance risks when filings slip past regulatory due dates.
3. **Billing Leaks**: Delayed fee invoicing and lack of centralized payment follow-ups.
4. **Security Risks**: Exchanging sensitive financial records (PAN, GSTIN, Bank Statements) over insecure channels.

---

## 💡 Solution
A modern, secure, and accessible SaaS web application that provides:
- **Centralized Client CRM**: Complete firm portfolio directory with PAN/GSTIN tracking, contact persons, and risk levels.
- **Statutory Workflow Management**: End-to-end filing management with live progress tracking, task checklists, and deadline alarms.
- **Encrypted Document Vault**: Cloud storage for sensitive client files with 60-second expiring signed URLs and status verification.
- **Integrated GST Billing**: Auto-numbered invoicing, multi-tier GST calculation, payment links, and real-time revenue analytics.
- **Statutory Calendar**: Month-view scheduling uniting statutory filing deadlines, invoice dates, and meetings.
- **Dedicated Client Portal**: Secure, isolated client workspace for reviewing filings, uploading requested files, and direct messaging.

---

## 🚀 Key Features Demonstrated

1. **Full-Stack Next.js 16 & React 19 Architecture**: Server & client components, App Router, metadata management, and error boundaries.
2. **Role-Based Access Control (RBAC)**: Next.js Middleware route protection and role-filtered UI navigation for `Admin`, `Accountant`, and `Client`.
3. **Database Architecture & PostgreSQL Security**: 10 relational tables fortified with Row Level Security (RLS) policies.
4. **Encrypted Cloud Storage**: Supabase Storage buckets (`avatars`, `documents`) with client-side drag-and-drop validation and signed URL retrieval.
5. **Real-Time Data Management**: Live Supabase data mutations, audit trails, and optimistic toast feedback.
6. **Accessible UI/UX Design**: Radix UI primitives, accessible dialogs, ARIA labels, focus management, and skip-to-content links.
7. **Mobile-First Responsive Layout**: Slide-out navigation drawer sheets, responsive tables, and touch-optimized controls.

---

## 🛠️ Technical Highlights

- **Strict TypeScript**: 100% type safety with zero `any` types across 51 codebase files (11,896 lines of code).
- **Modern Styling**: Tailwind CSS 4, Radix UI primitives, and Lucide React icons.
- **Form Validation**: React Hook Form + Zod for robust client-side validation.
- **PostgreSQL Row Level Security**: Granular security policies ensuring complete multi-tenant client data isolation.
- **Optimized Production Build**: Clean Next.js compilation across all 15 routes with zero lint errors.

---

## 🔒 Security Architecture

| Security Layer | Implementation Details |
| :--- | :--- |
| **Row Level Security (RLS)** | Applied on all tables (`clients`, `engagements`, `documents`, `invoices`, `contacts`, `checklist_items`, `calendar_events`, `notes`, `audit_logs`, `profiles`). |
| **File Storage Access** | Private `documents` storage bucket accessible exclusively via 60-second expiring signed URLs. |
| **Route Protection** | Next.js Middleware verifies JWT session cookies and redirects unauthenticated or unauthorized users based on their profile role. |
| **IDOR Protection** | The Client Portal retrieves the active `client_id` strictly from the server-verified session profile, ignoring URL parameters. |
| **Clean Production Code** | Zero `console.log` statements and zero exposed API secrets. |

---

## 📈 What This Project Demonstrates to Employers & Clients

- **Full-Stack SaaS Competence**: Ability to conceptualize, design, architect, and deploy a complex domain-specific SaaS product from scratch.
- **Security-First Mindset**: Deep understanding of multi-tenancy, authentication guards, Row Level Security, and secure cloud storage.
- **Code Quality & Maintainability**: Adherence to strict TypeScript typing, modular component separation, reusable design patterns, and zero lint errors.
- **User-Centric Product Design**: Thoughtful features tailored to Chartered Accountants and their end-clients with rich feedback, loading skeletons, and error handling.
