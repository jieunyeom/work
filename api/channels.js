const { db, json, requireAdmin, readBody, slug } = require('./_lib');

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const sb = db();

  if (req.method === 'GET') {
    const { data, error } = await sb.from('mj_channels').select('*').order('sort').order('id');
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { channels: data });
  }

  if (req.method === 'POST') {
    const b = await readBody(req);
    const row = {
      code: slug(b.code), name: String(b.name || '').trim(),
      source: slug(b.source), medium: slug(b.medium),
      content_mode: ['none','serial','date','free'].includes(b.content_mode) ? b.content_mode : 'none',
      content_prefix: b.content_prefix ? slug(b.content_prefix) : null,
      note: b.note ? String(b.note).slice(0, 200) : null,
      sort: Number.isFinite(+b.sort) ? +b.sort : 99,
    };
    if (!row.code || !row.name || !row.source || !row.medium) return json(res, 400, { error: 'code, name, source, medium 필수' });
    const { data, error } = await sb.from('mj_channels').insert(row).select().single();
    if (error) return json(res, error.code === '23505' ? 409 : 500, { error: error.message });
    return json(res, 201, { channel: data });
  }

  if (req.method === 'PATCH') {
    const b = await readBody(req);
    if (!b.id) return json(res, 400, { error: 'id 필수' });
    const patch = {};
    if ('active' in b) patch.active = !!b.active;
    if ('name' in b) patch.name = String(b.name).trim();
    if ('note' in b) patch.note = b.note ? String(b.note).slice(0, 200) : null;
    if ('sort' in b) patch.sort = +b.sort;
    if ('content_mode' in b) patch.content_mode = b.content_mode;
    if ('content_prefix' in b) patch.content_prefix = b.content_prefix ? slug(b.content_prefix) : null;
    const { data, error } = await sb.from('mj_channels').update(patch).eq('id', b.id).select().single();
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { channel: data });
  }

  json(res, 405, { error: 'method not allowed' });
};
