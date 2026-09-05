-- ─────────────────────────────────────────────
-- 이커머스 도구 8개 · 신청 테이블
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 [Run]
-- ─────────────────────────────────────────────

-- 1) 신청 테이블
create table if not exists public.signups (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  name           text not null,
  phone          text not null,
  email          text not null,
  task           text,                       -- 지금 제일 손이 많이 가는 업무
  company        text,                       -- 회사 · 직무 (선택)
  agree_privacy  boolean not null default false,
  agree_news     boolean not null default false,
  source         text                        -- 유입 경로 (utm 등)
);

-- 2) RLS 켜기
alter table public.signups enable row level security;

-- 3) 익명 사용자는 "넣기만" 가능
--    select 정책을 만들지 않으므로 아무도 명단을 읽을 수 없습니다.
drop policy if exists "anon can insert" on public.signups;
create policy "anon can insert"
  on public.signups
  for insert
  to anon
  with check (true);

-- 4) 잔여 자리 계산 함수
--    행 수만 세서 돌려줍니다. 명단은 노출되지 않습니다.
create or replace function public.seats_left()
returns int
language sql
security definer
set search_path = public
as $$
  select greatest(0, 10 - (select count(*)::int from public.signups));
$$;

grant execute on function public.seats_left() to anon;

-- ─────────────────────────────────────────────
-- 확인용 (SQL Editor 에서만 보입니다)
-- select count(*) from public.signups;
-- select * from public.signups order by created_at desc;
-- ─────────────────────────────────────────────
