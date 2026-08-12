-- ============================================================
-- Bly. — Supabase Schema Reference
-- ============================================================
-- IMPORTANT: This file is a REFERENCE snapshot of the live schema,
-- generated directly from the database (information_schema / pg_catalog),
-- not a hand-written setup script. It documents what currently exists in
-- Supabase project sfzinvadnmrbxgttnygj -- it is not the source of truth,
-- the live database is. If you change the schema via the Supabase
-- dashboard or a migration, this file will drift out of date again
-- unless it's regenerated.
--
-- Do NOT run this file against an existing project expecting it to be a
-- safe, idempotent migration -- it has no ON CONFLICT / IF NOT EXISTS
-- guards on constraints, and running it twice will error on duplicate
-- constraint names. It's for reading, not executing.
--
-- Last generated: 2026-08-12
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- CORE BLY TABLES (properties, bookings, reviews, rates)
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.hotels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  name text NOT NULL,
  slug text NOT NULL,
  city text NOT NULL,
  location text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  description text,
  image_url text,
  images text[],
  price_per_night numeric(10,2),
  rooms integer DEFAULT 1,
  max_guests integer DEFAULT 2,
  rating numeric(3,1),
  booking_count integer DEFAULT 0,
  is_active boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  source text NOT NULL DEFAULT 'direct'::text,
  hotel_code text,
  currency_code text NOT NULL DEFAULT 'ZAR'::text,
  timezone text NOT NULL DEFAULT 'Africa/Johannesburg'::text,
  status text NOT NULL DEFAULT 'draft'::text,
  submitted_at timestamp with time zone,
  approved_by uuid,
  approved_at timestamp with time zone,
  rejection_reason text,
  province text,
  category text,
  short_desc text,
  amenities text[] DEFAULT '{}'::text[],
  languages text[] DEFAULT '{}'::text[],
  seasonal_rates jsonb DEFAULT '[]'::jsonb,
  total_floors integer,
  country_code text,
  hyperguest_synced_at timestamp with time zone,
  hyperguest_raw_rating numeric,
  hyperguest_property_id text,
  PRIMARY KEY (id),
  UNIQUE (slug),
  UNIQUE (hyperguest_property_id),
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES auth.users(id),
  CHECK (char_length(currency_code) = 3),
  CHECK (source = ANY (ARRAY['direct','siteminder','hyperguest'])),
  CHECK (status = ANY (ARRAY['draft','pending_review','approved','rejected','suspended']))
);
-- NOTE: is_active defaults false. A hotel must be explicitly activated to
-- appear on the public site. As of this snapshot, this table has 0 rows --
-- all live search/booking activity currently runs through the hg_* tables
-- below instead (HyperGuest properties), not this table.

CREATE TABLE public.room_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price_per_night numeric(10,2) NOT NULL,
  max_guests integer DEFAULT 2,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  room_type_code text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  total_rooms integer DEFAULT 1,
  amenities text[] DEFAULT '{}'::text[],
  images text[] DEFAULT '{}'::text[],
  PRIMARY KEY (id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

CREATE TABLE public.rate_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  room_type_id uuid NOT NULL,
  rate_plan_code text NOT NULL,
  name text NOT NULL,
  pricing_model text NOT NULL DEFAULT 'PDP'::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  audience text NOT NULL DEFAULT 'public'::text,
  hg_rate_type text,
  board_basis text,
  cancellation_policy jsonb,
  taxes_and_fees jsonb,
  is_package_rate boolean DEFAULT false,
  PRIMARY KEY (id),
  UNIQUE (hotel_id, rate_plan_code),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
  CHECK (audience = ANY (ARRAY['public','industry'])),
  CHECK (hg_rate_type = ANY (ARRAY['NET','SELL','BAR'])),
  CHECK (pricing_model = ANY (ARRAY['PDP','OBP'])),
  CHECK (rate_plan_code !~ '[<>&"'']')
);
-- audience='industry' rate plans are only visible to logged-in, approved
-- industry members via RLS -- this powers the BLY Trade staff-rate feature.

CREATE TABLE public.availability (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  room_type_id uuid NOT NULL,
  stay_date date NOT NULL,
  units integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (room_type_id, stay_date),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
  CHECK (units >= 0)
);

CREATE TABLE public.rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  rate_plan_id uuid NOT NULL,
  stay_date date NOT NULL,
  occupancy integer NOT NULL DEFAULT 0,
  amount numeric(12,2) NOT NULL,
  currency_code text NOT NULL DEFAULT 'ZAR'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (rate_plan_id, stay_date, occupancy),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (rate_plan_id) REFERENCES rate_plans(id) ON DELETE CASCADE,
  CHECK (amount >= 0),
  CHECK (occupancy >= 0),
  CHECK (char_length(currency_code) = 3)
);

