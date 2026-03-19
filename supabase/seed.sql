-- ============================================================
-- KASHESHE YETU – Seed Data
-- Run AFTER schema.sql
-- ============================================================
-- NOTE: This seeds member records WITHOUT auth users.
-- Auth users are created through Supabase Auth (Admin Console or invite).
-- Members are linked via profile_id when a user logs in.
-- ============================================================

-- Monthly rate reference
-- 10,000 = 1 month  |  20,000 = 2 months  |  30,000 = 3 months
-- 40,000 = 4 months |  50,000 = 5 months
-- Joining fee = 10,000 (separate from monthly contributions)
-- Irregular amounts (e.g. 15,000) are flagged needs_review = TRUE

-- CALCULATE OUTSTANDING:
-- Assumption: group started January 2024, seed data collected by December 2024
-- Expected months = 12 (Jan 2024 – Dec 2024)
-- Expected annual = 12 * 10,000 = 120,000 TSh
-- outstanding = MAX(0, 120,000 - total_monthly_paid)

-- ─── INSERT MEMBERS ──────────────────────────────────────────
INSERT INTO public.members (
  member_number, full_name, entry_fee_required, entry_fee_paid,
  total_contribution, months_paid, outstanding_balance,
  annual_expected_contribution, last_paid_month, member_type,
  role, status, date_joined, notes, created_at, updated_at
) VALUES
  -- 1 BANAGA KATABAZI – 50,000 = 5 months
  ('KY-001','BANAGA KATABAZI',FALSE,FALSE,50000,5,70000,120000,'2024-05','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 2 ABDALLAH SADICK – 50,000 = 5 months
  ('KY-002','ABDALLAH SADICK',FALSE,FALSE,50000,5,70000,120000,'2024-05','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 3 ERAD EZRON – 30,000 = 3 months
  ('KY-003','ERAD EZRON',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 4 MAXIMILIAN RWAMIBAZI – 50,000 = 5 months
  ('KY-004','MAXIMILIAN RWAMIBAZI',FALSE,FALSE,50000,5,70000,120000,'2024-05','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 5 LEAH HIOLANA – 40,000 = 4 months
  ('KY-005','LEAH HIOLANA',FALSE,FALSE,40000,4,80000,120000,'2024-04','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 6 ENOCK TIBANDEBAGE – 40,000 = 4 months
  ('KY-006','ENOCK TIBANDEBAGE',FALSE,FALSE,40000,4,80000,120000,'2024-04','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 7 RAJABU SADICK – 30,000 = 3 months
  ('KY-007','RAJABU SADICK',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 8 BONIVENTURE A. MUSHONGI – 30,000 = 3 months
  ('KY-008','BONIVENTURE A. MUSHONGI',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 9 BENO MUSHONGI – 30,000 = 3 months
  ('KY-009','BENO MUSHONGI',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 10 IRENEUS MUSHONGI – 10,000 = 1 month
  ('KY-010','IRENEUS MUSHONGI',FALSE,FALSE,10000,1,110000,120000,'2024-01','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 11 IRIMINA NYAKATO MUSHONGI – 20,000 = 2 months
  ('KY-011','IRIMINA NYAKATO MUSHONGI',FALSE,FALSE,20000,2,100000,120000,'2024-02','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 12 JONAS RUTAIZIBWA – 30,000 = 3 months
  ('KY-012','JONAS RUTAIZIBWA',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 13 JAMILAH ELIEZA – 30,000 = 3 months
  ('KY-013','JAMILAH ELIEZA',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 14 ARSTIDES K. MUSHONGI – 30,000 = 3 months
  ('KY-014','ARSTIDES K. MUSHONGI',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 15 VALERIA BURCHARD – 30,000 = 3 months
  ('KY-015','VALERIA BURCHARD',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 16 ANITHA PASCHAL – 10,000 = 1 month
  ('KY-016','ANITHA PASCHAL',FALSE,FALSE,10000,1,110000,120000,'2024-01','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 17 ADERA EDSON – 30,000 = 3 months
  ('KY-017','ADERA EDSON',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 18 MOSES MAJALIWA GABANU – 30,000 = 3 months
  ('KY-018','MOSES MAJALIWA GABANU',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 19 FRANSIS RWAKEZA – 30,000 = 3 months
  ('KY-019','FRANSIS RWAKEZA',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 20 LYDIA MAKUBI – 30,000 = 3 months
  ('KY-020','LYDIA MAKUBI',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 21 YOLENTA MUSHONGI – 20,000 = 2 months
  ('KY-021','YOLENTA MUSHONGI',FALSE,FALSE,20000,2,100000,120000,'2024-02','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 22 ELIZEUS MUSHONGI – 30,000 = 3 months
  ('KY-022','ELIZEUS MUSHONGI',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 23 GETSON BAHONGI – 30,000 = 3 months
  ('KY-023','GETSON BAHONGI',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 24 STIVIN KIIZA – 30,000 = 3 months
  ('KY-024','STIVIN KIIZA',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 25 JOSEBERT SAULO – 30,000 = 3 months
  ('KY-025','JOSEBERT SAULO',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 26 IMANI ELIEZA – 10,000 = 1 month
  ('KY-026','IMANI ELIEZA',FALSE,FALSE,10000,1,110000,120000,'2024-01','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 27 HIDAYA MUSHONGI – 15,000 = IRREGULAR – flagged
  ('KY-027','HIDAYA MUSHONGI',FALSE,FALSE,15000,1,105000,120000,'2024-01','founding','member','active','2024-01-01','Amount 15,000 is irregular – needs review',NOW(),NOW()),
  -- 28 BENSON SAULO – 30,000 = 3 months
  ('KY-028','BENSON SAULO',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 29 GEREVAZ RUTAIZIBWA – 30,000 = 3 months
  ('KY-029','GEREVAZ RUTAIZIBWA',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 30 LIVINGSTONE BAHONGI – 10,000 = 1 month
  ('KY-030','LIVINGSTONE BAHONGI',FALSE,FALSE,10000,1,110000,120000,'2024-01','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 31 PENDO ELIEZA – 30,000 = 3 months
  ('KY-031','PENDO ELIEZA',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 32 GEOFREY GABONE – 30,000 = 3 months
  ('KY-032','GEOFREY GABONE',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 33 RECTA E NDABIGILANTA – 30,000 = 3 months
  ('KY-033','RECTA E NDABIGILANTA',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 34 ANORD ASINGILE AMON – 30,000 = 3 months
  ('KY-034','ANORD ASINGILE AMON',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 35 GEOFRID MUSHONGI – 30,000 = 3 months
  ('KY-035','GEOFRID MUSHONGI',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 36 ARNOLD MUSHONGI – 30,000 = 3 months
  ('KY-036','ARNOLD MUSHONGI',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 37 HELMAN NINSIMA MUSHONGI – 30,000 = 3 months
  ('KY-037','HELMAN NINSIMA MUSHONGI',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 38 CHARTON CHARLES MUSHONGI – 20,000 = 2 months
  ('KY-038','CHARTON CHARLES MUSHONGI',FALSE,FALSE,20000,2,100000,120000,'2024-02','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 39 ADERIBERT MUSHONGI – 15,000 = IRREGULAR – flagged
  ('KY-039','ADERIBERT MUSHONGI',FALSE,FALSE,15000,1,105000,120000,'2024-01','founding','member','active','2024-01-01','Amount 15,000 is irregular – needs review',NOW(),NOW()),
  -- 40 AMON FESTO – 40,000 = 4 months
  ('KY-040','AMON FESTO',FALSE,FALSE,40000,4,80000,120000,'2024-04','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 41 BENEFACE ANTONY – 30,000 = 3 months
  ('KY-041','BENEFACE ANTONY',FALSE,FALSE,30000,3,90000,120000,'2024-03','founding','member','active','2024-01-01','',NOW(),NOW()),
  -- 42 AMWESIGA ELIAS KAJEHE – 30,000 + joining fee 10,000 (late joiner)
  ('KY-042','AMWESIGA ELIAS KAJEHE',TRUE,TRUE,30000,3,90000,120000,'2024-03','regular','member','active','2024-01-01','Joining fee paid',NOW(),NOW()),
  -- 43 TEOLAS VERANTIN – 30,000 + joining fee 10,000
  ('KY-043','TEOLAS VERANTIN',TRUE,TRUE,30000,3,90000,120000,'2024-03','regular','member','active','2024-01-01','Joining fee paid',NOW(),NOW()),
  -- 44 ATANAZI ANTONY – 30,000 + joining fee 10,000
  ('KY-044','ATANAZI ANTONY',TRUE,TRUE,30000,3,90000,120000,'2024-03','regular','member','active','2024-01-01','Joining fee paid',NOW(),NOW()),
  -- 45 EDINA MGANYIZI – 30,000 + joining fee 10,000
  ('KY-045','EDINA MGANYIZI',TRUE,TRUE,30000,3,90000,120000,'2024-03','regular','member','active','2024-01-01','Joining fee paid',NOW(),NOW()),
  -- 46 BAHATI BRASIO – 20,000 + joining fee 10,000
  ('KY-046','BAHATI BRASIO',TRUE,TRUE,20000,2,100000,120000,'2024-02','regular','member','active','2024-01-01','Joining fee paid',NOW(),NOW()),
  -- 47 DEZIDERIUS EPHULAHIM – 30,000 + joining fee 10,000
  ('KY-047','DEZIDERIUS EPHULAHIM',TRUE,TRUE,30000,3,90000,120000,'2024-03','regular','member','active','2024-01-01','Joining fee paid',NOW(),NOW())
ON CONFLICT (member_number) DO NOTHING;

-- ─── INSERT CONTRIBUTIONS (normalized from seed data) ─────────
-- Using member subqueries to get proper IDs
-- Monthly contributions
INSERT INTO public.contributions (member_id, member_name, amount, payment_type, months_covered, covered_months, payment_date, payment_method, needs_review, created_at, updated_at)
SELECT m.id, m.full_name, v.amount, 'monthly', v.months, v.covered::jsonb, v.payment_date, 'cash', v.irregular, NOW(), NOW()
FROM (VALUES
  ('KY-001', 50000, 5, '["2024-01","2024-02","2024-03","2024-04","2024-05"]', '2024-05-01', FALSE),
  ('KY-002', 50000, 5, '["2024-01","2024-02","2024-03","2024-04","2024-05"]', '2024-05-01', FALSE),
  ('KY-003', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-004', 50000, 5, '["2024-01","2024-02","2024-03","2024-04","2024-05"]', '2024-05-01', FALSE),
  ('KY-005', 40000, 4, '["2024-01","2024-02","2024-03","2024-04"]', '2024-04-01', FALSE),
  ('KY-006', 40000, 4, '["2024-01","2024-02","2024-03","2024-04"]', '2024-04-01', FALSE),
  ('KY-007', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-008', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-009', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-010', 10000, 1, '["2024-01"]', '2024-01-01', FALSE),
  ('KY-011', 20000, 2, '["2024-01","2024-02"]', '2024-02-01', FALSE),
  ('KY-012', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-013', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-014', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-015', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-016', 10000, 1, '["2024-01"]', '2024-01-01', FALSE),
  ('KY-017', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-018', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-019', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-020', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-021', 20000, 2, '["2024-01","2024-02"]', '2024-02-01', FALSE),
  ('KY-022', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-023', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-024', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-025', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-026', 10000, 1, '["2024-01"]', '2024-01-01', FALSE),
  ('KY-027', 15000, 1, '["2024-01"]', '2024-01-01', TRUE),
  ('KY-028', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-029', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-030', 10000, 1, '["2024-01"]', '2024-01-01', FALSE),
  ('KY-031', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-032', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-033', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-034', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-035', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-036', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-037', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-038', 20000, 2, '["2024-01","2024-02"]', '2024-02-01', FALSE),
  ('KY-039', 15000, 1, '["2024-01"]', '2024-01-01', TRUE),
  ('KY-040', 40000, 4, '["2024-01","2024-02","2024-03","2024-04"]', '2024-04-01', FALSE),
  ('KY-041', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-042', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-043', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-044', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-045', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE),
  ('KY-046', 20000, 2, '["2024-01","2024-02"]', '2024-02-01', FALSE),
  ('KY-047', 30000, 3, '["2024-01","2024-02","2024-03"]', '2024-03-01', FALSE)
) AS v(member_number, amount, months, covered, payment_date, irregular)
JOIN public.members m ON m.member_number = v.member_number;

-- Joining fees for late joiners (42–47)
INSERT INTO public.contributions (member_id, member_name, amount, payment_type, months_covered, covered_months, payment_date, payment_method, needs_review, created_at, updated_at)
SELECT m.id, m.full_name, 10000, 'joining_fee', 0, '[]'::jsonb, '2024-01-01', 'cash', FALSE, NOW(), NOW()
FROM public.members m
WHERE m.member_number IN ('KY-042','KY-043','KY-044','KY-045','KY-046','KY-047');

-- ─── SAMPLE ANNOUNCEMENT ─────────────────────────────────────
INSERT INTO public.announcements (title, message, priority, target_role, is_published, created_at, updated_at)
VALUES
  ('Karibu – Kasheshe Yetu App', 'Tunafurahi kukutangazia kwamba sasa tuna mfumo mpya wa usimamizi wa kikundi. Tafadhali jisajili na uwasiliane na msimamizi kwa msaada wowote.', 'high', 'all', TRUE, NOW(), NOW()),
  ('Welcome to Kasheshe Yetu App', 'We are pleased to announce our new group management system. Please sign up and contact the admin for any assistance.', 'normal', 'all', TRUE, NOW(), NOW()),
  ('Kikao cha Kwanza – Januari 2024', 'Kikao cha kwanza cha mwaka kitafanyika tarehe 15 Januari 2024. Wanachama wote wanaombwa kuhudhuria.', 'urgent', 'all', TRUE, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ─── VERIFICATION QUERY ───────────────────────────────────────
-- Run these to verify the import:
-- SELECT COUNT(*) FROM members;                 -- Should be 47
-- SELECT COUNT(*) FROM contributions;           -- Should be 47 monthly + 6 joining = 53
-- SELECT SUM(amount) FROM contributions;        -- Should be 1,525,000 (total all amounts + joining fees)
-- SELECT COUNT(*) FROM contributions WHERE needs_review = TRUE; -- Should be 2 (KY-027, KY-039)
-- SELECT member_number, full_name, total_contribution, outstanding_balance FROM members ORDER BY member_number;
