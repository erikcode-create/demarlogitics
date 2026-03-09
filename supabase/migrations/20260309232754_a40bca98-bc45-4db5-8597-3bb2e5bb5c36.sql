
-- Create shippers table
CREATE TABLE public.shippers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  zip TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  sales_stage TEXT NOT NULL DEFAULT 'prospect',
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  payment_terms TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  shipping_manager_name TEXT,
  direct_phone TEXT,
  estimated_monthly_loads INTEGER,
  last_contact_date TEXT,
  next_follow_up TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  is_primary BOOLEAN NOT NULL DEFAULT false
);

-- Create lanes table
CREATE TABLE public.lanes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  origin TEXT NOT NULL DEFAULT '',
  destination TEXT NOT NULL DEFAULT '',
  rate NUMERIC NOT NULL DEFAULT 0,
  equipment_type TEXT NOT NULL DEFAULT 'dry_van',
  notes TEXT NOT NULL DEFAULT ''
);

-- Create follow_ups table
CREATE TABLE public.follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  date TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id TEXT NOT NULL DEFAULT '',
  entity_type TEXT NOT NULL DEFAULT 'shipper',
  type TEXT NOT NULL DEFAULT 'note',
  description TEXT NOT NULL DEFAULT '',
  timestamp TEXT NOT NULL DEFAULT '',
  "user" TEXT NOT NULL DEFAULT ''
);

-- Create carriers table
CREATE TABLE public.carriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  mc_number TEXT NOT NULL DEFAULT '',
  dot_number TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  zip TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  equipment_types TEXT[] NOT NULL DEFAULT '{}',
  insurance_expiry TEXT NOT NULL DEFAULT '',
  insurance_provider TEXT NOT NULL DEFAULT '',
  packet_status TEXT NOT NULL DEFAULT 'not_started',
  factoring_company TEXT NOT NULL DEFAULT '',
  factoring_remit_to TEXT NOT NULL DEFAULT '',
  w9_uploaded BOOLEAN NOT NULL DEFAULT false,
  insurance_cert_uploaded BOOLEAN NOT NULL DEFAULT false,
  carrier_packet_uploaded BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create loads table
CREATE TABLE public.loads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  load_number TEXT NOT NULL DEFAULT '',
  shipper_id UUID NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
  origin TEXT NOT NULL DEFAULT '',
  destination TEXT NOT NULL DEFAULT '',
  pickup_date TEXT NOT NULL DEFAULT '',
  delivery_date TEXT NOT NULL DEFAULT '',
  shipper_rate NUMERIC NOT NULL DEFAULT 0,
  carrier_rate NUMERIC NOT NULL DEFAULT 0,
  weight NUMERIC NOT NULL DEFAULT 0,
  equipment_type TEXT NOT NULL DEFAULT 'dry_van',
  status TEXT NOT NULL DEFAULT 'available',
  pod_uploaded BOOLEAN NOT NULL DEFAULT false,
  invoice_number TEXT NOT NULL DEFAULT '',
  invoice_date TEXT NOT NULL DEFAULT '',
  invoice_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'shipper_agreement',
  status TEXT NOT NULL DEFAULT 'draft',
  entity_id TEXT NOT NULL DEFAULT '',
  entity_type TEXT NOT NULL DEFAULT 'shipper',
  load_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  terms TEXT NOT NULL DEFAULT '',
  signed_by_name TEXT NOT NULL DEFAULT '',
  signed_at TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TEXT NOT NULL DEFAULT ''
);

-- Create outbound_calls table
CREATE TABLE public.outbound_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL DEFAULT '',
  contact_title TEXT NOT NULL DEFAULT '',
  direct_phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  call_attempt_number INTEGER NOT NULL DEFAULT 1,
  call_date TEXT NOT NULL DEFAULT '',
  call_outcome TEXT NOT NULL DEFAULT 'no_answer',
  pain_point TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  next_step TEXT NOT NULL DEFAULT 'follow_up_call',
  next_follow_up_date TEXT NOT NULL DEFAULT '',
  assigned_sales_rep TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sales_tasks table
CREATE TABLE public.sales_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'call',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TEXT NOT NULL DEFAULT '',
  template_id TEXT,
  cadence_day INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create stage_change_logs table
CREATE TABLE public.stage_change_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  from_stage TEXT NOT NULL DEFAULT '',
  to_stage TEXT NOT NULL DEFAULT '',
  changed_at TEXT NOT NULL DEFAULT '',
  changed_by TEXT NOT NULL DEFAULT ''
);

-- Enable RLS on all tables
ALTER TABLE public.shippers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_change_logs ENABLE ROW LEVEL SECURITY;

-- Allow full public access (no auth yet - single user persistence)
CREATE POLICY "Allow all access" ON public.shippers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.lanes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.follow_ups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.carriers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.loads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.outbound_calls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.sales_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.email_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.stage_change_logs FOR ALL USING (true) WITH CHECK (true);
