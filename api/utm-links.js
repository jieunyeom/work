const { db, json, requireAdmin, readBody, slug, shortCode } = require('./_lib');

const SITE = process.env.SITE_URL || 'https://example.vercel.app';

function buildUrl(landing, u) {
  const url = new URL(landing.startsWith('http') ? landing : SITE + landing);
  url.searchParams.set('utm_source', u.source);
  url.searchParams.set('utm_medium', u.medium);
  url.searchParams.set('utm_campaign', u.campaign);
  if (u.content) url.searchParams.set('utm_content', u.content);
  if (u.term) url.searchParams.set('utm_term', u.term);
  return url.toString();
}

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const sb = db();

  if (req.method === 'GET') {
    const showArchived = (req.query && req.query.archived === '1');
    let q = sb.from('mj_links').select('*, mj_channels(code,name)').order('created_at', { ascending: false });
    if (!showArchived) q = q.eq('archived', false);
    const { data, error } = await q;
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { links: data.map(l => ({ ...l, short_url: `${SITE}/l/${l.short_code}` })) });
  }

  if (req.method === 'POST') {
    const b = await readBody(req);
    const items = Array.isArray(b.items) ? b.items : [b];
    const out = [];
    for (const it of items) {
      const u = {
        landing_path: it.landing_path && String(it.landing_path).startsWith('/') ? it.landing_path : '/',
        source: slug(it.source), medium: slug(it.medium), campaign: slug(it.campaign),
        content: it.content ? slug(it.content) : null, term: it.term ? slug(it.term) : null,
        label: it.label ? String(it.label).slice(0, 120) : null,
        channel_id: it.channel_id || null, created_by: it.created_by ? String(it.created_by).slice(0, 60) : null,
      };
      if (!u.source || !u.medium || !u.campaign) { out.push({ error: 'source/medium/campaign 필수', input: it }); continue; }
      // 같은 조합은 한 번만: 기존 링크 반환
      let q = sb.from('mj_links').select('*').eq('landing_path', u.landing_path).eq('source', u.source).eq('medium', u.medium).eq('campaign', u.campaign);
      q = u.content ? q.eq('content', u.content) : q.is('content', null);
      q = u.term ? q.eq('term', u.term) : q.is('term', null);
      const { data: ex } = await q.maybeSingle();
      if (ex) { out.push({ ...ex, short_url: `${SITE}/l/${ex.short_code}`, existed: true }); continue; }

      u.url = buildUrl(u.landing_path, u);
      let created = null, err = null;
      for (let i = 0; i < 5 && !created; i++) {
        u.short_code = shortCode(6);
        const r = await sb.from('mj_links').insert(u).select().single();
        if (!r.error) created = r.data; else if (r.error.code !== '23505') { err = r.error; break; }
        else if (/short_code/.test(r.error.message)) continue; // 코드 충돌 → 재시도
        else { // 조합 충돌(동시 생성) → 기존 반환
          const { data: ex2 } = await q.maybeSingle(); if (ex2) { created = ex2; created.existed = true; } break;
        }
      }
      if (err) out.push({ error: err.message, input: it });
      else out.push({ ...created, short_url: `${SITE}/l/${created.short_code}` });
    }
    return json(res, 200, { links: out });
  }

  if (req.method === 'PATCH') {
    const b = await readBody(req);
    if (!b.id) return json(res, 400, { error: 'id 필수' });
    const patch = {};
    if ('archived' in b) patch.archived = !!b.archived;
    if ('label' in b) patch.label = b.label ? String(b.label).slice(0, 120) : null;
    const { data, error } = await sb.from('mj_links').update(patch).eq('id', b.id).select().single();
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { link: data });
  }

  json(res, 405, { error: 'method not allowed' });
};
