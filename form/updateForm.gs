/**
 * 이커머스 업무 지도 — 기존 구글폼 "내용만" 갈아끼우는 스크립트
 *
 * ─────────────────────────────────────────────
 * 새 폼을 만들지 않습니다. 지금 쓰고 있는 폼의 문구·설정만 바꿉니다.
 * → 폼 주소 그대로, 랜딩 HTML 수정 불필요, 기존 응답 그대로 유지
 *
 * [실행 방법]
 *  1. script.google.com → 새 프로젝트
 *  2. 이 내용 전부 붙여넣기
 *  3. 아래 CONFIG 확인 (SITE_URL 은 이미 새 주소로 넣어뒀습니다)
 *  4. 함수 [updateForm] 선택 → 실행 → 권한 승인
 *  5. 로그에 "완료"가 찍히면 폼 새로고침해서 확인
 * ─────────────────────────────────────────────
 */

const CONFIG = {
  FORM_NAME: '이커머스 업무 지도 · 1차 신청',   // 드라이브에서 이 이름으로 폼을 찾습니다
  SITE_URL : 'https://work-jiuen.vercel.app',   // 새 배포 주소
  DL_KEY   : 'bmk-2609',                        // 랜딩 HTML 의 META.DL_KEY 와 동일
  DEADLINE : '9월 6일',
  TEST_MODE: true    // true = [업무 선택] 문항을 "선택"으로 내림 (테스트용)
};

function updateForm() {
  const files = DriveApp.getFilesByName(CONFIG.FORM_NAME);
  if (!files.hasNext()) {
    Logger.log('폼을 못 찾았습니다. CONFIG.FORM_NAME 을 실제 폼 제목과 똑같이 맞춰주세요.');
    return;
  }
  const form = FormApp.openById(files.next().getId());

  // ── 폼 설명 ───────────────────────────────
  form.setDescription(
    '남겨주시면 배너 자동 조판 파일을 바로 보내드릴게요.\n' +
    '회사마다 막히는 칸이 달라서, 고르신 업무를 기준으로 정리해 드립니다.\n\n' +
    '이커머스·마케팅 실무자 · 1차 마감 ' + CONFIG.DEADLINE
  );

  // ── 문항별 문구 교체 ──────────────────────
  const COPY = {
    '이름':
      '어떻게 불러드리면 될까요.',
    '휴대폰 번호':
      '자료 보내드릴 때 외에는 쓰지 않아요. 숫자만 적어주세요. (예: 01012345678)',
    '이메일':
      '업무 카드와 이후 자료를 이 주소로 보내드릴게요.',
    '지금 제일 손이 많이 가는 업무':
      '하나만 골라주세요. 그 업무가 어디에 물려 있는지 정리해서 보내드릴게요.',
    '회사 · 직무':
      '안 적으셔도 괜찮아요. 적어주시면 그 상황에 맞춰 지도를 다시 그려 보내드릴게요.',
    '[필수] 개인정보 수집·이용 동의':
      '자료를 보내드리려면 연락처가 필요해서 여쭙습니다.\n\n' +
      '· 수집 항목 — 이름, 휴대폰 번호, 이메일, 회사·직무(선택)\n' +
      '· 이용 목적 — 신청하신 자료와 업무 카드 발송\n' +
      '· 보유 기간 — 발송 완료 후 6개월\n\n' +
      '동의하지 않으실 수 있지만, 그 경우에는 자료를 보내드릴 방법이 없습니다.',
    '[선택] 잠긴 나머지 칸 소식 받기':
      '업무 지도에 새 칸이 열릴 때 먼저 보내드릴게요. 총 6회로 끝나고, 언제든 그만 받으실 수 있습니다.\n' +
      '동의하지 않으셔도 위 자료는 그대로 보내드립니다.'
  };

  form.getItems().forEach(function (item) {
    const title = item.getTitle();
    if (COPY[title]) item.setHelpText(COPY[title]);

    // 테스트 중에는 업무 선택을 건너뛸 수 있게
    if (title === '지금 제일 손이 많이 가는 업무') {
      item.asListItem().setRequired(!CONFIG.TEST_MODE);
    }
    // 동의 문구를 부드럽게
    if (title === '[필수] 개인정보 수집·이용 동의') {
      item.asCheckboxItem().setChoiceValues(['네, 동의합니다']);
    }
    if (title === '[선택] 잠긴 나머지 칸 소식 받기') {
      item.asCheckboxItem().setChoiceValues(['네, 받아볼게요']);
    }
  });

  // ── 확인 메시지 (다운로드 주소 교체가 핵심) ──
  const dlUrl = CONFIG.SITE_URL + '/?dl=1&k=' + CONFIG.DL_KEY;
  form.setConfirmationMessage(
    '신청해 주셔서 감사합니다.\n\n' +
    '아래 주소로 들어가시면 배너 자동 조판 파일이 바로 받아집니다.\n' +
    dlUrl + '\n\n' +
    '고르신 업무의 업무 카드는 이메일로 따로 보내드릴게요.'
  );

  Logger.log('─────────────────────────────');
  Logger.log('완료했습니다.');
  Logger.log('폼 주소   : ' + form.getPublishedUrl());
  Logger.log('편집 주소 : ' + form.getEditUrl());
  Logger.log('다운로드  : ' + dlUrl);
  Logger.log('업무 문항 : ' + (CONFIG.TEST_MODE ? '선택 (테스트 모드)' : '필수'));
  Logger.log('─────────────────────────────');
}
