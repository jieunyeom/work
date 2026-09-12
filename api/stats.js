const { db, json, requireAdmin } = require('./_lib');

function day(d) { return new Date(d).toISOString().slice(0, 10); }
function jstDay(iso) { const t = new Date(new Date(iso).getTime() + 9 * 3600e3); return t.toISOString().slice(0, 10); }

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const sb = db();
  const q = req.query || {};
  const from = q.from ? new Date(q.from + 'T00:00:00+09:00') : null;
  const to = q.to ? new Date(q.to + 'T23:59:59.999+09:00') : null;

  const [links, clicks, conv, channels] = await Promise.all([
    sb.from('mj_links').select('id,channel_id,source,medium,campaign,content,term,short_code,label,clicks,archived,created_at'),
    (() => { let c = sb.from('mj_clicks').select('link_id,clicked_at,device'); if (from) c = c.gte('clicked_at', from.toISOString()); if (to) c = c.lte('clicked_at', to.toISOString()); return c; })(),
    (() => { let c = sb.from('signups').select('created_at,utm_source,utm_medium,utm_campaign,utm_content,utm_term,source'); if (from) c = c.gte('created_at', from.toISOString()); if (to) c = c.lte('created_at', to.toISOString()); return c; })(),
    sb.from('mj_channels').select('id,code,name,source,medium'),
  ]);
  for (const r of [links, clicks, conv, channels]) if (r.error) return json(res, 500, { error: r.error.message });

  const L = links.data, C = clicks.data, V = conv.data.filter(v => !/test/i.test(v.source || '')), CH = channels.data;
  const key = (o) => [o.source, o.medium, o.campaign, o.content || '', o.term || ''].join('|');
  const linkByKey = new Map(L.map(l => [key(l), l]));
  const linkById = new Map(L.map(l => [l.id, l]));

  // 링크별 클릭(기간 내)·전환
  const perLink = new Map(L.map(l => [l.id, { link: l, clicks: 0, conv: 0 }]));
  for (const c of C) { const p = perLink.get(c.link_id); if (p) p.clicks++; }
  let convMatched = 0, convUnmatched = 0;
  for (const v of V) {
    const l = linkByKey.get([v.utm_source, v.utm_medium, v.utm_campaign, v.utm_content || '', v.utm_term || ''].join('|'));
    if (l) { perLink.get(l.id).conv++; convMatched++; } else convUnmatched++;
  }

  // 채널별 (source|medium 기준)
  const chanMap = new Map();
  for (const p of perLink.values()) {
    const k = p.link.source + '|' + p.link.medium;
    const ch = CH.find(c => c.source === p.link.source && c.medium === p.link.medium);
    const e = chanMap.get(k) || { source: p.link.source, medium: p.link.medium, name: ch ? ch.name : `${p.link.source} / ${p.link.medium}`, clicks: 0, conv: 0, links: 0 };
    e.clicks += p.clicks; e.conv += p.conv; e.links++; chanMap.set(k, e);
  }
  const byChannel = [...chanMap.values()].map(e => ({ ...e, cvr: e.clicks ? +(e.conv / e.clicks * 100).toFixed(1) : 0 })).sort((a, b) => b.clicks - a.clicks);

  // 일별 (JST)
  const daily = new Map();
  for (const c of C) { const d = jstDay(c.clicked_at); const e = daily.get(d) || { day: d, clicks: 0, conv: 0 }; e.clicks++; daily.set(d, e); }
  for (const v of V) { const d = jstDay(v.created_at); const e = daily.get(d) || { day: d, clicks: 0, conv: 0 }; e.conv++; daily.set(d, e); }
  const series = [...daily.values()].sort((a, b) => a.day < b.day ? -1 : 1);

  // 소재 상위
  const topContent = [...perLink.values()].filter(p => p.link.content).map(p => ({ content: p.link.content, source: p.link.source, medium: p.link.medium, clicks: p.clicks, conv: p.conv })).sort((a, b) => b.clicks - a.clicks).slice(0, 10);

  const totClicks = C.length, totConv = V.length;
  json(res, 200, {
    range: { from: q.from || null, to: q.to || null },
    summary: { clicks: totClicks, conversions: totConv, cvr: totClicks ? +(totConv / totClicks * 100).toFixed(1) : 0, active_links: L.filter(l => !l.archived).length, conv_matched: convMatched, conv_unmatched: convUnmatched },
    by_channel: byChannel, daily: series, top_content: topContent,
    links: [...perLink.values()].map(p => ({ id: p.link.id, short_code: p.link.short_code, label: p.link.label, source: p.link.source, medium: p.link.medium, campaign: p.link.campaign, content: p.link.content, clicks: p.clicks, conv: p.conv, cvr: p.clicks ? +(p.conv / p.clicks * 100).toFixed(1) : 0, archived: p.link.archived })).sort((a, b) => b.clicks - a.clicks),
    generated_at: new Date().toISOString(),
  });
};
