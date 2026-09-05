/**
 * 신청 직후 환영 메일 자동 발송
 * ─────────────────────────────────────────────
 * [배포 방법]
 *  1. script.google.com → 새 프로젝트 → 이 내용 전부 붙여넣기
 *  2. 오른쪽 위 [배포] → [새 배포]
 *  3. 톱니바퀴 ⚙ → [웹 앱] 선택
 *  4. 설명: 아무거나 / 실행 계정: 나 / 액세스 권한: **모든 사용자**
 *  5. [배포] → 권한 승인 → 나오는 **웹 앱 URL** 복사
 *  6. 그 URL 을 알려주세요. 페이지에 연결하겠습니다.
 *
 * ⚠️ 액세스 권한을 "모든 사용자"로 해야 페이지에서 호출됩니다.
 *    메일은 케켈님 계정으로 나가고, 하루 100통까지 무료입니다.
 * ─────────────────────────────────────────────
 */

const CFG = {
  FROM_NAME : '케켈',
  TOOL_URL  : 'https://work-jiuen.vercel.app/tools/banner-maker.html',
  SITE_URL  : 'https://work-jiuen.vercel.app',
  BCC       : ''   // 받은 것을 본인도 보관하려면 본인 메일 주소를 넣으세요
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
      subject : '[도구 8개] 1주차 배너 생성기입니다',
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
  return (name ? name + '님, ' : '') + '신청해 주셔서 고맙습니다.\n\n'
    + '방금 새 창으로 열린 게 1주차 도구, 제품 배너 생성기입니다.\n'
    + '정상가와 행사가만 넣으면 쿠폰과 적립률을 반영한 최대혜택가와 할인율이 계산되고,\n'
    + '860×505 규격으로 이미지가 나옵니다.\n\n'
    + '설치도 로그인도 없습니다. 링크를 열면 그 자리에서 씁니다.\n'
    + CFG.TOOL_URL + '\n\n'
    + '앞으로 8주 동안 매주 하나씩 보내드릴게요.\n'
    + '2주차는 주문서를 ERP 양식으로 바꾸는 도구입니다.\n\n'
    + '한 가지만 부탁드립니다.\n'
    + '3주차에 짧은 피드백 하나만 보내주세요.\n'
    + '써보셨는지, 어디가 아쉬웠는지 — 한두 줄이면 충분합니다.\n'
    + '안 쓰셨다면 왜 안 쓰게 됐는지가 저에게는 더 중요한 정보예요.\n\n'
    + '— ' + CFG.FROM_NAME + '\n'
    + CFG.SITE_URL;
}

/* ── 메일 본문 (HTML) ── */
function html(name){
  return ''
  + '<div style="font-family:-apple-system,\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;'
  + 'font-size:15px;line-height:1.75;color:#1B2028;max-width:560px">'
  + '<p>' + (name ? '<b>' + name + '</b>님, ' : '') + '신청해 주셔서 고맙습니다.</p>'
  + '<p>방금 새 창으로 열린 게 <b>1주차 도구, 제품 배너 생성기</b>입니다.<br>'
  + '정상가와 행사가만 넣으면 쿠폰과 적립률을 반영한 최대혜택가와 할인율이 계산되고, 860×505 규격으로 이미지가 나옵니다.</p>'
  + '<p style="margin:22px 0"><a href="' + CFG.TOOL_URL + '" '
  + 'style="display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;'
  + 'padding:13px 22px;border-radius:10px;font-weight:700">도구 열기 →</a><br>'
  + '<span style="font-size:13px;color:#6B7280">설치도 로그인도 없습니다. 링크를 열면 그 자리에서 씁니다.</span></p>'
  + '<p>앞으로 <b>8주 동안 매주 하나씩</b> 보내드릴게요.<br>'
  + '2주차는 주문서를 ERP 양식으로 바꾸는 도구입니다.</p>'
  + '<div style="background:#F5F2FA;border-radius:12px;padding:16px 18px;margin:22px 0">'
  + '<p style="margin:0"><b>한 가지만 부탁드립니다.</b><br>'
  + '3주차에 <b>짧은 피드백</b> 하나만 보내주세요. 써보셨는지, 어디가 아쉬웠는지.<br>'
  + '<span style="color:#6B7280">한두 줄이면 충분합니다. 안 쓰셨다면 왜 안 쓰게 됐는지가 저에게는 더 중요한 정보예요.</span></p></div>'
  + '<p style="color:#6B7280;font-size:13px">— ' + CFG.FROM_NAME + '<br>'
  + '<a href="' + CFG.SITE_URL + '" style="color:#7C3AED">' + CFG.SITE_URL + '</a></p>'
  + '</div>';
}

/* ── 배포 전 테스트 ──
   이 함수를 선택하고 실행하면 본인에게 한 통 옵니다. */
function testSend(){
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    name: CFG.FROM_NAME,
    subject: '[테스트] 도구 8개 환영 메일',
    body: body('테스트'),
    htmlBody: html('테스트')
  });
}
