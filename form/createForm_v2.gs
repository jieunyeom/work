/**
 * 이커머스 업무 지도 — 신청 구글폼 생성 스크립트 v2
 *
 * v1 대비 바뀐 것
 *  · 전체 문구를 "안내문" 말투에서 "말 거는" 말투로 교체
 *  · 부담을 덜어주는 문장을 앞에, 이유를 뒤에 배치
 *  · 테스트용으로 [업무 선택] 문항을 선택 항목으로 내림 (TEST_MODE)
 *
 * ⚠️ 실행 전 반드시 확인
 *  · SITE_URL 을 새 배포 주소로 바꾸세요. 기존 v11clay 주소는 삭제되어 404 입니다.
 *  · 실행하면 폼과 응답시트가 "새로" 만들어집니다. 로그의 viewform 주소를
 *    랜딩 HTML 의 META.FORM_URL 에 다시 넣어야 합니다.
 */

const CONFIG = {
  TITLE: '이커머스 업무 지도 · 1차 신청',
  SITE_URL: 'https://여기에-새-배포주소',   // ← 반드시 교체
  DL_KEY: 'bmk-2609',                        // 랜딩 HTML 의 META.DL_KEY 와 동일해야 함
  DEADLINE: '9월 6일',
  TEST_MODE: true                            // 테스트 끝나면 false 로
};

function createForm() {
  const form = FormApp.create(CONFIG.TITLE);

  form.setDescription(
    '남겨주시면 배너 자동 조판 파일을 바로 보내드릴게요.\n' +
    '회사마다 막히는 칸이 달라서, 고르신 업무를 기준으로 정리해 드립니다.\n\n' +
    '이커머스·마케팅 실무자 · 1차 마감 ' + CONFIG.DEADLINE
  );

  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setAllowResponseEdits(false);
  form.setProgressBar(true);

  // ── 1. 이름 ───────────────────────────────
  form.addTextItem()
    .setTitle('이름')
    .setHelpText('어떻게 불러드리면 될까요.')
    .setRequired(true);

  // ── 2. 휴대폰 번호 ────────────────────────
  const phone = form.addTextItem()
    .setTitle('휴대폰 번호')
    .setHelpText('자료 보내드릴 때 외에는 쓰지 않아요. 숫자만 적어주세요. (예: 01012345678)')
    .setRequired(true);
  phone.setValidation(
    FormApp.createTextValidation()
      .requireTextMatchesPattern('^01[0-9]{8,9}$')
      .setHelpText('01로 시작하는 10~11자리 숫자로 적어주세요.')
      .build()
  );

  // ── 3. 이메일 ─────────────────────────────
  const email = form.addTextItem()
    .setTitle('이메일')
    .setHelpText('업무 카드와 이후 자료를 이 주소로 보내드릴게요.')
    .setRequired(true);
  email.setValidation(
    FormApp.createTextValidation()
      .requireTextIsEmail()
      .setHelpText('이메일 주소를 다시 확인해 주세요.')
      .build()
  );

  // ── 4. 지금 제일 손이 많이 가는 업무 ──────
  form.addListItem()
    .setTitle('지금 제일 손이 많이 가는 업무')
    .setHelpText('하나만 골라주세요. 그 업무가 어디에 물려 있는지 정리해서 보내드릴게요.')
    .setChoiceValues([
      '[매일] 주문 다운로드 → ERP 양식 변환',
      '[매일] 출고·송장 처리',
      '[매일] 재고 동기화',
      '[매일] 반품·교환 처리',
      '[매일] 고객 문의 응대',
      '[매일] 리뷰 확인·관리',
      '[매주] 제품 배너·소재 조판',
      '[매주] 상세페이지 제작·수정',
      '[매주] 채널 간 가격 정합성 점검',
      '[매주] 광고 링크·트래킹 코드 세팅',
      '[매주] 배너·피드 소재 운영',
      '[매주] 매체별 성과 취합',
      '[매주] 광고비·효율 지표 계산',
      '[매주] 유입 경로 분석',
      '[매주] 상품별 성과 확인',
      '[매주] 주간 보고 작성',
      '[매주] 채널 기획전·행사 제안',
      '[매주] 할인·쿠폰 세팅',
      '아직 잘 모르겠어요'
    ])
    .setRequired(!CONFIG.TEST_MODE);   // 테스트 중에는 건너뛸 수 있게

  // ── 5. 회사·직무 (선택) ───────────────────
  form.addTextItem()
    .setTitle('회사 · 직무')
    .setHelpText('안 적으셔도 괜찮아요. 적어주시면 그 상황에 맞춰 지도를 다시 그려 보내드릴게요.')
    .setRequired(false);

  // ── 6. 필수 동의 ──────────────────────────
  form.addCheckboxItem()
    .setTitle('[필수] 개인정보 수집·이용 동의')
    .setHelpText(
      '자료를 보내드리려면 연락처가 필요해서 여쭙습니다.\n\n' +
      '· 수집 항목 — 이름, 휴대폰 번호, 이메일, 회사·직무(선택)\n' +
      '· 이용 목적 — 신청하신 자료와 업무 카드 발송\n' +
      '· 보유 기간 — 발송 완료 후 6개월\n\n' +
      '동의하지 않으실 수 있지만, 그 경우에는 자료를 보내드릴 방법이 없습니다.'
    )
    .setChoiceValues(['네, 동의합니다'])
    .setRequired(true);

  // ── 7. 선택 동의 ──────────────────────────
  form.addCheckboxItem()
    .setTitle('[선택] 잠긴 나머지 칸 소식 받기')
    .setHelpText(
      '업무 지도에 새 칸이 열릴 때 먼저 보내드릴게요. 총 6회로 끝나고, 언제든 그만 받으실 수 있습니다.\n' +
      '동의하지 않으셔도 위 자료는 그대로 보내드립니다.'
    )
    .setChoiceValues(['네, 받아볼게요'])
    .setRequired(false);

  // ── 확인 메시지 = 다운로드 관문 ────────────
  const dlUrl = CONFIG.SITE_URL + '/?dl=1&k=' + CONFIG.DL_KEY;
  form.setConfirmationMessage(
    '신청해 주셔서 감사합니다.\n\n' +
    '아래 주소로 들어가시면 배너 자동 조판 파일이 바로 받아집니다.\n' +
    dlUrl + '\n\n' +
    '고르신 업무의 업무 카드는 이메일로 따로 보내드릴게요.'
  );

  // ── 응답 시트 연결 ────────────────────────
  const ss = SpreadsheetApp.create(CONFIG.TITLE + ' (응답)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  Logger.log('─────────────────────────────────────');
  Logger.log('응답 받는 주소 (HTML의 META.FORM_URL 에 넣으세요)');
  Logger.log(form.getPublishedUrl());
  Logger.log('');
  Logger.log('편집 주소');
  Logger.log(form.getEditUrl());
  Logger.log('');
  Logger.log('응답 시트');
  Logger.log(ss.getUrl());
  Logger.log('');
  Logger.log('확인 메시지에 넣은 다운로드 주소');
  Logger.log(dlUrl);
  Logger.log('─────────────────────────────────────');
}
