// 신청 API: 브라우저 → 여기 → Supabase(service_role). anon 직접 insert 대체.
// 케켈 사이트용: 테이블 signups, 컬럼 name/email/task/company/agree_privacy/agree_news/source.
const crypto = require('crypto');
const { db, json, readBody, slug, clientIp } = require('./_lib');

const bucket = new Map(); // 인스턴스 단위 속도제한 (IP당 10분 5회)
function limited(ip) {
  const now = Date.now(), win = 10 * 60e3, max = 5;
  const arr = (bucket.get(ip) || []).filter(t => now - t < win);
  if (arr.length >= max) return true;
  arr.push(now); bucket.set(ip, arr); return false;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' });
  const b = await readBody(req);
  if (b.website) return json(res, 200, { ok: true }); // 허니팟: 봇은 조용히 성공 처리
  const ip = clientIp(req);
  if (limited(ip)) return json(res, 429, { error: 'too many requests' });

  const email = String(b.email || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(res, 400, { error: 'bad email' });
  const agree_privacy = b.agree_privacy === true, agree_news = b.agree_news === true;
  if (!agree_privacy) return json(res, 400, { error: 'consent required' });
  const name = String(b.name || '').trim().slice(0, 40);
  if (!name) return json(res, 400, { error: 'name required' });

  const u = (k) => b[k] ? slug(b[k]).slice(0, 80) : null;
  const row = {
    name, email, agree_privacy, agree_news,
    task: b.task ? String(b.task).trim().slice(0, 200) : null,
    company: b.company ? String(b.company).trim().slice(0, 100) : null,
    source: (b.src ? slug(b.src) : null) || u('utm_source') || 'direct',
    utm_source: u('utm_source'), utm_medium: u('utm_medium'), utm_campaign: u('utm_campaign'),
    utm_content: u('utm_content'), utm_term: u('utm_term'),
    referrer: b.referrer ? String(b.referrer).slice(0, 300) : null,
    landing: b.landing ? String(b.landing).slice(0, 300) : null,
    consent_at: new Date().toISOString(),
    consent_version: String(b.consent_version || '2026-09-10').slice(0, 20),
    ip_hash: ip ? crypto.createHash('sha256').update(ip + (process.env.ADMIN_PASSWORD || '')).digest('hex').slice(0, 32) : null,
  };
  const { error } = await db().from('signups').insert(row);
  if (error) {
    if (error.code === '23505') return json(res, 200, { ok: true, duplicate: true });
    return json(res, 500, { error: 'insert failed' });
  }
  json(res, 200, { ok: true });
};
