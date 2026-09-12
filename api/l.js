// 단축 링크: /l/:code → 302 → UTM 붙은 랜딩. 301 금지, no-store.
const { db, isBot, device, refererHost } = require('./_lib');

const SITE = process.env.SITE_URL || 'https://example.vercel.app';
const FALLBACK = `${SITE}/?utm_source=short-link&utm_medium=unknown`;

function go(res, url) {
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.end();
}

module.exports = async (req, res) => {
  const code = String((req.query && req.query.code) || '').replace(/[^a-z0-9]/gi, '').slice(0, 16);
  if (!code) return go(res, FALLBACK);
  const ua = req.headers['user-agent'] || '';
  const count = req.method !== 'HEAD' && !isBot(ua);
  try {
    const { data, error } = await db().rpc('mj_register_click', {
      p_code: code, p_device: device(ua), p_referer: refererHost(req.headers['referer'] || ''), p_count: count,
    });
    if (error || !data || !data.length || !data[0].url) return go(res, FALLBACK);
    const target = data[0].url;
    // 오픈 리다이렉트 금지: 내 사이트로만
    if (!target.startsWith(SITE + '/') && target !== SITE) return go(res, FALLBACK);
    return go(res, target);
  } catch (e) { return go(res, FALLBACK); }
};
