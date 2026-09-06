/**
 * 신청 직후 환영 메일 자동 발송
 * ─────────────────────────────────────────────
 * 1. script.google.com → 새 프로젝트 → 이 내용 전부 붙여넣기
 * 2. [testSend] 실행해서 본인 메일로 확인
 * 3. [배포] → [새 배포] → ⚙ → [웹 앱]
 *    실행 계정: 나 / 액세스 권한: 모든 사용자
 * 4. 나온 웹 앱 URL 을 페이지에 연결
 * ─────────────────────────────────────────────
 */

const CFG = {
  FROM_NAME : '케켈',
  TOOL_URL  : 'https://work-jiuen.vercel.app/tools/banner-maker.html',
  SITE_URL  : 'https://work-jiuen.vercel.app',
  CONTACT   : 'todo1nothing@gmail.com',
  BCC       : ''
};

function doPost(e){
  try{
    const d = JSON.parse(e.postData.contents || '{}');
    const name  = (d.name  || '').toString().slice(0,40);
    const email = (d.email || '').toString().trim();
    if(!email || email.indexOf('@') < 0) return out({ok:false, why:'no email'});

    MailApp.sendEmail({
      to      : email,
      bcc     : CFG.BCC || undefined,
      name    : CFG.FROM_NAME,
      subject : '[도구 8개] 1주차 · 배너 생성기 보내드려요',
      body    : body(name),
      htmlBody: html(name)
    });
    return out({ok:true});
  }catch(err){
    return out({ok:false, why:String(err)});
  }
}

function doGet(){ return out({ok:true, note:'alive'}); }

function out(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── 메일 본문 (텍스트) ── */
function body(name){
  return (name ? name + '님, ' : '') + '반갑습니다.\n\n'
    + '1주차 도구인 제품 배너 생성기입니다. 방금 새 창으로 열렸을 거예요.\n\n'
    + '정상가와 행사가만 넣으면 쿠폰과 적립률까지 반영해서 최대혜택가와 할인율이 나옵니다.\n'
    + '규격이 860×505로 고정이라 매번 같은 크기로 떨어지고요.\n\n'
    + CFG.TOOL_URL + '\n'
    + '설치도 로그인도 없습니다. 링크만 열면 됩니다.\n\n'
    + '다음 주에는 주문서를 ERP 양식으로 바꾸는 도구를 보내드릴게요.\n'
    + '8주 동안 매주 하나씩입니다.\n\n'
    + '3주차에 한 번 여쭤볼게요. 써보셨는지, 어디가 걸렸는지.\n'
    + '그 답을 보고 남은 도구를 다듬습니다. 안 쓰셨으면 그대로 알려주셔도 됩니다.\n\n'
    + '쓰다가 막히거나 궁금한 게 생기면 이 메일에 그냥 회신하세요.\n\n'
    + '— ' + CFG.FROM_NAME + '\n'
    + CFG.SITE_URL + '\n\n'
    + '더 받지 않으시려면 회신 한 줄이면 됩니다. 바로 중단할게요.';
}

/* ── 메일 본문 (HTML) ── */
function html(name){
  return ''
  + '<div style="font-family:-apple-system,\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;'
  + 'font-size:15px;line-height:1.75;color:#1B2028;max-width:560px">'

  + '<p>' + (name ? '<b>' + name + '</b>님, ' : '') + '반갑습니다.</p>'

  + '<p><b>1주차 도구인 제품 배너 생성기</b>입니다. 방금 새 창으로 열렸을 거예요.</p>'

  + '<p>정상가와 행사가만 넣으면 쿠폰과 적립률까지 반영해서 최대혜택가와 할인율이 나옵니다.<br>'
  + '규격이 860×505로 고정이라 매번 같은 크기로 떨어지고요.</p>'

  + '<p style="margin:24px 0"><a href="' + CFG.TOOL_URL + '" '
  + 'style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;'
  + 'padding:13px 24px;border-radius:10px;font-weight:700">도구 열기 →</a><br>'
  + '<span style="font-size:13px;color:#6B7280">설치도 로그인도 없습니다. 링크만 열면 됩니다.</span></p>'

  + '<p>다음 주에는 <b>주문서를 ERP 양식으로 바꾸는 도구</b>를 보내드릴게요.<br>'
  + '8주 동안 매주 하나씩입니다.</p>'

  + '<div style="background:#F5F2FA;border-radius:12px;padding:16px 18px;margin:24px 0">'
  + '<p style="margin:0">3주차에 한 번 여쭤볼게요. <b>써보셨는지, 어디가 걸렸는지.</b><br>'
  + '<span style="color:#6B7280">그 답을 보고 남은 도구를 다듬습니다. 안 쓰셨으면 그대로 알려주셔도 됩니다.</span></p></div>'

  + '<p>쓰다가 막히거나 궁금한 게 생기면 이 메일에 그냥 회신하세요.</p>'

  + '<p style="color:#6B7280;font-size:13px;margin-top:24px">— ' + CFG.FROM_NAME + '<br>'
  + '<a href="' + CFG.SITE_URL + '" style="color:#7C3AED">' + CFG.SITE_URL + '</a></p>'

  + '<p style="color:#9A93AC;font-size:12px;border-top:1px solid #EFEDF3;padding-top:12px">'
  + '더 받지 않으시려면 회신 한 줄이면 됩니다. 바로 중단할게요. '
  + '<a href="mailto:' + CFG.CONTACT + '" style="color:#8B8496">' + CFG.CONTACT + '</a></p>'
  + '</div>';
}

/* ── 배포 전 테스트 ── */
function testSend(){
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    name: CFG.FROM_NAME,
    subject: '[테스트] ' + '[도구 8개] 1주차 · 배너 생성기 보내드려요',
    body: body('케켈'),
    htmlBody: html('케켈')
  });
}
