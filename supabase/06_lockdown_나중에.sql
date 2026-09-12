-- ⚠️⚠️⚠️  아직 실행하지 마세요  ⚠️⚠️⚠️
--
-- 이 파일은 anon(브라우저)의 signups INSERT 권한을 회수합니다.
-- 지금 index.html 의 신청 폼은 브라우저가 Supabase 에 직접 넣고 있으므로,
-- 이걸 먼저 실행하면 신청 폼이 그 자리에서 죽습니다.
--
-- 실행 순서:
--   1) Vercel 환경변수 설정 (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ADMIN_PASSWORD / SITE_URL)
--   2) index.html 의 폼을 /api/signup 으로 바꾸고 배포
--   3) 실제로 한 번 신청해서 들어오는지 확인
--   4) 그 다음에 이 파일 실행
-- ─────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════
--  002 · 잠그기 — 서버 API 동작 확인 후 실행
-- ═══════════════════════════════════════════════════════════

-- ① 공개 대시보드 집계에서 테스트 행 제외 (source 에 test 포함)
create or replace function public.signups_stats()
returns json language sql security definer set search_path = public as $$
  with w as (select *, coalesce(source,'') ilike '%test%' as is_test from public.signups)
  select json_build_object(
    'total', (select count(*) from w where not is_test),
    'today', (select count(*) from w where not is_test
              and created_at >= ((now() at time zone 'Asia/Tokyo')::date::timestamp at time zone 'Asia/Tokyo')),
    'week',  (select count(*) from w where not is_test and created_at >= now() - interval '7 days'),
    'by_source', (select coalesce(json_object_agg(s,c),'{}'::json) from
                  (select coalesce(nullif(source,''),'direct') as s, count(*) as c from w where not is_test group by 1) t),
    'daily', (select coalesce(json_agg(row_to_json(d) order by d.day),'[]'::json) from
              (select (created_at at time zone 'Asia/Tokyo')::date as day, count(*) as c from w where not is_test group by 1) d),
    'updated_at', now());
$$;

-- ② 방금 넣은 API 검증 데이터 삭제
delete from public.signups where source ilike '%test%' or email like 'verify-%@example.com';

-- ③ 브라우저(anon)의 직접 insert 를 막음 — 이제 /api/signup 만 씀
drop policy if exists "anon can insert" on public.signups;
revoke insert on public.signups from anon;

-- 확인: signups 에 남은 정책 수 (0 이면 성공)
select count(*) as remaining_policies from pg_policies where tablename = 'signups';
