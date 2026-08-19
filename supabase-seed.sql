-- ==============================================================================
-- CA COMPLIANCE VAULT — DEMO SEED DATA
-- ==============================================================================

-- 1. Create Demo Firm
INSERT INTO firms (id, name, email, phone, address) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Kotian & Co. Chartered Accountants', 'info@kotianandco.in', '+91 98765 43210', 'Mangalore, Karnataka, India')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Demo Clients
INSERT INTO clients (id, firm_id, name, type, email, phone, pan, gstin, address, risk_level) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'ABC Traders', 'business', 'client@abctraders.in', '+91 98765 11111', 'ABCDE1234F', '29ABCDE1234F1Z5', 'MG Road, Mangalore', 'medium'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'XYZ Manufacturing', 'business', 'accounts@xyzmanufacturing.in', '+91 98765 22222', 'XYZAB5678G', '29XYZAB5678G1Z6', 'Industrial Area, Mangalore', 'high'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'John Dsouza', 'individual', 'john.dsouza@gmail.com', '+91 98765 33333', 'JOHND1234H', NULL, 'Bejai, Mangalore', 'low'),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', 'Sunrise Hospitality', 'business', 'info@sunrisehospitality.in', '+91 98765 44444', 'SUNRI5678J', '29SUNRI5678J1Z7', 'Kadri, Mangalore', 'medium'),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111', 'Priya Shenoy', 'individual', 'priya.shenoy@gmail.com', '+91 98765 55555', 'PRIYA1234K', NULL, 'Kankanady, Mangalore', 'low')
ON CONFLICT (id) DO NOTHING;

-- 3. Create Demo Contacts
INSERT INTO contacts (id, client_id, name, email, phone, designation) VALUES
  ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201', 'Rajesh Kumar', 'rajesh@abctraders.in', '+91 98765 11112', 'Director'),
  ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222202', 'Anita Sharma', 'anita@xyzmanufacturing.in', '+91 98765 22223', 'CFO'),
  ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222203', 'John Dsouza', 'john.dsouza@gmail.com', '+91 98765 33333', 'Self'),
  ('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222204', 'Priya Nayak', 'priya@sunrisehospitality.in', '+91 98765 44445', 'Owner')
ON CONFLICT (id) DO NOTHING;

