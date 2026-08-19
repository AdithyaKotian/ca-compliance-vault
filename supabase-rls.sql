-- ==============================================================================
-- CA COMPLIANCE VAULT — PRODUCTION ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Enable Row Level Security on all core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Table Policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Firm members can view firm profiles" ON profiles
  FOR SELECT USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

-- 3. Clients Table Policies
CREATE POLICY "Firm members can view all firm clients" ON clients
  FOR SELECT USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Firm staff can insert and manage clients" ON clients
  FOR ALL USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Client users can view own client profile" ON clients
  FOR SELECT USING (
    id IN (SELECT client_id FROM profiles WHERE id = auth.uid())
  );

-- 4. Contacts Table Policies
CREATE POLICY "Firm staff can manage contacts" ON contacts
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE firm_id IN (
        SELECT firm_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Client users can view own contacts" ON contacts
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid())
  );

-- 5. Engagements Table Policies
CREATE POLICY "Firm staff can manage engagements" ON engagements
  FOR ALL USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Client users can view own engagements" ON engagements
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid())
  );

-- 6. Checklist Items Table Policies
CREATE POLICY "Firm staff can manage checklist items" ON checklist_items
  FOR ALL USING (
    engagement_id IN (
      SELECT id FROM engagements WHERE firm_id IN (
        SELECT firm_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Client users can view and update own checklist status" ON checklist_items
  FOR ALL USING (
    engagement_id IN (
      SELECT id FROM engagements WHERE client_id IN (
        SELECT client_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 7. Documents Table Policies
CREATE POLICY "Firm staff can manage documents" ON documents
  FOR ALL USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Client users can view and upload own documents" ON documents
  FOR ALL USING (
    client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid())
  );

-- 8. Invoices Table Policies
CREATE POLICY "Firm staff can manage invoices" ON invoices
  FOR ALL USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Client users can view own invoices" ON invoices
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid())
  );

-- 9. Calendar Events Table Policies
CREATE POLICY "Firm members can manage calendar events" ON calendar_events
  FOR ALL USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

-- 10. Notes & Messaging Table Policies
CREATE POLICY "Firm staff can manage notes" ON notes
  FOR ALL USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Client users can view and add notes for own account" ON notes
  FOR ALL USING (
    client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid())
  );

-- 11. Audit Logs Table Policies
CREATE POLICY "Firm staff can view audit logs" ON audit_logs
  FOR SELECT USING (
    firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "System and users can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 12. Supabase Storage Buckets & Policies
-- ==============================================================================

-- Create buckets if they do not already exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Avatars: Public read, authenticated users can upload
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Documents: Authenticated access with RLS (Private signed URLs)
CREATE POLICY "Authenticated users access documents" ON storage.objects
  FOR ALL USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
