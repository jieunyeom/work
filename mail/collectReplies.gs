/* ═══════════════════════════════════════════════════════════
   메일 회신을 Supabase 로 옮긴다.
   웰컴메일에 답장이 오면 Gmail 에만 쌓여서, 대시보드에서 볼 수 없다.
   이 스크립트가 주기적으로 Gmail 을 읽어 replies 테이블에 넣는다.

   설치
     1) Apps Script 편집기에 이 파일 내용을 새 파일로 추가
     2) collectReplies 를 한 번 실행해 권한 승인
     3) 왼쪽 「트리거」 → 트리거 추가
        - 실행할 함수: collectReplies
        - 이벤트 소스: 시간 기반
        - 시간 간격: 1시간마다
   ═══════════════════════════════════════════════════════════ */

var RCFG = {
  SUPABASE_URL : 'https://rpchylubijrpzfywbxhp.supabase.co',
  SUPABASE_KEY : 'sb_publishable_eRyzvnB4O666FN_gTqP9EA_M_8H7s9Z',  // 공개키. insert 만 됩니다
  SUBJECT_MARK : '도구 8개',   // 웰컴메일 제목에 들어가는 말
  LABEL        : '수집완료',    // 처리한 대화에 붙일 라벨
  MAX_THREADS  : 30
};

function collectReplies() {
  var label = GmailApp.getUserLabelByName(RCFG.LABEL) || GmailApp.createLabel(RCFG.LABEL);
  var me = Session.getActiveUser().getEmail().toLowerCase();

  // 내가 보낸 웰컴메일 대화 중, 아직 수집 안 한 것
  var q = 'subject:"' + RCFG.SUBJECT_MARK + '" -label:"' + RCFG.LABEL + '"';
  var threads = GmailApp.search(q, 0, RCFG.MAX_THREADS);
  var sent = 0;

  for (var i = 0; i < threads.length; i++) {
    var th = threads[i];
    var msgs = th.getMessages();
    var reply = null;

    // 내가 아닌 사람이 마지막으로 쓴 메시지를 찾는다
    for (var j = msgs.length - 1; j >= 0; j--) {
      var from = String(msgs[j].getFrom() || '').toLowerCase();
      if (from.indexOf(me) < 0) { reply = msgs[j]; break; }
    }
    if (!reply) continue;   // 답장이 아직 없는 대화

    var raw = reply.getPlainBody() || '';
    var row = {
      received_at : reply.getDate().toISOString(),
      from_name   : nameOf(reply.getFrom()),
      from_email  : emailOf(reply.getFrom()),
      subject     : reply.getSubject(),
      body        : stripQuoted(raw).slice(0, 4000),
      thread_id   : th.getId()
    };

    if (push(row)) { th.addLabel(label); sent++; }
  }
  Logger.log('수집한 회신: ' + sent + ' / 확인한 대화: ' + threads.length);
  return sent;
}

/* 인용문·서명 아래를 잘라낸다. 답장 본문만 남긴다. */
function stripQuoted(t) {
  var lines = String(t).split('\n');
  var out = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    if (/^\s*>/.test(l)) break;                          // > 인용
    if (/\d{4}년 .*일 .*작성/.test(l)) break;             // 한국어 Gmail 인용 머리
    if (/^-{2,}\s*(원본 메시지|Original Message)/i.test(l)) break;
    if (/^On .* wrote:$/.test(l)) break;
    out.push(l);
  }
  return out.join('\n').trim();
}

function nameOf(from) {
  var m = String(from).match(/^\s*"?([^"<]*?)"?\s*</);
  return m ? m[1].trim() : '';
}
function emailOf(from) {
  var m = String(from).match(/<([^>]+)>/);
  return (m ? m[1] : String(from)).trim().toLowerCase();
}

function push(row) {
  try {
    var r = UrlFetchApp.fetch(RCFG.SUPABASE_URL + '/rest/v1/replies', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        apikey: RCFG.SUPABASE_KEY,
        Authorization: 'Bearer ' + RCFG.SUPABASE_KEY,
        Prefer: 'return=minimal'
      },
      payload: JSON.stringify(row),
      muteHttpExceptions: true
    });
    var c = r.getResponseCode();
    if (c === 201 || c === 200) return true;
    if (c === 409) return true;          // 같은 대화를 이미 넣었다. 라벨만 붙이고 넘어간다
    Logger.log('실패 ' + c + ' ' + r.getContentText().slice(0, 200));
    return false;
  } catch (e) {
    Logger.log('오류 ' + e);
    return false;
  }
}

/* 설치 전에 한 번 눌러 확인용 — 무엇이 걸리는지만 로그로 본다 */
function testSearch() {
  var q = 'subject:"' + RCFG.SUBJECT_MARK + '" -label:"' + RCFG.LABEL + '"';
  var th = GmailApp.search(q, 0, 10);
  Logger.log('걸린 대화: ' + th.length);
  for (var i = 0; i < th.length; i++) Logger.log(' - ' + th[i].getFirstMessageSubject());
}
