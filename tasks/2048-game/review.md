# Review: 2048 게임

## 종합 결론

**통과 — 기능/DOM 계약 관련 이슈 없음(0개). 참고용 경미한 UI 관찰 사항 1건만 기록.**

`node build.js` 정상 실행, 산출물 정상 생성, 기존 페이지 구조 회귀 없음. `dom-contract.md`에
명시된 모든 id/class가 `src/templates.js`(HTML) / `assets/css/game-2048.css`(CSS) /
`assets/js/game-2048.js`(JS) 세 곳에서 정확히 일치. 핵심 게임 로직(`slideLine`,
`moveBoard`, `isGameOver` 등)은 spec.md 6절 체크리스트 시나리오를 코드 추적 + 별도
격리 테스트 스크립트(순수 함수 복사본)로 검증했고 전부 기대대로 동작함.

**검증 방식**: 브라우저 자동화 도구(예: claude-in-chrome)가 이 환경에서 사용 불가능하여
① 코드 전체를 수동으로 트레이스하고 ② `slideLine`/`moveBoard`/`isGameOver`의 순수 로직
부분을 원본 파일에서 그대로 복사한 격리 스크립트(`/private/tmp/.../scratchpad/test-logic.js`,
구현 파일 아님, node로 실행)로 spec 예시(`2 2 4`→`4 4`, 다중 병합, 4방향, 막힌 이동,
가득 찬 보드의 승패 판정 등)를 자동 검증했다. 실제 브라우저 렌더링(다크모드 대비,
실제 클릭/스와이프 등)은 검증하지 못했으며 코드 추적으로만 판단했다.

---

## 1. 빌드 검증

| 항목 | 결과 |
|---|---|
| `node build.js` 에러 없이 완료 | 통과 (`빌드 완료: 포스트 3개, 태그 5개 → dist/`, exit 0) |
| `dist/game/2048/index.html` 생성 | 통과 |
| `dist/assets/css/game-2048.css` 생성 | 통과 |
| `dist/assets/js/game-2048.js` 생성 | 통과 |
| 기존 `dist/index.html`/포스트/태그 페이지 구조 회귀 없음 | 통과 — `.site-header`에 `<a class="header-link" href="${rootPath}/game/2048/">🎮 2048</a>` 한 줄만 추가됨. `.content`/`.site-footer`/기존 마크업은 동일. `assets/css/style.css`, `assets/js/theme.js`는 아예 수정되지 않음(`git diff --stat`으로 확인). |

---

## 2. 체크리스트 검증 (spec.md 6절)