-- 4. Create Demo Engagements
INSERT INTO engagements (id, firm_id, client_id, title, type, status, risk, due_date, priority) VALUES
  ('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'GST Return Filing - Q1 2025', 'GST Return', 'In Progress', 'medium', '2025-07-15', 'High'),
  ('55555555-5555-5555-5555-555555555502', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'ITR Filing - AY 2025-26', 'ITR Filing', 'Waiting for Client', 'high', '2025-08-31', 'Urgent'),
  ('55555555-5555-5555-5555-555555555503', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', 'Statutory Audit - FY 2024-25', 'Audit', 'Not Started', 'high', '2025-09-30', 'High'),
  ('55555555-5555-5555-5555-555555555504', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222203', 'ITR Filing - AY 2025-26', 'ITR Filing', 'In Review', 'low', '2025-07-31', 'Medium'),
  ('55555555-5555-5555-5555-555555555505', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222204', 'TDS Return - Q2 2025', 'TDS Return', 'Completed', 'medium', '2025-07-15', 'Low')
ON CONFLICT (id) DO NOTHING;

-- 5. Create Demo Checklist Items
INSERT INTO checklist_items (id, engagement_id, title, description, status, required, due_date, assigned_staff) VALUES
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 'GST Summary', 'Provide GST summary for Q1', 'Uploaded', true, '2025-07-10', NULL),
  ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', 'Sales Register', 'Upload sales register', 'Pending', true, '2025-07-12', NULL),
  ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555502', 'Form 16', 'Provide Form 16 from employer', 'Requested', true, '2025-08-15', NULL),
  ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555502', 'Bank Statements', 'Upload all bank statements', 'Pending', true, '2025-08-20', NULL),
  ('66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555503', 'Fixed Asset Register', 'Provide fixed asset register', 'Pending', true, '2025-09-10', NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. Create Demo Documents
INSERT INTO documents (id, client_id, engagement_id, title, file_name, file_path, file_type, file_size, status, uploaded_at) VALUES
  ('77777777-7777-7777-7777-777777777701', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555501', 'GST Summary Q1', 'gst-summary-q1.pdf', 'demo/gst-summary-q1.pdf', 'application/pdf', 250000, 'Uploaded', NOW()),
  ('77777777-7777-7777-7777-777777777702', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555502', 'Form 16', 'form-16-2025.pdf', 'demo/form-16-2025.pdf', 'application/pdf', 150000, 'Pending', NOW()),
  ('77777777-7777-7777-7777-777777777703', '22222222-2222-2222-2222-222222222202', '55555555-5555-5555-5555-555555555503', 'Audit Confirmation', 'audit-confirmation.pdf', 'demo/audit-confirmation.pdf', 'application/pdf', 100000, 'Uploaded', NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. Create Demo Invoices
INSERT INTO invoices (id, firm_id, client_id, engagement_id, invoice_number, amount, tax, total_amount, status, due_date, payment_date, payment_link) VALUES
  ('88888888-8888-8888-8888-888888888801', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555501', 'INV-2025-0001', 15000, 2700, 17700, 'Paid', '2025-07-10', '2025-07-08', NULL),
  ('88888888-8888-8888-8888-888888888802', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555502', 'INV-2025-0002', 8000, 1440, 9440, 'Sent', '2025-08-25', NULL, NULL),
  ('88888888-8888-8888-8888-888888888803', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', '55555555-5555-5555-5555-555555555503', 'INV-2025-0003', 50000, 9000, 59000, 'Sent', '2025-09-20', NULL, NULL),
  ('88888888-8888-8888-8888-888888888804', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222203', '55555555-5555-5555-5555-555555555504', 'INV-2025-0004', 5000, 900, 5900, 'Paid', '2025-07-25', '2025-07-20', NULL),
  ('88888888-8888-8888-8888-888888888805', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222204', '55555555-5555-5555-5555-555555555505', 'INV-2025-0005', 12000, 2160, 14160, 'Overdue', '2025-07-10', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 8. Create Demo Notes
INSERT INTO notes (id, firm_id, client_id, engagement_id, body) VALUES
  ('99999999-9999-9999-9999-999999999901', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555502', 'Please upload your Form 16 as soon as possible. The deadline is approaching.'),
  ('99999999-9999-9999-9999-999999999902', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555502', 'I will upload Form 16 by this week. Thank you for the reminder.')
ON CONFLICT (id) DO NOTHING;

-- 9. Create Demo Calendar Events
INSERT INTO calendar_events (id, firm_id, title, description, event_type, start_time, end_time, client_id, engagement_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '11111111-1111-1111-1111-111111111111', 'GST Return Deadline', 'GST Q1 filing deadline for ABC Traders', 'Deadline', '2025-07-15T10:00:00Z', '2025-07-15T11:00:00Z', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555501'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', '11111111-1111-1111-1111-111111111111', 'Client Meeting - XYZ Manufacturing', 'Review audit progress', 'Meeting', '2025-08-01T14:00:00Z', '2025-08-01T15:00:00Z', '22222222-2222-2222-2222-222222222202', '55555555-5555-5555-5555-555555555503'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', '11111111-1111-1111-1111-111111111111', 'ITR Filing Deadline', 'ITR filing deadline for John Dsouza', 'Deadline', '2025-07-31T10:00:00Z', '2025-07-31T11:00:00Z', '22222222-2222-2222-2222-222222222203', '55555555-5555-5555-5555-555555555504')
ON CONFLICT (id) DO NOTHING;
