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
  FB_URL    : 'https://work-jiuen.vercel.app/feedback.html',
  ROADMAP   : 'https://work-jiuen.vercel.app/#roadmap',
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
      subject : '[도구 8개] 2주차 · 배너 생성기 보내드려요',
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
  var NL = String.fromCharCode(10);
  return (name ? name + '님, ' : '') + '안녕하세요 😊' + NL
    + '신청해주셔서 정말 반가워요.' + NL + NL
    + '이커머스 일이라는 게, 매달 같은 걸 하는데도 늘 처음부터 다시 하는 기분이 들더라고요.' + NL
    + '저도 그게 제일 지쳐서 제가 쓰려고 하나씩 만들어둔 도구들을, 8주 동안 나눠서 보내드리려고 합니다.' + NL + NL
    + '오늘 보내드리는 건 2주차 도구인 제품 배너 생성기예요. 방금 새 창으로 열렸을 거예요.' + NL + NL
    + '정상가와 행사가만 넣으면 쿠폰과 적립률까지 반영해서 최대혜택가와 할인율이 알아서 계산됩니다.' + NL
    + '규격도 860×505로 고정이라, 매번 크기를 다시 맞추지 않으셔도 돼요.' + NL + NL
    + CFG.TOOL_URL + NL
    + '설치도 로그인도 없습니다. 링크만 열면 바로 쓰실 수 있어요.' + NL + NL
    + '같은 주차 도구로 상세페이지 HTML 자동 생성도 함께 넣어두었습니다.' + NL
    + '이미지 주소 목록만 붙여넣으면 상세 코드가 완성돼요.' + NL + NL
    + '다음 주에는 1주차 도구인 상품등록용 이미지 주소 정리를 보내드릴게요.' + NL
    + '8주 동안 매주 하나씩, 천천히 채워가려고 합니다.' + NL + NL
    + '그리고 한 가지 부탁이 있어요.' + NL
    + '이 도구들은 제가 제 일에 쓰려고 만든 것들이라, 다른 분들 업무에도 맞을지는 아직 잘 모르겠습니다.' + NL
    + '그래서 써보신 느낌을 꼭 듣고 싶어요. 좋았든 아쉬웠든, 한두 줄이면 충분합니다 🙂' + NL + NL
    + '  이번 도구, 써보셨나요' + NL + '  ' + CFG.FB_URL + '?t=used' + NL + NL
    + '  다른 도구도 미리 보고 싶어요' + NL + '  ' + CFG.ROADMAP + NL + NL
    + '  이 업무도 자동화 되나요' + NL + '  ' + CFG.FB_URL + '?t=ask' + NL + NL
    + '세 번째가 특히 큰 도움이 됩니다. 남겨주신 업무를 보고 다음 도구를 정하거든요.' + NL
    + '쓰다가 막히시면 이 메일에 편하게 회신 주셔도 좋습니다. 제가 직접 읽고 답장드려요.' + NL + NL
    + '오늘도 고생 많으셨어요. 다음 주에 또 찾아뵐게요.' + NL + NL
    + '— ' + CFG.FROM_NAME + NL
    + CFG.SITE_URL + NL + NL
    + '더 받지 않으셔도 괜찮습니다. 회신 한 줄만 주시면 바로 중단할게요.';
}

