// CRM 보드 — 가두리망에 누가 들어와 있고 어디까지 갔는지.
// 어드민 키로만 열린다. 서버(service_role)만 DB 를 만진다.
const { db, json, requireAdmin, readBody } = require('./_lib');

const TOTAL_WEEKS = 8;
const STATUS = ['active', 'paused', 'stopped', 'done'];

function isTest(r) {
  return /test/i.test(r.source || '')
    || /@example\.com$/i.test(r.email || '')
    || /^zz/i.test(r.name || '');
}

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  /* ── 진행 상태 바꾸기 ── */
  if (req.method === 'POST') {
    const b = await readBody(req);
    if (!b.id) return json(res, 400, { error: 'id 필요' });

    const patch = {};
    if (b.sent_week != null) {
      const w = Math.max(0, Math.min(TOTAL_WEEKS, parseInt(b.sent_week, 10) || 0));
      patch.sent_week = w;
      patch.last_sent_at = w > 0 ? new Date().toISOString() : null;
      if (w >= TOTAL_WEEKS) patch.status = 'done';
    }
    if (b.status != null) {
      if (!STATUS.includes(b.status)) return json(res, 400, { error: '알 수 없는 상태' });
      patch.status = b.status;
    }
    if (b.memo != null) patch.memo = String(b.memo).slice(0, 500);
    if (!Object.keys(patch).length) return json(res, 400, { error: '바꿀 내용이 없습니다' });

    const { error } = await db().from('signups').update(patch).eq('id', b.id);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { ok: true, patch });
  }

  if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' });

  /* ── 목록 ── */
  const [people, fb] = await Promise.all([
    db().from('signups')
      .select('id,created_at,name,email,task,company,source,utm_source,utm_medium,utm_content,agree_news,sent_week,last_sent_at,status,memo')
      .order('created_at', { ascending: false }).limit(500),
    db().from('feedback').select('email,kind,used,message,created_at').limit(500),
  ]);
  if (people.error) return json(res, 500, { error: people.error.message });

  const rows = (people.data || []).filter(r => !isTest(r));
  const fbBy = {};
  (fb.data || []).forEach(f => {
    if (!f.email) return;
    const k = f.email.toLowerCase();
    (fbBy[k] = fbBy[k] || []).push(f);
  });

  const items = rows.map(r => {
    const mine = fbBy[(r.email || '').toLowerCase()] || [];
    return {
      ...r,
      feedback_count: mine.length,
      feedback_last: mine.length ? mine[mine.length - 1].message : null,
      used: mine.map(m => m.used).filter(Boolean).pop() || null,
      // 다음에 뭘 보내야 하는지 — 이 보드의 존재 이유
      next_week: r.status === 'active' && r.sent_week < TOTAL_WEEKS ? r.sent_week + 1 : null,
    };
  });

  const due = items.filter(i => i.next_week);
  const summary = {
    total: items.length,
    active: items.filter(i => i.status === 'active').length,
    paused: items.filter(i => i.status === 'paused').length,
    stopped: items.filter(i => i.status === 'stopped').length,
    done: items.filter(i => i.status === 'done').length,
    due: due.length,
    with_feedback: items.filter(i => i.feedback_count > 0).length,
    news_ok: items.filter(i => i.agree_news).length,
  };

  // 주차별로 몇 명이 걸려 있는지 — 깔때기
  const by_week = {};
  for (let w = 0; w <= TOTAL_WEEKS; w++) by_week[w] = items.filter(i => i.sent_week === w).length;

  json(res, 200, { total_weeks: TOTAL_WEEKS, summary, by_week, items });
};
