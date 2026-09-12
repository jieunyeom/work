// 서버 전용 헬퍼. 브라우저로 나가지 않습니다.
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다');
  return createClient(url, key, { auth: { persistSession: false } });
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a || '')), B = Buffer.from(String(b || ''));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

// 어드민 API 보호: x-admin-key 헤더 == ADMIN_PASSWORD
function requireAdmin(req, res) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) { json(res, 500, { error: 'ADMIN_PASSWORD 환경변수가 없습니다' }); return false; }
  if (!safeEqual(req.headers['x-admin-key'], pw)) { json(res, 401, { error: 'unauthorized' }); return false; }
  return true;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let s = ''; req.on('data', (c) => { s += c; if (s.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); } });
  });
}

// UTM 값 규칙: 소문자, 공백→하이픈, 영문·숫자·. _ - 만
function slug(v) {
  return String(v || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, '').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
}

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // 혼동 문자(l,o,0,1) 제외
function shortCode(n = 6) {
  const b = crypto.randomBytes(n); let s = '';
  for (let i = 0; i < n; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return s;
}

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|facebot|kakaotalk|twitterbot|slackbot|discordbot|linebot|line-poker|yeti|whatsapp|telegrambot|pinterest|embedly|quora|outbrain|vkshare|w3c_validator|preview|headlesschrome|lighthouse/i;
function isBot(ua) { return !ua || BOT_RE.test(ua); }
function device(ua) {
  if (!ua) return 'other';
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) return 'mobile';
  if (/windows|macintosh|linux|x11|cros/i.test(ua)) return 'desktop';
  return 'other';
}
function refererHost(r) { try { return r ? new URL(r).hostname : null; } catch { return null; } }
function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  return (Array.isArray(xf) ? xf[0] : (xf || '')).split(',')[0].trim() || req.socket?.remoteAddress || '';
}

module.exports = { db, json, requireAdmin, readBody, slug, shortCode, isBot, device, refererHost, clientIp, safeEqual };
