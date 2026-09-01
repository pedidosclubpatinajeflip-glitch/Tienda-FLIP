-- Esquema para la tienda del Club Patinaje Flip
-- Cómo usarlo: en tu proyecto de Supabase, ve a "SQL Editor" -> "New query",
-- pega todo este archivo y dale a "Run".

create extension if not exists "pgcrypto";

-- Listado de patinadores (se sube/actualiza desde el Excel de Klubber
-- en la página de administración de la web)
create table if not exists patinadores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  grupo text,
  tutor text,
  email text,
  actualizado_en timestamptz not null default now()
);

create index if not exists patinadores_nombre_idx on patinadores (nombre);

-- Cuentas de padres/tutores (login de la tienda). Cada cuenta puede estar
-- vinculada a uno o varios patinadores (hermanos en el club).
create table if not exists padres (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  patinadores jsonb not null,   -- [{ "nombre": "...", "grupo": "..." }, ...]
  sesion_token text,
  creado_en timestamptz not null default now()
);

create index if not exists padres_email_idx on padres (lower(email));
create index if not exists padres_sesion_idx on padres (sesion_token);

-- Pedidos de material
create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  patinador text not null,
  grupo text,
  contacto text,
  items jsonb not null,        -- lista de artículos pedidos (nombre, talla, color, personalización, cantidad, precio)
  total numeric(10, 2) not null,
  estado text not null default 'pendiente',  -- pendiente | pagado | cancelado
  stripe_session_id text,
  stripe_payment_intent text,
  pagado_en timestamptz
);

create index if not exists pedidos_estado_idx on pedidos (estado);
create index if not exists pedidos_patinador_idx on pedidos (patinador);

-- Nota: esta app accede a estas tablas solo desde el servidor con la
-- Service Role Key, así que no hace falta configurar Row Level Security
-- para que funcione. Si en el futuro quieres leer estas tablas
-- directamente desde el navegador (p.ej. con la clave anon), activa RLS
-- y añade políticas antes de hacerlo.
