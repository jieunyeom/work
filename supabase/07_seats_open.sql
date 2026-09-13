-- ═══════════════════════════════════════════════════════════
--  07 · 인원 제한 해제
--
--  seats_left() 가 항상 여유 있는 값을 돌려주게 한다.
--  → 상단바가 "마감"으로 바뀌지 않고 계속 "신청 받는 중" 으로 뜬다.
--  → 기존 신청 데이터는 하나도 건드리지 않는다.
--
--  전체를 복사해 SQL Editor 에 붙여넣고 Run.
-- ═══════════════════════════════════════════════════════════

create or replace function public.seats_left()
returns int
language sql
security definer
set search_path = public
as $$
  select 999;   -- 제한 없음
$$;

-- 확인 (999 가 나오면 해제된 것)
select public.seats_left() as 남은_자리;


-- ───────────────────────────────────────────────
-- 나중에 다시 제한을 걸고 싶을 때
-- 아래 주석을 풀어 실행하면 원래대로 돌아갑니다.
-- 숫자 10 을 원하는 정원으로 바꾸면 됩니다.
-- 테스트로 넣은 행은 세지 않습니다.
-- ───────────────────────────────────────────────
-- create or replace function public.seats_left()
-- returns int
-- language sql
-- security definer
-- set search_path = public
-- as $$
--   select greatest(0, 10 - (
--     select count(*)::int
--     from public.signups
--     where coalesce(source,'') not ilike '%test%'
--       and email not ilike '%@example.com'
--       and email not ilike '%test%'
--       and coalesce(name,'') not ilike '%test%'
--       and email <> 'todo1nothing@gmail.com'
--   ));
-- $$;