| 항목 | 결과 | 근거 |
|---|---|---|
| 타일 병합 정확성(인접 동일값만) | 통과 | `slideLine`이 `filtered[i]===filtered[i+1]`일 때만 병합, 격리 테스트로 `[2,4,0,0]`은 병합 안 됨을 확인 |
| 이동당 타일 1회 병합(`2 2 4`→`4 4`) | 통과 | 병합 후 `i+=2`로 건너뛰어 재병합 안 함. 격리 테스트 `slideLine([2,2,4,0]) === {line:[4,4,0,0], gained:4}` PASS |
| 병합 후 이동 방향 끝까지 밀착 | 통과 | `slideLine`이 0을 제거 후 앞으로 압축, 부족분은 끝에 0으로 패딩 |
| 4방향 동일 규칙 | 통과 | `moveBoard`가 left/right는 행 단위(옵션에 따라 reverse), up/down은 열 단위로 동일한 `slideLine`을 재사용. 격리 테스트로 상/하/좌/우 각각 병합 결과가 기대와 일치함을 확인 |
| 병합 시 점수 = 병합 결과값만큼 증가 | 통과 | `slideLine`의 `gained += value`(병합 후 값), `handleMove`→`addScore(result.gained)` |
| 한 이동 내 다중 병합 합산 | 통과 | `[2,2,2,2]` → `gained:8` (4+4) 격리 테스트 PASS |
| "새 게임" 시 점수 0 초기화 | 통과 | `newGame()`에서 `score = 0` |
| 최고점수 localStorage 영속 | 통과(코드상) | `saveBest()`가 `localStorage.setItem('game2048.best', ...)`, `loadBest()`가 `init()` 시 로드. 실제 새로고침 테스트는 브라우저 미가용으로 미실시 |
| 최고점수 갱신 조건(현재 점수가 초과할 때만) | 통과 | `addScore`: `if (score > best) { best = score; saveBest(); }` — 감소 없음 |
| "새 게임" 후에도 최고점수 유지 | 통과 | `newGame()`이 `best`를 건드리지 않음 |
| localStorage 불가 환경 안전 | 통과 | `loadBest`/`saveBest` 모두 try/catch로 감싸져 있고 실패 시 `best=0` 유지, 예외를 던지지 않음 |
| 2048 최초 생성 시 승리 판정 | 통과 | `checkWinAndLoss`가 `hasWonThisRound` 플래그로 최초 1회만 트리거 |
| 승리 후 "계속하기" 정상 동작 | 통과 | `continueBtn` 클릭 → `closeOverlay()`만 호출, 보드/점수 그대로 유지되어 이어짐. `handleMove`는 `isOverlayOpen()`이면 조기 리턴하므로 오버레이가 열린 동안만 입력이 막히고, 닫히면 즉시 재개됨 |
| 이동 불가 시에만 패배 | 통과 | `isGameOver = boardFull(b) && !canMerge(b)`. 격리 테스트로 "가득 찼지만 인접 동일값 있음"은 `false`, "가득 차고 병합 불가"는 `true`임을 확인 |
| 방향키 시 스크롤 방지 | 통과 | `keydown` 핸들러에서 유효한 방향키(`KEY_DIRECTIONS`에 매핑됨)일 때만 `e.preventDefault()` 호출, 다른 키는 그대로 통과 |
| 막힌 이동 시 보드 불변 | 통과 | `moveBoard`가 `moved: !boardsEqual(b, newBoard)` 반환, `handleMove`가 `if (!result.moved) return;`로 상태 변경/새 타일 생성 자체를 건너뜀. 격리 테스트로 `[2,4,8,16]`을 왼쪽 이동 시 `moved:false` 확인 |
| 연속 입력 안정성 | 통과(코드상) | 모든 처리가 동기적이며 애니메이션/비동기 지연이 없어 경쟁 상태 여지가 구조적으로 없음. 오버레이가 열려 있는 동안은 `handleMove`가 조기 리턴하여 이중 처리도 방지됨. 별도의 "이동 잠금" 플래그는 없지만 spec상 필수 아님(권장 사항) |
| 다크모드 대비/즉시 반영 | 확인불가(코드상 타당) | `game-2048.css`가 기존 `style.css`와 동일한 패턴(`@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` + `:root[data-theme="dark"]`)으로 타일/오버레이 변수를 재정의하여 기존 `theme.js` 토글과 자동 연동됨. 색상 값 자체(예: 라이트 `--tile-text-dark:#6b6b70` on `--tile-2-bg:#eee4da`)는 원작 2048 팔레트와 유사해 합리적이나, 실제 렌더링된 대비비는 브라우저 미가용으로 측정하지 못함 |
| 모바일/반응형(360px) | 통과(코드상) | `.game-grid`가 `width:100%; max-width:420px`이라 좁은 뷰포트에 맞춰 축소되고 `aspect-ratio:1/1` 유지. `@media (max-width:480px)`에서 gap/padding 축소, `#new-game-btn`이 `width:100%`로 전체 너비 확보. 타일 폰트는 값별로 `clamp()`가 이미 큰 자릿수(128 이상)에서 더 작게 설정돼 있어 좁은 화면에서도 겹침 가능성 낮음(실측은 미실시) |
| 빌드/통합 | 통과 | 위 1절 참고. 외부 네트워크 요청/외부 라이브러리 없음(`grep`으로 `http`/`cdn`/`import` 등 검색 결과 없음), 콘솔 에러는 코드상 발생 소지 없음(모든 DOM 참조에 존재 여부 가드 있음: `if (!tileLayerEl || !overlayEl) return;`, `if (newGameBtn) ...`) |

