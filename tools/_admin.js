// 공용: 비밀번호 게이트 + API 호출
var KEY_NAME = 'mj_admin_key';
function getKey(){ try{ return sessionStorage.getItem(KEY_NAME) || ''; }catch(_){ return ''; } }
function setKey(k){ try{ sessionStorage.setItem(KEY_NAME, k); }catch(_){} }
async function api(path, opts){
  opts = opts || {};
  var r = await fetch(path, { method: opts.method || 'GET', headers: Object.assign({ 'Content-Type': 'application/json', 'x-admin-key': getKey() }, opts.headers || {}), body: opts.body ? JSON.stringify(opts.body) : undefined });
  var j = null; try{ j = await r.json(); }catch(_){}
  if (r.status === 401) { setKey(''); location.reload(); throw new Error('unauthorized'); }
  if (!r.ok) throw new Error((j && j.error) || ('HTTP ' + r.status));
  return j;
}
function gate(onReady){
  if (getKey()) { onReady(); return; }
  document.body.innerHTML = '<div class="gate"><h1>관리자</h1><p class="sub">비밀번호를 입력하세요</p><input type="password" id="pw" autocomplete="current-password"><p style="margin-top:12px"><button class="btn" id="go">열기</button></p><p class="msg err" id="gm"></p></div>';
  var go = function(){ var v = document.getElementById('pw').value; if(!v) return; setKey(v);
    api('/api/channels').then(function(){ location.reload(); }).catch(function(e){ setKey(''); document.getElementById('gm').textContent = '비밀번호가 올바르지 않습니다'; }); };
  document.getElementById('go').onclick = go;
  document.getElementById('pw').addEventListener('keydown', function(e){ if(e.key==='Enter') go(); });
  document.getElementById('pw').focus();
}
function copyText(t, btn){ navigator.clipboard.writeText(t).then(function(){ var o=btn.textContent; btn.textContent='복사됨'; setTimeout(function(){btn.textContent=o},1400); }); }
function fmtDate(iso){ var d=new Date(iso); return (d.getMonth()+1)+'/'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function todayJST(){ var d=new Date(Date.now()+9*3600e3); return d.toISOString().slice(0,10); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
