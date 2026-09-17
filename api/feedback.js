// 피드백 목록 — 어드민 전용. 서버(service_role)만 DB 를 만진다.
const { db, json, requireAdmin } = require('./_lib');

const KIND_LABEL = { used: '써봤어요', ask: '이 업무도 되나요', roadmap: '로드맵' };

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' });

  const q = req.query || {};
  const limit = Math.min(200, Math.max(1, parseInt(q.limit, 10) || 100));

  let sel = db().from('feedback')
    .select('id,created_at,kind,used,message,email,tool')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (q.from) sel = sel.gte('created_at', new Date(q.from).toISOString());
  if (q.to) {
    const to = new Date(q.to); to.setHours(23, 59, 59, 999);
    sel = sel.lte('created_at', to.toISOString());
  }

  const { data, error } = await sel;
  if (error) return json(res, 500, { error: error.message });

  const rows = (data || []).filter(r =>
    !(r.email && /@example\.com$/i.test(r.email)) &&            // 검증용 제외
    !(r.message && /^zz/i.test(r.message))
  );

  // 요약 — 내용을 안 열어봐도 흐름이 보이게
  const by_kind = {}, by_used = {};
  rows.forEach(r => {
    by_kind[r.kind || '기타'] = (by_kind[r.kind || '기타'] || 0) + 1;
    if (r.used) by_used[r.used] = (by_used[r.used] || 0) + 1;
  });

  json(res, 200, {
    total: rows.length,
    with_message: rows.filter(r => r.message && r.message.trim()).length,
    by_kind, by_used,
    labels: KIND_LABEL,
    items: rows,
  });
};