CREATE TABLE public.restrictions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  rate_plan_id uuid NOT NULL,
  stay_date date NOT NULL,
  stop_sell boolean NOT NULL DEFAULT false,
  min_stay_arrival integer,
  max_stay_arrival integer,
  min_stay_through integer,
  max_stay_through integer,
  closed_to_arrival boolean NOT NULL DEFAULT false,
  closed_to_departure boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (rate_plan_id, stay_date),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (rate_plan_id) REFERENCES rate_plans(id) ON DELETE CASCADE,
  CHECK (min_stay_arrival >= 0), CHECK (max_stay_arrival >= 0),
  CHECK (min_stay_through >= 0), CHECK (max_stay_through >= 0)
);

CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hotel_id uuid NOT NULL,
  room_type_id uuid,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL DEFAULT 1,
  price_per_night numeric(10,2),
  total_price numeric(10,2),
  status text NOT NULL DEFAULT 'pending'::text,
  guest_name text,
  guest_email text,
  guest_phone text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  rate_plan_id uuid,
  siteminder_res_id text,
  res_status text NOT NULL DEFAULT 'new'::text,
  delivered_at timestamp with time zone,
  hyperguest_booking_id text,
  hg_rate_type text,
  nationality text,
  booking_currency text,
  requested_currency text,
  is_same_day_booking boolean DEFAULT false,
  remarks text,
  special_requests text,
  PRIMARY KEY (id),
  UNIQUE (hyperguest_booking_id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (rate_plan_id) REFERENCES rate_plans(id),
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE SET NULL,
  CHECK (res_status = ANY (ARRAY['new','modified','cancelled','delivered','failed'])),
  CHECK (status = ANY (ARRAY['pending','confirmed','cancelled','completed'])),
  CHECK (hg_rate_type = ANY (ARRAY['NET','SELL','BAR']))
);
-- NOTE: superseded for HyperGuest-sourced bookings by hg_bookings below,
-- which is what the active Edge Function integration writes to.

CREATE TABLE public.booking_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  room_type_id uuid,
  rate_plan_id uuid,
  guests integer NOT NULL DEFAULT 1,
  price_per_night numeric,
  total_price numeric,
  board_basis text,
  cancellation_policy jsonb,
  taxes_and_fees jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id),
  FOREIGN KEY (rate_plan_id) REFERENCES rate_plans(id)
);

CREATE TABLE public.booking_guests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_room_id uuid NOT NULL,
  occupant_type text NOT NULL,
  age integer,
  first_name text,
  last_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (booking_room_id) REFERENCES booking_rooms(id) ON DELETE CASCADE,
  CHECK (occupant_type = ANY (ARRAY['adult','child','infant']))
);

CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (hotel_id, user_id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CHECK (rating >= 1 AND rating <= 5)
);


-- ────────────────────────────────────────────────────────────
-- USERS & MEMBERSHIP
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text NOT NULL DEFAULT 'traveller'::text,
  full_name text,
  phone text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CHECK (role = ANY (ARRAY['traveller','partner','admin','industry'])),
  CHECK (status = ANY (ARRAY['active','suspended','pending']))
);

CREATE TABLE public.industry_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  amount numeric NOT NULL DEFAULT 100,
  currency_code text NOT NULL DEFAULT 'ZAR'::text,
  payment_ref text,
  payment_status text NOT NULL DEFAULT 'unpaid'::text,
  approved_by uuid,
  approved_at timestamp with time zone,
  paid_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  title text,
  first_name text,
  surname text,
  country text,
  employer_segment text,
  employer_name text,
  proof_ack boolean NOT NULL DEFAULT false,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES auth.users(id),
  CHECK (payment_status = ANY (ARRAY['unpaid','paid','refunded'])),
  CHECK (char_length(currency_code) = 3),
  CHECK (status = ANY (ARRAY['pending','active','expired','rejected','cancelled']))
);
-- Powers the "BLY Trade" closed discount channel for travel-industry staff.
-- amount defaults to R100 -- framed as a refundable verification deposit,
-- credited on first booking, not a revenue line.

CREATE TABLE public.admin_allowlist (
  email text NOT NULL,
  note text,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (email)
);


-- ────────────────────────────────────────────────────────────
-- LEADS & WAITLISTS (Coming Soon page forms)
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  city text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (email)
);

CREATE TABLE public.traveller_waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (email)
);

CREATE TABLE public.property_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  property_name text NOT NULL,
  property_type text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);


-- ────────────────────────────────────────────────────────────
-- SITEMINDER / PMS CONNECTIVITY LOGGING
-- ────────────────────────────────────────────────────────────

CREATE TABLE public.siteconnect_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  direction text NOT NULL,
  message_type text NOT NULL,
  echo_token text,
  hotel_code text,
  status text NOT NULL DEFAULT 'received'::text,
  http_status integer,
  raw_xml text,
  error_detail text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CHECK (status = ANY (ARRAY['received','processed','error','sent','ack','nack'])),
  CHECK (direction = ANY (ARRAY['inbound','outbound']))
);


