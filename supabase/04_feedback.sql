-- ─────────────────────────────────────────────
-- 피드백 수집 테이블
--  · 메일의 세 버튼이 여기로 들어옵니다
--  · SQL Editor 에 붙여넣고 Run
-- ─────────────────────────────────────────────

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind       text not null,          -- used | roadmap | ask
  used       text,                   -- 썼다 / 안 썼다 / 모르겠다
  message    text,                   -- 남긴 내용
  email      text,                   -- 선택 (누가 남겼는지 확인용)
  tool       text                    -- 어떤 도구에 대한 피드백인지
);

alter table public.feedback enable row level security;

-- 익명은 넣기만 가능. 읽기 정책이 없으므로 내용은 외부에 안 보입니다.
create policy "anon can insert feedback"
  on public.feedback for insert to anon with check (true);

-- 종류별 집계 (숫자만)
create or replace function public.stats_feedback()
returns table(kind text, cnt bigint)
language sql security definer set search_path = public as $$
  select kind, count(*) from public.feedback group by 1 order by 2 desc;
$$;

grant execute on function public.stats_feedback() to anon;

-- ─────────────────────────────────────────────
-- 확인 (SQL Editor 에서만 보입니다)
-- select * from public.feedback order by created_at desc;
-- ─────────────────────────────────────────────
