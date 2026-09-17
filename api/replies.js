// 메일 회신 목록 — 어드민 전용.
const { db, json, requireAdmin, readBody } = require('./_lib');

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  if (req.method === 'POST') {           // 처리함/안함 토글
    const b = await readBody(req);
    if (!b.id) return json(res, 400, { error: 'id 필요' });
    const { error } = await db().from('replies')
      .update({ handled: b.handled === true }).eq('id', b.id);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { ok: true });
  }
  if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' });

  const { data, error } = await db().from('replies')
    .select('id,received_at,from_name,from_email,subject,body,handled')
    .order('received_at', { ascending: false }).limit(100);
  if (error) return json(res, 500, { error: error.message });

  const items = data || [];
  json(res, 200, {
    total: items.length,
    unhandled: items.filter(x => !x.handled).length,
    items,
  });
};
