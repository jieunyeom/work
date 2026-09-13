// 임시 진단용. 비밀값은 노출하지 않고 "있다/없다"만 알려줍니다.
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({
    SITE_URL: process.env.SITE_URL || null,          // 비밀 아님 → 값 그대로
    has_SUPABASE_URL: !!process.env.SUPABASE_URL,
    has_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    env: process.env.VERCEL_ENV || null,
    host: req.headers.host
  }, null, 2));
};
