-- ═══════════════════════════════════════════════════════════
--  09 · 메일 회신 수집
--
--  웰컴메일에 답장이 오면 Gmail 에만 쌓인다. 대시보드에서 보려면
--  DB 에 옮겨와야 한다. Apps Script 가 주기적으로 Gmail 을 읽어
--  이 테이블에 넣는다.
--
--  Supabase → SQL Editor 에 전체 붙여넣고 Run.
-- ═══════════════════════════════════════════════════════════

create table if not exists public.replies (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  received_at timestamptz,          -- 메일이 실제로 온 시각
  from_name   text,
  from_email  text,
  subject     text,
  body        text,                 -- 인용문 제거한 본문
  thread_id   text unique,          -- 같은 대화를 두 번 넣지 않기 위한 열쇠
  handled     boolean not null default false
);

create index if not exists replies_received on public.replies (received_at desc);

alter table public.replies enable row level security;

-- 익명은 넣기만. 읽기 정책이 없으므로 회신 내용은 외부에 안 보인다.
-- (Apps Script 는 공개키로 insert 만 한다)
drop policy if exists "anon can insert reply" on public.replies;
create policy "anon can insert reply"
  on public.replies for insert to anon with check (true);

-- 확인
select count(*) as 회신수 from public.replies;
