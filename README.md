# CA Compliance Vault

A production-grade SaaS platform for Chartered Accountant (CA) firms to manage clients, compliance engagements, documents, invoices, and client communication.

## 🚀 Live Demo

- **URL:** [https://ca-compliance-vault.vercel.app](https://ca-compliance-vault.vercel.app)
- **GitHub:** [https://github.com/AdithyaKotian/ca-compliance-vault](https://github.com/AdithyaKotian/ca-compliance-vault)

## 📋 Demo Credentials

| Role | Email | Password |
|:---|:---|:---|
| Admin | admin@kotianandco.in | demo123 |
| Client | client@abctraders.in | demo123 |

## ✨ Features

### Authentication & Security
- Email/password authentication with Supabase Auth
- Role-based access control (Admin, Accountant, Client)
- Protected routes with middleware
- Password reset flow
- Row Level Security (RLS) on all tables
- Signed URLs for document access (60-second expiry)
- Session-derived client ID (prevents IDOR attacks)

### Client Management
- Full CRUD operations (Create, Read, Update, Delete)
- Live search and filtering
- Risk assessment (High, Medium, Low)
- Client portal access
- Contact management
- Audit trail logging

### Document Management
- Secure file upload to Supabase Storage
- Drag-and-drop interface
- File type and size validation (max 10MB)
- Status tracking (Pending, Uploaded, Verified, Rejected)
- Download with signed URLs
- Client/engagement association

### Engagement Management
- Statutory return tracking (ITR, GST, Audit, ROC, TDS)
- Status workflow (Not Started → In Progress → Waiting for Client → In Review → Completed)
- Priority levels (Low, Medium, High, Urgent)
- Deadline tracking
- Checklist items for requirements

### Invoice Management
- Auto-numbering (INV-YYYY-XXXX)
- GST tax calculation
- Payment tracking (Draft, Sent, Paid, Overdue, Cancelled)
- Outstanding balance summary
- Payment link support

### Calendar
- Monthly view with navigation
- Statutory deadline tracking
- Invoice due date display
- Color-coded events (Deadline, Meeting, Task, Reminder)
- Upcoming deadlines sidebar (7-day view)

### Client Portal
- Secure client isolation (session-based)
- Document upload
- Invoice viewing
- Engagement progress tracking
- Checklist status updates
- Messaging system

### Dashboard
- Live metrics from Supabase
- Total clients count
- Active engagements
- Pending documents
- Outstanding invoices
- Upcoming deadlines

## 🛠️ Tech Stack

| Technology | Purpose |
|:---|:---|
| Next.js 16 | React framework (App Router) |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| Supabase | Backend (Auth, Database, Storage) |
| Radix UI | Accessible UI primitives |
| React Hook Form | Form management |
| Zod | Schema validation |
| date-fns | Date handling |
| Sonner | Toast notifications |
| Lucide React | Icons |

## 📁 Project Structure

```
ca-compliance-vault/
├── app/
│   ├── login/                # Login page
│   ├── dashboard/            # Admin dashboard
│   ├── clients/              # Client management
│   │   └── [clientId]/       # Client detail page
│   ├── documents/            # Document management
│   ├── engagements/          # Engagement management
│   ├── invoices/             # Invoice management
│   ├── calendar/             # Calendar
│   ├── settings/             # Profile settings
│   ├── client-portal/        # Client portal
│   ├── forgot-password/      # Password reset
│   ├── reset-password/       # New password
│   ├── error.tsx             # Error boundary
│   ├── loading.tsx           # Loading state
│   └── not-found.tsx         # 404 page
├── components/
│   ├── layout/               # Dashboard shell, sidebar, topbar
│   ├── ui/                   # Button, Card, Dialog, Table, etc.
│   ├── documents/            # Document upload
│   ├── engagements/          # Engagement form
│   ├── invoices/             # Invoice form
│   └── calendar/             # Calendar view
├── lib/
│   └── supabase/
│       ├── client.ts         # Browser client
│       └── server.ts         # Server client
├── public/                   # Static assets
├── supabase-rls.sql          # RLS policies
├── supabase-seed.sql         # Demo data
└── README.md
```

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS policies ensuring:
- Clients can only view their own data
- Firm members can only access their firm's data
- Admins have full access
- Unauthorized access is blocked

### Authentication Security
- Session persistence with auto-refresh
- Password reset with email verification
- Role-based route protection
- Middleware session refresh

### File Security
- Signed URLs with 60-second expiry
- File type validation
- File size limits (10MB)
- Private storage buckets

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AdithyaKotian/ca-compliance-vault.git
cd ca-compliance-vault
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a project at supabase.com
   - Go to SQL Editor
   - Run `supabase-rls.sql` to create RLS policies
   - Run `supabase-seed.sql` to add demo data
   - Create storage buckets: `avatars` (public) and `documents` (private)

4. Configure environment variables:
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

5. Run the development server:
```bash
npm run dev
```

6. Open http://localhost:3000

### Build for Production

```bash
npm run build
npm run start
```

## 📊 Project Statistics

- **51+** TypeScript files
- **11,896+** lines of code
- **15+** pages/routes
- **12** database tables
- **3** user roles
- **2** storage buckets
- **50+** features

## 🧪 Testing

- ESLint: 0 errors, 0 warnings
- TypeScript: 0 errors
- Build: Successfully compiled
- No console.log statements
- No TODO comments
- No `any` types

## 📝 License

This project is for portfolio demonstration purposes.

## 👨‍💻 Author

**Adithya Kotian**