-- Staff Payroll Module
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS staff_payroll (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id            UUID REFERENCES staff(id) ON DELETE CASCADE,
  staff_name          TEXT NOT NULL,
  month               INT  NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                INT  NOT NULL,
  basic_pay           NUMERIC(10,2) DEFAULT 0,
  hra                 NUMERIC(10,2) DEFAULT 0,
  transport_allowance NUMERIC(10,2) DEFAULT 0,
  other_allowances    NUMERIC(10,2) DEFAULT 0,
  pf_deduction        NUMERIC(10,2) DEFAULT 0,
  other_deductions    NUMERIC(10,2) DEFAULT 0,
  net_pay             NUMERIC(10,2) GENERATED ALWAYS AS
                        (basic_pay + hra + transport_allowance + other_allowances
                         - pf_deduction - other_deductions) STORED,
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','paid')),
  payment_date        DATE,
  payment_mode        TEXT DEFAULT 'bank_transfer' CHECK (payment_mode IN ('bank_transfer','cash','cheque','upi')),
  notes               TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (staff_id, month, year)
);

ALTER TABLE staff_payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_payroll" ON staff_payroll FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON staff_payroll TO anon;