---

## 3. DOM 계약 교차 검증

`grep`으로 세 파일의 id/class를 전수 비교한 결과, `dom-contract.md`에 명시된 항목이 모두
정확히 일치한다. 불일치 없음.

- HTML(`src/templates.js`)에 정의된 id: `score-current`, `score-best`, `new-game-btn`,
  `game-grid`, `tile-layer`, `game-overlay`, `overlay-message`, `continue-btn`,
  `overlay-new-game-btn`, `theme-toggle` — 전부 존재.
- CSS(`game-2048.css`)가 참조하는 id: `#continue-btn`, `#new-game-btn`,
  `#overlay-new-game-btn` (나머지는 class 선택자로 스타일링, 예: `.game-grid`,
  `.tile-layer`, `.game-overlay`, `.score-box` 등) — HTML의 class/id와 모두 일치.
- JS(`game-2048.js`)가 `getElementById`로 참조하는 id: `score-current`, `score-best`,
  `new-game-btn`, `overlay-new-game-btn`, `continue-btn`, `game-overlay`,
  `overlay-message`, `tile-layer` — 전부 HTML에 존재.
- JS가 런타임에 생성하는 타일 마크업: `className='tile'`, `dataset.value`,
  `style.gridColumn/gridRow`(1-indexed, `c+1`/`r+1`) — dom-contract 2절의
  `<div class="tile" data-value="128" style="grid-column: 3; grid-row: 2;">128</div>`
  형식과 정확히 일치. CSS의 `.tile[data-value="..."]` 속성 선택자와도 매칭됨.
- `#tile-layer`와 `#game-grid`의 CSS Grid 설정(4×4, `gap`)이 라이트/모바일 브레이크포인트
  모두에서 동일한 값으로 함께 조정되어 있어(`gap: 0.6rem`→모바일 `0.4rem`, `.tile-layer`도
  동일하게 `inset`/`gap` 조정) 타일이 배경 셀과 어긋나지 않음을 코드상 확인.
- `layout()`의 `extraStyles`/`extraScripts` 파라미터, 헤더 `.header-link` 삽입 위치
  (`.site-title`와 `#theme-toggle` 사이) 모두 dom-contract 6~7절과 일치.
- localStorage 키 `game2048.best`도 spec.md/dom-contract.md 명시값과 일치.

---

## 4. 발견된 버그/이슈

**기능/DOM 계약상 버그·불일치는 발견되지 않았다.**

참고용 경미한 관찰 사항 1건(수정 필요 여부는 판단하지 않음, 기록만):

- **`assets/css/style.css:68-75` (`.site-header`, 수정 범위 밖 기존 파일)**: 헤더가
  `display:flex; justify-content:space-between;`인데, 이번 변경으로 자식 요소가
  2개(`.site-title`, `#theme-toggle`)에서 3개(`.site-title`, `.header-link`,
  `#theme-toggle`)로 늘어났다. `space-between`은 요소 사이 간격을 균등 분배하므로
  `.header-link`("🎮 2048")가 시각적으로 `#theme-toggle` 바로 옆이 아니라 헤더 중앙
  부근에 위치하게 될 가능성이 높다(실제 렌더링은 브라우저 미가용으로 미확인).
  dom-contract.md 7절은 "DOM 순서상 `.site-title`와 `#theme-toggle` 사이"라고만
  명시했고 전용 스타일은 이번 범위에서 의도적으로 제외했으므로 계약 위반은 아니며,
  구조적 회귀("헤더에 링크 추가된 것 외 다른 구조 변화 없음")에도 해당하지 않는다
  (HTML 구조 자체는 그대로이고, 기존 CSS 규칙이 그대로 적용될 뿐). 다만 모든 페이지
  헤더의 시각적 레이아웃에 영향을 주므로 Work 다음 단계(또는 별도 스타일링 단계)에서
  `.header-link`에 `margin-left: auto` 등을 추가해 `#theme-toggle` 옆에 붙일지
  검토할 가치가 있다는 점만 기록해 둔다.