-- ────────────────────────────────────────────────────────────
-- HYPERGUEST INTEGRATION (active connectivity partner, Aug 2026 onward)
-- ────────────────────────────────────────────────────────────
-- These tables back the live search -> pre-book -> book -> cancel flow
-- built against HyperGuest's demand-partner API. See supabase/functions/
-- hyperguest-* Edge Functions for the code that reads/writes these.

CREATE TABLE public.hg_property_index (
  hotel_id integer NOT NULL,
  name text,
  country text,
  city text,
  region text,
  city_id integer,
  last_updated timestamp with time zone,
  version integer,
  synced_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (hotel_id)
);
-- Lightweight index of ~53k+ HyperGuest properties (from their bulk
-- hotels.json). This is the ONLY thing that can be searched by city --
-- HyperGuest's live search API requires explicit hotelIds, no city filter.

CREATE TABLE public.hg_property_static (
  hotel_id integer NOT NULL,
  star_rating numeric,
  city_name text,
  country_code text,
  latitude numeric,
  longitude numeric,
  property_type_name text,
  descriptions jsonb,
  images jsonb,
  facilities jsonb,
  rooms jsonb,
  rate_plans jsonb,
  policies jsonb,
  taxes_fees jsonb,
  settings jsonb,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (hotel_id),
  FOREIGN KEY (hotel_id) REFERENCES hg_property_index(hotel_id) ON DELETE CASCADE
);
-- Full per-property detail (photos, descriptions, facilities), fetched
-- on-demand per property -- most of the 53k index rows do NOT have a
-- matching row here yet; only properties actually viewed/searched get cached.

CREATE TABLE public.hg_prebook_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hyperguest_property_id integer NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  nationality text,
  pax jsonb NOT NULL,
  rooms jsonb NOT NULL,
  meta jsonb,
  response jsonb,
  payment_options jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.hg_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hyperguest_booking_id bigint,
  hotel_id uuid,
  hyperguest_property_id integer NOT NULL,
  agency_reference text,
  status text NOT NULL DEFAULT 'Pending'::text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  lead_guest jsonb,
  rooms jsonb,
  prices jsonb,
  meta jsonb,
  raw_response jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (hyperguest_booking_id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id),
  CHECK (status = ANY (ARRAY['Confirmed','Pending','Rejected','Cancelled','Failed']))
);
-- hyperguest_booking_id is null when a booking attempt failed before
-- HyperGuest issued one (e.g. permission errors during certification).

CREATE TABLE public.hg_cancellations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  reason text NOT NULL,
  simulation boolean NOT NULL DEFAULT false,
  cancel_simulation_result boolean,
  raw_response jsonb,
  status text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (booking_id) REFERENCES hg_bookings(id)
);
-- simulation=true previews the cancellation penalty without cancelling.

CREATE TABLE public.hg_api_logs (
  id bigint NOT NULL,
  step text NOT NULL,
  related_booking_id uuid,
  related_prebook_id uuid,
  endpoint text NOT NULL,
  http_method text NOT NULL,
  request jsonb,
  response jsonb,
  http_status integer,
  duration_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (related_prebook_id) REFERENCES hg_prebook_sessions(id),
  FOREIGN KEY (related_booking_id) REFERENCES hg_bookings(id),
  CHECK (step = ANY (ARRAY['static_index','static_property','search','prebook','book','cancel','booking_get','booking_list']))
);
-- Full audit trail of every HyperGuest API call -- this is what gets
-- exported to satisfy HyperGuest's certification log requirement.
--
-- id is a bigint IDENTITY column (auto-incrementing); a plain column dump
-- doesn't reproduce identity syntax -- if recreating this table from
-- scratch, define it as:
--   id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY


-- ────────────────────────────────────────────────────────────
-- VIEWS
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.hg_cities AS
SELECT DISTINCT city, country
FROM public.hg_property_index
WHERE city IS NOT NULL AND city <> ''
ORDER BY city;
-- Powers the frontend city dropdown. Querying hg_property_index directly
-- with a row LIMIT is NOT a substitute for this -- with 53k+ unordered
-- rows, a limited raw query silently misses most cities. This bit us once
-- (Haifa didn't appear in the dropdown) before this view was added.


-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
-- Every table above has RLS enabled. Only ONE explicit policy exists
-- today (added Aug 2026, after the frontend needed direct read access
-- for the city dropdown -- everything else is written/read exclusively
-- via Edge Functions using the service-role key, which bypasses RLS
-- entirely, so no policy was needed until the frontend queried a table
-- directly for the first time):

CREATE POLICY "Public can read property index for search"
ON public.hg_property_index
FOR SELECT
TO anon, authenticated
USING (true);

-- If you add any new direct frontend query against a table (via
-- supabase.from(...).select(...) from React code, not an Edge Function),
-- check whether that table has a matching SELECT policy first -- RLS
-- enabled + zero policies means "deny everyone," and the failure is
-- SILENT (an empty result, not an error), which is easy to misdiagnose
-- as a frontend bug when it's actually a permissions gap.
