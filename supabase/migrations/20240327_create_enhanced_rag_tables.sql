-- Enable vector extension
create extension if not exists vector;

-- Page content table
create table page_content (
  id uuid primary key default uuid_generate_v4(),
  page_id text not null,
  content text not null,
  post_type text not null,
  topic text,
  engagement_metrics jsonb,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Products table
create table products (
  id uuid primary key default uuid_generate_v4(),
  page_id text not null,
  name text not null,
  description text,
  price numeric,
  images text[],
  category text,
  attributes jsonb,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Page context table
create table page_context (
  page_id text primary key,
  name text not null,
  style jsonb,
  topics jsonb,
  post_types jsonb,
  updated_at timestamptz default now()
);

-- Indexes
create index on page_content using gin (embedding vector_ops);
create index on products using gin (embedding vector_ops);
create index on page_content (page_id, post_type);
create index on products (page_id, category); 