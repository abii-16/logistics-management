create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text unique not null,
  village text,
  preferred_language text default 'ta',
  role text not null check (role in ('farmer', 'driver', 'admin')),
  created_at timestamptz default now()
);

create table if not exists farmers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  village text not null,
  preferred_language text default 'ta',
  created_at timestamptz default now()
);

create table if not exists drivers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  vehicle_number text not null,
  vehicle_type text not null,
  license_number text not null,
  reliability_score integer default 90,
  completed_trips integer default 0,
  rating numeric default 4.5,
  created_at timestamptz default now()
);

create table if not exists orders (
  id text primary key,
  farmer_id uuid references users(id) on delete set null,
  farmer_name text not null,
  phone text not null,
  village text not null,
  crop text not null,
  weight_kg integer not null check (weight_kg > 0),
  destination text not null,
  status text not null default 'Pending',
  individual_cost integer default 0,
  shared_cost integer default 0,
  pickup_time text,
  lat float,
  lng float,
  cluster_id text,
  cluster_slot timestamptz,
  created_at timestamptz default now()
);

create table if not exists bundles (
  id text primary key,
  destination text not null,
  total_weight_kg integer not null,
  truck_utilization integer not null,
  estimated_savings integer not null,
  spoilage_risk text not null,
  suggested_departure_time text not null,
  created_at timestamptz default now()
);

create table if not exists bundle_orders (
  bundle_id text references bundles(id) on delete cascade,
  order_id text references orders(id) on delete cascade,
  primary key (bundle_id, order_id)
);

create table if not exists vehicles (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid references drivers(id) on delete cascade,
  vehicle_number text not null,
  vehicle_type text not null,
  capacity_kg integer default 1100
);

create table if not exists bids (
  id text primary key,
  bundle_id text references bundles(id) on delete cascade,
  driver_id uuid references drivers(id) on delete set null,
  driver_name text not null,
  vehicle text not null,
  amount integer not null,
  reliability_score integer not null,
  status text not null default 'Open',
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  phone text not null,
  channel text not null check (channel in ('sms', 'voice')),
  message text not null,
  status text not null default 'queued',
  created_at timestamptz default now()
);

create table if not exists ai_logs (
  id uuid primary key default uuid_generate_v4(),
  transcript text not null,
  extracted_entities jsonb not null,
  confidence_scores jsonb not null,
  model_name text default 'demo-rule-extractor',
  created_at timestamptz default now()
);

create table if not exists savings_analytics (
  id uuid primary key default uuid_generate_v4(),
  total_farmers_served integer not null,
  total_savings_generated integer not null,
  total_weight_transported integer not null,
  created_at timestamptz default now()
);

