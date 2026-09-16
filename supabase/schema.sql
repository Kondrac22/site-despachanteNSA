-- 1. Criação da tabela de Unidades (Units)
create table if not exists public.units (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Criação da tabela de Perfis (Profiles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  role text default 'user' check (role in ('admin', 'user')),
  unit_id uuid references public.units(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habilitar a segurança RLS (Row Level Security)
alter table public.units enable row level security;
alter table public.profiles enable row level security;

-- 4. Inserção da unidade 'Matriz'
insert into public.units (name) values ('Matriz');

-- 5. Inserção ou atualização do usuário administrador
insert into public.profiles (id, name, email, role, unit_id)
values (
  '02df5d49-abac-4589-8b86-5821d7b353d8',
  'leonardo yamanishi ferreira',
  'leonardo.yferreira@nsadespa.com',
  'admin',
  (select id from public.units where name = 'Matriz' limit 1)
)
on conflict (id) do update 
set name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    unit_id = excluded.unit_id;