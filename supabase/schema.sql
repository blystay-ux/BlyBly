-- ============================================================
-- Bly. — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── HOTELS ─────────────────────────────────────────────────
create table if not exists hotels (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  slug         text not null unique,
  city         text not null,
  province     text not null,
  description  text,
  short_desc   text,
  price_night  numeric(10,2) not null,
  rating       numeric(3,1) default 0,
  review_count integer default 0,
  images       text[] default '{}',
  amenities    text[] default '{}',
  latitude     numeric(9,6),
  longitude    numeric(9,6),
  featured     boolean default false,
  category     text check (category in ('hotel','lodge','guesthouse','boutique','resort')),
  created_at   timestamptz default now()
);

-- ─── BOOKINGS ────────────────────────────────────────────────
create table if not exists bookings (
  id           uuid primary key default uuid_generate_v4(),
  hotel_id     uuid references hotels(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  check_in     date not null,
  check_out    date not null,
  guests       integer not null default 1,
  total_price  numeric(10,2) not null,
  status       text default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at   timestamptz default now()
);

-- ─── REVIEWS ─────────────────────────────────────────────────
create table if not exists reviews (
  id           uuid primary key default uuid_generate_v4(),
  hotel_id     uuid references hotels(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  rating       integer check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
alter table hotels   enable row level security;
alter table bookings enable row level security;
alter table reviews  enable row level security;

-- Hotels: public read
create policy "Hotels are publicly readable"
  on hotels for select using (true);

-- Bookings: users manage their own
create policy "Users can view their bookings"
  on bookings for select using (auth.uid() = user_id);

create policy "Users can create bookings"
  on bookings for insert with check (auth.uid() = user_id);

create policy "Users can update their bookings"
  on bookings for update using (auth.uid() = user_id);

-- Reviews: public read, authenticated write
create policy "Reviews are publicly readable"
  on reviews for select using (true);

create policy "Authenticated users can leave reviews"
  on reviews for insert with check (auth.uid() = user_id);

-- ─── SAMPLE DATA ─────────────────────────────────────────────
insert into hotels (name, slug, city, province, short_desc, description, price_night, rating, review_count, images, amenities, featured, category) values

('The Alphen Boutique Hotel', 'the-alphen-boutique-hotel', 'Cape Town', 'Western Cape',
 'A historic manor nestled in Constantia Valley',
 'Set in a Cape Dutch manor house dating back to the 1750s, The Alphen offers timeless luxury surrounded by the iconic Constantia winelands.',
 3200, 4.8, 142,
 ARRAY['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800','https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'],
 ARRAY['Pool','WiFi','Spa','Restaurant','Bar','Parking'],
 true, 'boutique'),

('Singita Boulders Lodge', 'singita-boulders-lodge', 'Sabi Sand', 'Mpumalanga',
 'Ultra-luxury safari lodge in the Greater Kruger',
 'An intimate lodge perched among ancient boulders in the Sabi Sand Game Reserve, offering unrivalled Big Five game viewing and world-class cuisine.',
 28000, 4.9, 89,
 ARRAY['https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800','https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800'],
 ARRAY['Game drives','Pool','Spa','All-inclusive','WiFi','Fireplace'],
 true, 'lodge'),

('Twelve Apostles Hotel', 'twelve-apostles-hotel', 'Cape Town', 'Western Cape',
 'Iconic clifftop hotel between mountain and sea',
 'Dramatically positioned between the Twelve Apostles mountain range and the Atlantic Ocean, this iconic hotel blends natural beauty with refined comfort.',
 4800, 4.7, 312,
 ARRAY['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800','https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800'],
 ARRAY['Pool','Spa','Restaurant','Bar','Gym','Parking','WiFi'],
 true, 'hotel'),

('Grootbos Private Nature Reserve', 'grootbos-nature-reserve', 'Hermanus', 'Western Cape',
 'Award-winning eco-lodge above Walker Bay',
 'A world-class eco-destination set above the whale-watching capital of the world, with fynbos gardens and breathtaking ocean vistas.',
 6500, 4.9, 201,
 ARRAY['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'],
 ARRAY['Horse riding','Pool','Spa','Fynbos walks','WiFi','Restaurant'],
 true, 'lodge'),

('The Silo Hotel', 'the-silo-hotel', 'Cape Town', 'Western Cape',
 'Cape Town''s most iconic luxury address',
 'Perched atop the Zeitz Museum of Contemporary Art Africa in the historic V&A Waterfront, The Silo is a design landmark offering panoramic views.',
 9200, 4.8, 178,
 ARRAY['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'],
 ARRAY['Rooftop pool','Spa','Restaurant','Bar','Gym','WiFi','Concierge'],
 true, 'boutique'),

('Ellerman House', 'ellerman-house', 'Cape Town', 'Western Cape',
 'A private villa experience in Bantry Bay',
 'One of South Africa''s finest small luxury hotels, Ellerman House commands sweeping views of the Atlantic seaboard from its Bantry Bay position.',
 7800, 5.0, 94,
 ARRAY['https://images.unsplash.com/photo-1549294413-26f195200c16?w=800'],
 ARRAY['Pool','Wine cellar','Spa','Art collection','WiFi','Butler service'],
 true, 'boutique');