/* ── 메일 본문 (HTML) ── */
function html(name){
  return ''
  + '<div style="font-family:-apple-system,\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;'
  + 'font-size:15px;line-height:1.8;color:#262A1C;max-width:560px">'

  + '<p>' + (name ? '<b>' + name + '</b>님, ' : '') + '안녕하세요 😊<br>'
  + '신청해주셔서 정말 반가워요.</p>'

  + '<p>이커머스 일이라는 게, 매달 같은 걸 하는데도 늘 처음부터 다시 하는 기분이 들더라고요.<br>'
  + '저도 그게 제일 지쳐서 제가 쓰려고 하나씩 만들어둔 도구들을, 8주 동안 나눠서 보내드리려고 합니다.</p>'

  + '<p>오늘 보내드리는 건 <b>2주차 도구인 제품 배너 생성기</b>예요. 방금 새 창으로 열렸을 거예요.</p>'

  + '<p>정상가와 행사가만 넣으면 쿠폰과 적립률까지 반영해서 최대혜택가와 할인율이 알아서 계산됩니다.<br>'
  + '규격도 860×505로 고정이라, 매번 크기를 다시 맞추지 않으셔도 돼요.</p>'

  + '<p style="margin:24px 0"><a href="' + CFG.TOOL_URL + '" '
  + 'style="display:inline-block;background:#DDF56A;color:#1F2A05;text-decoration:none;'
  + 'padding:13px 24px;border-radius:10px;font-weight:700">도구 열기 →</a><br>'
  + '<span style="font-size:13px;color:#5E6356">설치도 로그인도 없습니다. 링크만 열면 바로 쓰실 수 있어요.</span></p>'

  + '<p>같은 주차 도구로 <b>상세페이지 HTML 자동 생성</b>도 함께 넣어두었습니다.<br>'
  + '이미지 주소 목록만 붙여넣으면 상세 코드가 완성돼요.</p>'

  + '<p>다음 주에는 <b>1주차 도구인 상품등록용 이미지 주소 정리</b>를 보내드릴게요.<br>'
  + '8주 동안 매주 하나씩, 천천히 채워가려고 합니다.</p>'

  + '<div style="background:#F7FAE9;border:1px solid #E2E7D0;border-radius:12px;padding:18px;margin:26px 0">'
  + '<p style="margin:0 0 6px;font-weight:700">그리고 한 가지 부탁이 있어요</p>'
  + '<p style="margin:0 0 14px;font-size:13.5px;color:#5E6356">이 도구들은 제가 제 일에 쓰려고 만든 것들이라, '
  + '다른 분들 업무에도 맞을지는 아직 잘 모르겠습니다. 써보신 느낌을 꼭 듣고 싶어요. '
  + '좋았든 아쉬웠든, 한두 줄이면 충분합니다 🙂</p>'
  + row('👋', '이번 도구, 써보셨나요', '한두 줄이면 충분합니다', CFG.FB_URL + '?t=used')
  + row('🧰', '다른 도구도 미리 보고 싶어요', '8주 로드맵을 한눈에', CFG.ROADMAP)
  + row('🙋', '이 업무도 자동화 되나요', '남겨주신 업무를 보고 다음 도구를 정합니다', CFG.FB_URL + '?t=ask')
  + '</div>'

  + '<p>쓰다가 막히시면 이 메일에 편하게 회신 주셔도 좋습니다. 제가 직접 읽고 답장드려요.</p>'

  + '<p>오늘도 고생 많으셨어요. 다음 주에 또 찾아뵐게요.</p>'

  + '<p style="color:#5E6356;font-size:13px;margin-top:24px">— ' + CFG.FROM_NAME + '<br>'
  + '<a href="' + CFG.SITE_URL + '" style="color:#1F2A05">' + CFG.SITE_URL + '</a></p>'

  + '<p style="color:#8A8F80;font-size:12px;border-top:1px solid #E2E7D0;padding-top:12px">'
  + '더 받지 않으셔도 괜찮습니다. 회신 한 줄만 주시면 바로 중단할게요. '
  + '<a href="mailto:' + CFG.CONTACT + '" style="color:#5E6356">' + CFG.CONTACT + '</a></p>'
  + '</div>';
}

/* ── 메일 안의 버튼 한 줄 ── */
function row(icon, title, desc, url){
  return '<a href="' + url + '" style="display:block;text-decoration:none;background:#fff;'
    + 'border:1px solid #E2E7D0;border-radius:10px;padding:12px 14px;margin-bottom:8px">'
    + '<span style="font-size:15px;color:#1F2A05;font-weight:700">' + icon + '  ' + title + ' →</span><br>'
    + '<span style="font-size:12.5px;color:#5E6356">' + desc + '</span></a>';
}

/* ── 배포 전 테스트 ── */
function testSend(){
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    name: CFG.FROM_NAME,
    subject: '[테스트] ' + '[도구 8개] 2주차 · 배너 생성기 보내드려요',
    body: body('케켈'),
    htmlBody: html('케켈')
  });
}
