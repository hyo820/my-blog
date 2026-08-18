# 지침: 2048 게임 - Review 단계

## 범위
**`tasks/2048-game/review.md` 파일만 작성한다.** 코드 파일(`src/templates.js`, `build.js`,
`assets/css/game-2048.css`, `assets/js/game-2048.js`, `assets/css/style.css` 등)은
**절대 수정하지 마라** — 버그를 발견해도 고치지 말고 review.md에 기록만 해라(수정은 다음
단계에서 별도로 결정한다). `node build.js` 실행이나 로컬 서버 기동처럼 읽기/검증성 명령은 자유롭게 사용해도 된다.

## 반드시 먼저 읽을 것
1. `tasks/2048-game/spec.md` — 특히 6절(테스트 관점 체크리스트).
2. `tasks/2048-game/dom-contract.md` — 정확한 선택자 계약.
3. 실제 구현 파일 3개: `src/templates.js`(`renderGamePage`/`layout` 부분), `build.js`(게임 페이지 생성 부분), `assets/css/game-2048.css`, `assets/js/game-2048.js`.

## 해야 할 일

### 1. 빌드 검증
- `node build.js` 실행 → 에러 없이 완료되는지.
- `dist/game/2048/index.html`, `dist/assets/css/game-2048.css`, `dist/assets/js/game-2048.js`가 생성되는지.
- `dist/index.html`, 기존 포스트/태그 페이지가 이번 변경으로 깨지지 않았는지(헤더에 "🎮 2048" 링크가 추가된 것 외에 다른 구조 변화가 없는지) 확인.

### 2. 실제 동작 확인 (가능하면 브라우저로, 불가능하면 코드 추적으로)
- 브라우저 자동화 도구(claude-in-chrome 등)가 사용 가능하면: 로컬 정적 서버로 `dist/`를 띄우고 `game/2048/`에 접속해서 방향키로 몇 번 조작해보고, 점수 갱신·타일 병합·새 게임·다크모드 토글이 실제로 동작하는지 확인해라.
- 브라우저 도구가 없으면: `assets/js/game-2048.js`의 각 함수를 spec.md 6절 체크리스트에 따라 코드 추적(수동 트레이스)으로 검증해라. 특히 `slideLine`(병합 로직), `checkWinAndLoss`(승패 판정), `handleMove`(전체 파이프라인)를 예제 입력으로 손으로 시뮬레이션해봐라.

### 3. 체크리스트 검증 (spec.md 6절 항목별로 review.md에 결과 기록)
각 항목에 대해 **통과 / 실패 / 확인불가(사유)** 로 명확히 표시해라:
- 타일 병합 정확성 (인접 동일값만, 이동당 1회, 병합 후 밀착, 4방향 동일 규칙)
- 점수 계산 (병합값 가산, 다중 병합 합산, 새 게임 시 0 초기화)
- 최고 점수 localStorage (영속, 갱신 조건, 새 게임에도 유지, localStorage 불가 환경 안전)
- 승패 판정 (2048 최초 생성 시 승리, 계속하기 정상 동작, 이동 불가 시에만 패배)
- 키보드 반응 (스크롤 방지, 막힌 이동 시 보드 불변, 연속 입력 안정성)
- 다크모드 (라이트/다크 대비, 토글 시 즉시 반영)
- 모바일/반응형 (좁은 화면에서 그리드/타일/버튼)
- 빌드/통합 (정상 생성, 기존 페이지 회귀 없음, 콘솔 에러/외부 의존성 없음)

### 4. DOM 계약 일치 여부 교차 검증
`dom-contract.md`에 명시된 모든 id/class(`#score-current`, `#score-best`, `#new-game-btn`,
`#game-grid`, `.grid-cell`, `#tile-layer`, `#game-overlay`, `#overlay-message`,
`#continue-btn`, `#overlay-new-game-btn` 등)가 HTML(`src/templates.js`의 `renderGamePage`),
CSS(`game-2048.css`), JS(`game-2048.js`) 세 곳에서 정확히 같은 이름으로 쓰이는지
grep 등으로 교차 확인해라. 하나라도 불일치하면 review.md에 구체적으로(파일명, 줄, 어떤 이름이 다른지) 기록해라.

## review.md 형식
- 상단에 종합 결론(예: "통과 — 발견된 이슈 없음" 또는 "N개 이슈 발견, 수정 필요") 요약.
- 위 체크리스트 결과를 표나 목록으로.
- 발견된 버그/불일치는 각각: 파일:줄, 증상, 재현 방법(또는 트레이스 근거), 제안하는 수정 방향을 구체적으로 적어라.
- 브라우저로 실제 테스트했는지, 코드 추적으로만 검증했는지 명시해라.

## 완료 후
최종 응답에 종합 결론과 발견된 이슈 개수만 간단히 요약해라.
