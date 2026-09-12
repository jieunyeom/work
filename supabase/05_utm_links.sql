-- ═══════════════════════════════════════════════════════════
--  001 · UTM 링크 장부 + 클릭 집계
--  Supabase → SQL Editor 에 붙여넣고 Run
--  참고: 테이블/함수 접두사 mj_ 는 프로젝트에 맞게 원하는 접두사로 바꿔 써도 됩니다.
--  참고: 리드 테이블 이름이 다르면 signups를 바꿔 쓰세요
-- ═══════════════════════════════════════════════════════════

-- ── 채널 ─────────────────────────────────────────────
create table if not exists public.mj_channels (
  id             bigint generated always as identity primary key,
  code           text not null unique,
  name           text not null,
  source         text not null,
  medium         text not null,
  content_mode   text not null default 'none'
                 check (content_mode in ('none','serial','date','free')),
  content_prefix text,
  note           text,
  sort           int  not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ── 링크 장부 ────────────────────────────────────────
create table if not exists public.mj_links (
  id              bigint generated always as identity primary key,
  channel_id      bigint references public.mj_channels(id) on delete set null,
  landing_path    text not null default '/',
  source          text not null,
  medium          text not null,
  campaign        text not null,
  content         text,
  term            text,
  url             text not null,
  short_code      text not null unique,
  label           text,
  created_by      text,
  clicks          bigint not null default 0,
  last_clicked_at timestamptz,
  archived        boolean not null default false,
  created_at      timestamptz not null default now()
);

-- 같은 UTM 조합은 한 번만
create unique index if not exists mj_links_combo
  on public.mj_links (landing_path, source, medium, campaign,
                      coalesce(content,''), coalesce(term,''));

-- ── 클릭 로그 ────────────────────────────────────────
create table if not exists public.mj_clicks (
  id           bigint generated always as identity primary key,
  link_id      bigint not null references public.mj_links(id) on delete cascade,
  clicked_at   timestamptz not null default now(),
  device       text check (device in ('mobile','desktop','other')),
  referer_host text
);
create index if not exists mj_clicks_link_time on public.mj_clicks (link_id, clicked_at);

-- ── 클릭 1 증가 + 로그를 한 트랜잭션에서 ──────────────
create or replace function public.mj_register_click(
  p_code text, p_device text, p_referer text, p_count boolean default true
) returns table(url text)
language plpgsql
security definer
set search_path = public
as $$
declare v_id bigint; v_url text;
begin
  if p_count then
    update public.mj_links
       set clicks = clicks + 1, last_clicked_at = now()
     where short_code = p_code and archived = false
    returning id, mj_links.url into v_id, v_url;
  else
    select id, mj_links.url into v_id, v_url
      from public.mj_links where short_code = p_code and archived = false;
  end if;

  if v_id is null then return; end if;
  if p_count then
    insert into public.mj_clicks(link_id, device, referer_host)
    values (v_id, p_device, nullif(p_referer,''));
  end if;
  return query select v_url;
end $$;

-- ── 전환 테이블: 컬럼 추가만 (파괴적 변경 없음) ────────
alter table public.signups add column if not exists utm_source      text;
alter table public.signups add column if not exists utm_medium      text;
alter table public.signups add column if not exists utm_campaign    text;
alter table public.signups add column if not exists utm_content     text;
alter table public.signups add column if not exists utm_term        text;
alter table public.signups add column if not exists consent_at      timestamptz;
alter table public.signups add column if not exists consent_version text;
alter table public.signups add column if not exists ip_hash         text;

-- ── RLS: 새 테이블은 서버(service_role)만 ─────────────
alter table public.mj_channels enable row level security;
alter table public.mj_links    enable row level security;
alter table public.mj_clicks   enable row level security;
-- 정책을 하나도 만들지 않습니다 → anon/authenticated 는 아무것도 못 합니다.

revoke all on public.mj_channels from anon, authenticated;
revoke all on public.mj_links    from anon, authenticated;
revoke all on public.mj_clicks   from anon, authenticated;
revoke all on function public.mj_register_click(text,text,text,boolean) from public, anon, authenticated;

-- ── 채널 초기값 (예시 — 프로젝트에 맞게 수정해서 쓰세요) ──
insert into public.mj_channels (code,name,source,medium,content_mode,content_prefix,sort,note) values
  ('ig_bio',   '인스타그램 프로필',   'instagram', 'profile', 'none',   null,   10, '프로필 링크 1곳'),
  ('ig_story', '인스타그램 스토리',   'instagram', 'story',   'date',   null,   20, '날짜별 소재'),
  ('ig_post',  '인스타그램 게시물',   'instagram', 'post',    'serial', 'post', 30, '게시물 순번'),
  ('popup',    '팝업 스토어 QR',      'popup',     'qr',      'none',   null,   40, '오프라인 행사장 QR'),
  ('card',     '동봉 카드',           'card',      'print',   'none',   null,   50, '배송 상자에 동봉'),
  ('social',   'SNS (개인 계정)',     'social',    'social',  'date',   null,   60, '운영자 개인 SNS 계정')
on conflict (code) do nothing;
