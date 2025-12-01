-- Enable RLS
alter table auth.users enable row level security;

-- Create imports table
create table public.imports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  filename text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.imports enable row level security;

create policy "Users can view their own imports"
  on public.imports for select
  using (auth.uid() = user_id);

create policy "Users can insert their own imports"
  on public.imports for insert
  with check (auth.uid() = user_id);

-- Create service_orders table
create table public.service_orders (
  id uuid default gen_random_uuid() primary key,
  import_id uuid references public.imports(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  
  -- CSV Columns (Mapped)
  os_number text,
  opening_date timestamp with time zone,
  closing_date timestamp with time zone,
  status text,
  product text,
  product_code text,
  serial_number text,
  defect text,
  solution text,
  technician text,
  customer_name text,
  customer_city text,
  customer_state text,
  reseller text,
  
  -- Raw JSON for flexibility
  raw_data jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.service_orders enable row level security;

create policy "Users can view their own service orders"
  on public.service_orders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own service orders"
  on public.service_orders for insert
  with check (auth.uid() = user_id);
