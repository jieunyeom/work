-- ─────────────────────────────────────────────
-- 유입 경로(UTM) 저장 + 집계
-- SQL Editor 에 붙여넣고 Run
-- ─────────────────────────────────────────────

-- 1) 컬럼 추가
alter table public.signups
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content  text,
  add column if not exists referrer     text,
  add column if not exists landing      text;

-- 2) 채널별 집계 (명단은 안 보이고 숫자만)
create or replace function public.stats_by_source()
returns table(source text, medium text, content text, cnt bigint)
language sql security definer set search_path = public as $$
  select
    coalesce(utm_source,'(direct)')  as source,
    coalesce(utm_medium,'-')         as medium,
    coalesce(utm_content,'-')        as content,
    count(*)                         as cnt
  from public.signups
  group by 1,2,3
  order by cnt desc;
$$;

-- 3) 고민(업무) 유형 분류 — 적어주신 텍스트를 키워드로 묶습니다
create or replace function public.stats_by_topic()
returns table(topic text, cnt bigint)
language sql security definer set search_path = public as $$
  select
    case
      when task ~* '배너|이미지|조판|디자인'        then '배너·이미지'
      when task ~* '상세|페이지|html|코드'          then '상세페이지'
      when task ~* '주문|erp|출고|송장|재고|정산'   then '주문·ERP'
      when task ~* '광고|소재|매체|utm|링크|추적'   then '광고 운영'
      when task ~* '보고|리포트|분석|지표|성과|집계' then '분석·보고'
      when task ~* 'cs|문의|리뷰|응대|crm'          then 'CS·CRM'
      when task ~* '가격|쿠폰|할인|마진|수익'       then '가격·프로모션'
      when task is null or btrim(task)='' then '(미기재)'
      else '기타'
    end as topic,
    count(*) as cnt
  from public.signups
  group by 1
  order by cnt desc;
$$;

-- 4) 일자별 신청 수
create or replace function public.stats_by_day()
returns table(day date, cnt bigint)
language sql security definer set search_path = public as $$
  select (created_at at time zone 'Asia/Seoul')::date as day, count(*)
  from public.signups group by 1 order by 1 desc;
$$;

grant execute on function public.stats_by_source() to anon;
grant execute on function public.stats_by_topic()  to anon;
grant execute on function public.stats_by_day()    to anon;

-- ─────────────────────────────────────────────
-- 확인용
-- select * from public.stats_by_source();
-- select * from public.stats_by_topic();
-- select * from public.stats_by_day();
-- ─────────────────────────────────────────────
