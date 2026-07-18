-- ============================================================
-- 顧客管理（CRMライト）
-- 既存の customers テーブル(0行)に不足列を追加し、
-- inquiries.customer_id で見積依頼を紐付ける。ブロック用に blocked_domains も追加。
-- ============================================================

-- 既存 customers に不足列を追加（notes は社内メモとして流用）
alter table public.customers
  add column if not exists is_blocked boolean not null default false,
  add column if not exists blocked_reason text,
  add column if not exists inquiry_count integer not null default 0,
  add column if not exists last_inquiry_at timestamptz;

create index if not exists customers_last_inquiry_idx
  on public.customers (last_inquiry_at desc nulls last);

-- email を lowercase 正規化 + 一意制約（upsert/名寄せ用・既存0行なので安全）
update public.customers set email = lower(btrim(email)) where email is not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.customers'::regclass and contype = 'u'
      and conname = 'customers_email_uniq'
  ) then
    alter table public.customers add constraint customers_email_uniq unique (email);
  end if;
end $$;

-- ブロックするドメイン（例: sales-spam.co.jp）
create table if not exists public.blocked_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  reason text,
  created_at timestamptz not null default now()
);

-- RLS: 管理(service_role)のみ。公開サイトからは不可
alter table public.customers enable row level security;
alter table public.blocked_domains enable row level security;

-- 既存 inquiries から顧客をバックフィル（メール小文字で名寄せ）
insert into public.customers (email, company_name, contact_name, phone, last_inquiry_at, inquiry_count, created_at)
select
  lower(btrim(email)),
  (array_agg(company_name order by created_at desc))[1],
  (array_agg(contact_name order by created_at desc))[1],
  (array_agg(phone order by created_at desc))[1],
  max(created_at),
  count(*)::int,
  min(created_at)
from public.inquiries
where email is not null and btrim(email) <> ''
group by lower(btrim(email))
on conflict (email) do nothing;

-- inquiries を顧客に連結
update public.inquiries i
set customer_id = c.id
from public.customers c
where lower(btrim(i.email)) = c.email and i.customer_id is null;

-- inquiries.status に archived を許可（アーカイブ機能のため）
alter table public.inquiries drop constraint if exists inquiries_status_check;
alter table public.inquiries add constraint inquiries_status_check
  check (status in ('new','in_progress','quoted','completed','cancelled','archived'));
