-- ═══════════════════════════════════════════════════════════
--  08 · CRM 보드용 컬럼
--
--  지금 signups 에는 "이 사람에게 몇 주차까지 보냈나"를 적을 칸이
--  없다. 발송 진행과 상태를 기록할 수 있게 컬럼만 더한다.
--  기존 데이터는 건드리지 않는다. 전부 add column if not exists.
--
--  Supabase → SQL Editor 에 전체 붙여넣고 Run.
-- ═══════════════════════════════════════════════════════════

alter table public.signups add column if not exists sent_week   int  not null default 0;
  -- 마지막으로 보낸 주차. 0 = 아직 아무것도 안 보냄, 1 = 1주차까지 보냄
alter table public.signups add column if not exists last_sent_at timestamptz;
alter table public.signups add column if not exists status      text not null default 'active';
  -- active(진행중) / paused(잠시 멈춤) / stopped(수신 거부) / done(8주 완주)
alter table public.signups add column if not exists memo        text;
  -- 운영 메모. 이 사람에 대해 기억할 것

-- 신청하면 1주차는 즉시 발송되므로, 기존 신청자는 1주차까지 보낸 것으로 본다.
-- (검증용 행은 제외)
update public.signups
   set sent_week = 1,
       last_sent_at = coalesce(last_sent_at, created_at)
 where sent_week = 0
   and coalesce(source,'') not ilike '%test%'
   and email not ilike '%@example.com';

-- 상태 값이 엉뚱하게 들어가지 않게
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'signups_status_chk') then
    alter table public.signups
      add constraint signups_status_chk
      check (status in ('active','paused','stopped','done'));
  end if;
end $$;

-- 확인
select status, count(*) , max(sent_week) as 최대주차
from public.signups group by status;
