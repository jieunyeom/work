-- ═══════════════════════════════════════════════════════════
--  07 · 잔여 자리 계산 정상화
--
--  검증용으로 넣은 행 때문에 seats_left() 가 0 이 되었다.
--  ① 무엇이 들어있는지 먼저 눈으로 본다
--  ② 테스트 행만 골라 지운다
--  ③ 앞으로는 테스트 행을 세지 않도록 함수를 고친다
--
--  ①부터 한 덩어리씩 실행하세요. 한 번에 전체 Run 하지 마세요.
-- ═══════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────
-- ① 먼저 확인 — 무엇이 들어있나
--    이메일을 가려서 봅니다. 진짜 신청자인지 판단만 하세요.
-- ───────────────────────────────────────────────
select
  id,
  created_at,
  name,
  left(email, 3) || '***@' || split_part(email, '@', 2) as email_masked,
  coalesce(source, '(direct)') as source,
  case
    when coalesce(source,'') ilike '%test%'          then '테스트로 보임'
    when email ilike '%@example.com'                  then '테스트로 보임'
    when email ilike '%test%'                         then '테스트로 보임'
    when name  ilike '%test%' or name ilike 'zz%'     then '테스트로 보임'
    when email = 'todo1nothing@gmail.com'             then '본인 계정'
    else '실제 신청자로 보임'
  end as 판정
from public.signups
order by created_at;


-- ───────────────────────────────────────────────
-- ② 확인한 뒤 지우기
--    위에서 '테스트로 보임' / '본인 계정' 으로 나온 것만 지웁니다.
--    지우기 전에 몇 건이 지워질지 먼저 세어보세요.
-- ───────────────────────────────────────────────

-- ②-1 몇 건이 지워질지 세기 (지우지 않음)
select count(*) as 지워질_건수
from public.signups
where coalesce(source,'') ilike '%test%'
   or email ilike '%@example.com'
   or email ilike '%test%'
   or name  ilike '%test%'
   or name  ilike 'zz%'
   or email = 'todo1nothing@gmail.com';

-- ②-2 숫자를 확인했으면 이 줄을 실행
-- delete from public.signups
-- where coalesce(source,'') ilike '%test%'
--    or email ilike '%@example.com'
--    or email ilike '%test%'
--    or name  ilike '%test%'
--    or name  ilike 'zz%'
--    or email = 'todo1nothing@gmail.com';


-- ───────────────────────────────────────────────
-- ③ 앞으로 테스트 행을 세지 않도록 함수 교체
--    이제 테스트를 해도 잔여 자리가 줄지 않습니다.
--    정원은 아래 TOTAL 한 곳에서만 바꾸면 됩니다.
-- ───────────────────────────────────────────────
create or replace function public.seats_left()
returns int
language sql
security definer
set search_path = public
as $$
  select greatest(0, 10 - (
    select count(*)::int
    from public.signups
    where coalesce(source,'') not ilike '%test%'
      and email not ilike '%@example.com'
      and email not ilike '%test%'
      and coalesce(name,'') not ilike '%test%'
      and coalesce(name,'') not ilike 'zz%'
      and email <> 'todo1nothing@gmail.com'
  ));
$$;

-- 확인
select public.seats_left() as 남은_자리;
