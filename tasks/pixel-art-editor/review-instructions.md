# 지침: 픽셀 아트 에디터 - Review 단계

## 범위
**`tasks/pixel-art-editor/review.md` 파일만 작성한다.** 코드 파일(`src/templates.js`, `build.js`,
`assets/css/pixel-art.css`, `assets/js/pixel-art.js`, `assets/css/style.css` 등)은
**절대 수정하지 마라** — 버그를 발견해도 고치지 말고 review.md에 기록만 해라. `node build.js`
실행이나 로컬 서버 기동처럼 읽기/검증성 명령은 자유롭게 사용해도 된다.

## 반드시 먼저 읽을 것
1. `tasks/pixel-art-editor/spec.md` — 특히 6절(테스트 관점 체크리스트).
2. `tasks/pixel-art-editor/dom-contract.md` — 정확한 선택자 계약. **특히 7절/8절에 Work 1단계
   담당자가 남긴 미확인 이슈(헤더 `.header-link` 간격이 CSS 스펙 기반 추론으로만 판단됐고
   실제 브라우저로 검증 안 됨, 360px 폭에서 헤더 4개 요소가 줄바꿈 없이 들어가는지 경계선
   상황)가 있다 — 이번 Review에서 반드시 확인해라.**
3. 실제 구현 파일: `src/templates.js`(`renderPixelArtPage`/헤더 부분), `build.js`(픽셀 아트 페이지
   생성 부분), `assets/css/pixel-art.css`, `assets/js/pixel-art.js`, `assets/css/style.css`의
   `.site-header`/`.header-link` 관련 부분.

## 해야 할 일

### 1. 빌드 검증
- `node build.js` 실행 → 에러 없이 완료되는지.
- `dist/pixel-art/index.html`, `dist/assets/css/pixel-art.css`, `dist/assets/js/pixel-art.js`가
  생성되는지.
- `dist/index.html`, 기존 포스트/태그/게임 페이지가 이번 변경으로 깨지지 않았는지(헤더에
  "🎨 픽셀 아트" 링크가 추가된 것 외에 다른 구조 변화가 없는지).

### 2. 헤더 레이아웃 검증 (Work 1단계에서 넘겨받은 미확인 이슈, 최우선 확인)
- 브라우저 자동화 도구가 사용 가능하면: 실제로 360px/375px/480px/720px+ 뷰포트에서 헤더를
  렌더링해서 (a) `🎮 2048`과 `🎨 픽셀 아트` 두 링크 사이 간격이 부자연스럽게 벌어지지
  않는지, (b) 좁은 화면에서 제목/링크 2개/토글이 겹치거나 잘리지 않는지 스크린샷으로 확인해라.
- 브라우저 도구가 없으면: `assets/css/style.css`의 `.site-header`, `.header-link`,
  `.site-title + .header-link` 규칙을 CSS 스펙대로 다시 검토하고, dom-contract.md 7절의
  추론이 타당한지 재검증해라(가능하면 다른 방식으로 교차 검증 — 예: 실제 렌더링된
  `dist/index.html`의 HTML 구조를 보고 요소 개수/클래스가 예상대로인지 확인).

### 3. 실제 동작 확인 (가능하면 브라우저로, 불가능하면 코드 추적으로)
- 브라우저 도구가 있으면: 로컬 정적 서버로 `dist/`를 띄우고 `/pixel-art/`에 접속해서 팔레트
  선택, 클릭 채색, 드래그 채색, 지우개, 전체 지우기, PNG 저장(다운로드된 파일 확인 가능하면
  확인), 다크모드 토글이 실제로 동작하는지 확인해라.
- 브라우저 도구가 없으면: `assets/js/pixel-art.js`의 각 함수를 spec.md 6절 체크리스트에 따라
  코드 추적으로 검증해라. 특히 `paintCell`(좌표 매핑), `drawExportCanvas`/`savePng`(PNG 생성),
  `selectColor`(선택 상태 동기화)를 예제 입력으로 손으로 시뮬레이션해봐라.

### 4. 체크리스트 검증 (spec.md 6절 항목별로 review.md에 결과 기록)
각 항목에 대해 **통과 / 실패 / 확인불가(사유)** 로 명확히 표시해라:
- 격자 정확성 (16x16, row-major, 클릭/드래그 좌표 일치, 격자 밖 드래그 처리)
- 팔레트/도구 (스와치 선택, 커스텀 색상, 지우개-투명스와치 상태 공유, 전체 지우기)
- PNG 저장 (화면과 일치, 256x256 해상도, 투명 알파 보존, 파일명 형식, 빈 캔버스 저장)
- 다크모드 (UI 대비, 그려진 픽셀 색상의 테마 독립성, 토글 즉시 반영)
- 모바일/반응형 (좁은 화면 레이아웃, 터치 지원 시 스크롤 방지)
- 헤더 연동 (모든 페이지 링크 노출, 좁은 화면에서 겹침/잘림 없음 — 2번 항목 결과 반영)
- 빌드/통합 (정상 생성, 기존 페이지 회귀 없음, 콘솔 에러/외부 의존성 없음)

### 5. DOM 계약 일치 여부 교차 검증
`dom-contract.md`에 명시된 모든 id/class(`#palette`, `.palette-swatch`,
`.palette-swatch-transparent`, `#custom-color`, `#current-color-preview`, `#eraser-btn`,
`#clear-btn`, `#save-btn`, `#pixel-grid`, `.pixel-cell`, `#export-canvas` 등)가 HTML, CSS, JS
세 곳에서 정확히 같은 이름으로 쓰이는지 grep 등으로 교차 확인해라. 특히 JS가 사용한
`.current-color-preview.transparent` 클래스를 CSS가 실제로 스타일링했는지 확인해라(JS
담당자가 완료 보고에서 이 부분을 CSS 담당자에게 확인해달라고 남겼다).

## review.md 형식
- 상단에 종합 결론 요약(예: "통과 — 발견된 이슈 없음" 또는 "N개 이슈 발견, 수정 필요").
- 위 체크리스트 결과를 표나 목록으로.
- 발견된 버그/불일치는 각각: 파일:줄, 증상, 재현 방법(또는 트레이스 근거), 제안하는 수정
  방향을 구체적으로 적어라.
- 헤더 레이아웃 이슈(2번 항목)는 특히 상세히 — 실제로 문제가 있는지, 있다면 어느 뷰포트
  폭에서부터인지, 어떤 수정(예: `flex-wrap: wrap` 추가)을 제안하는지.
- 브라우저로 실제 테스트했는지, 코드/CSS 추적으로만 검증했는지 명시해라.

## 완료 후
최종 응답에 종합 결론과 발견된 이슈 개수, 특히 헤더 레이아웃 결론(문제 없음/문제 있음)을
간단히 요약해라.
