-- ─────────────────────────────────────────────
-- 수집 항목 최소화
--  · 휴대폰 번호 수집 중단 → 기존 값도 파기
--  · SQL Editor 에 붙여넣고 Run
-- ─────────────────────────────────────────────

-- 1) 기존에 받은 휴대폰 번호 파기
update public.signups set phone = null;

-- 2) 앞으로 안 받으므로 필수 제약 해제
alter table public.signups alter column phone drop not null;

-- 확인
-- select id, name, email, phone, created_at from public.signups order by created_at desc;
