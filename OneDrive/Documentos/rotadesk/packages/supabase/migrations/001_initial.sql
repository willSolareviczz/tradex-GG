-- Habilitar extensões
create extension if not exists "uuid-ossp";
create extension if not exists "unaccent";

-- Tabela de operadoras (empresas clientes do SaaS)
create table operadoras (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  nome text not null,
  email text not null unique,
  plano text not null default 'free' check (plano in ('free', 'starter', 'pro')),
  pacotes_mes integer not null default 0,
  stripe_customer_id text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Tabela de entregadores
create table entregadores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  operadora_id uuid references operadoras(id) on delete cascade not null,
  nome text not null,
  telefone text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Tabela de rotas
create table rotas (
  id uuid primary key default uuid_generate_v4(),
  operadora_id uuid references operadoras(id) on delete cascade not null,
  entregador_id uuid references entregadores(id) on delete set null,
  data date not null,
  status text not null default 'ativa' check (status in ('ativa', 'concluida')),
  criado_em timestamptz not null default now()
);

-- Tabela de pacotes
create table pacotes (
  id uuid primary key default uuid_generate_v4(),
  operadora_id uuid references operadoras(id) on delete cascade not null,
  rota_id uuid references rotas(id) on delete set null,
  entregador_id uuid references entregadores(id) on delete set null,
  codigo_rastreio text,
  destinatario_nome text not null,
  destinatario_telefone text,
  destinatario_endereco text not null,
  destinatario_lat double precision,
  destinatario_lng double precision,
  status text not null default 'pendente'
    check (status in ('pendente', 'em_rota', 'entregue', 'falhou')),
  motivo_falha text,
  foto_comprovante_url text,
  ordem_rota integer,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Índices
create index pacotes_operadora_id_idx on pacotes(operadora_id);
create index pacotes_rota_id_idx on pacotes(rota_id);
create index pacotes_status_idx on pacotes(status);
create index rotas_operadora_data_idx on rotas(operadora_id, data);

-- Trigger para atualizar atualizado_em
create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger operadoras_atualizado_em
  before update on operadoras
  for each row execute function set_atualizado_em();

create trigger pacotes_atualizado_em
  before update on pacotes
  for each row execute function set_atualizado_em();

-- RLS (Row Level Security)
alter table operadoras enable row level security;
alter table entregadores enable row level security;
alter table rotas enable row level security;
alter table pacotes enable row level security;

-- Políticas: operadora só vê seus próprios dados
create policy "operadora_select_own" on operadoras
  for select using (auth.uid() = user_id);

create policy "operadora_update_own" on operadoras
  for update using (auth.uid() = user_id);

create policy "entregadores_operadora_crud" on entregadores
  for all using (
    operadora_id in (
      select id from operadoras where user_id = auth.uid()
    )
  );

create policy "rotas_operadora_crud" on rotas
  for all using (
    operadora_id in (
      select id from operadoras where user_id = auth.uid()
    )
  );

create policy "pacotes_operadora_crud" on pacotes
  for all using (
    operadora_id in (
      select id from operadoras where user_id = auth.uid()
    )
  );

-- Política para entregadores verem seus próprios pacotes
create policy "pacotes_entregador_select" on pacotes
  for select using (
    entregador_id in (
      select id from entregadores where user_id = auth.uid()
    )
  );

create policy "pacotes_entregador_update" on pacotes
  for update using (
    entregador_id in (
      select id from entregadores where user_id = auth.uid()
    )
  );
