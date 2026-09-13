// 임시 진단용. 비밀값 자체는 노출하지 않습니다.
function shape(v){
  if (v == null) return { set:false };
  const s = String(v);
  return {
    set: true,
    length: s.length,
    trimmed_length: s.trim().length,
    has_outer_space: s !== s.trim(),
    has_newline: /[\r\n]/.test(s),
    has_quotes: /^["'].*["']$/.test(s),
    first: s.slice(0,1),
    last: s.slice(-1)
  };
}
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({
    SITE_URL: process.env.SITE_URL || null,
    SUPABASE_URL: process.env.SUPABASE_URL || null,
    ADMIN_PASSWORD: shape(process.env.ADMIN_PASSWORD),
    SERVICE_ROLE: shape(process.env.SUPABASE_SERVICE_ROLE_KEY),
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null
  }, null, 2));
};
