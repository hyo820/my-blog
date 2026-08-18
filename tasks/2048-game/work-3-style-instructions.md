# 지침: 2048 게임 - 스타일 (Work 3단계, CSS)

## 범위
**`assets/css/game-2048.css` 파일 하나만 새로 만든다.** 다른 파일은 절대 수정하지 마라
(`assets/css/style.css`, `src/templates.js`, `build.js`, `assets/js/*` 건드리지 말 것 — 다른 서브에이전트가 담당 중).
단, `assets/css/style.css`는 **읽기만** 해서 기존 CSS 변수 체계를 파악하고 재사용해야 한다.

## 반드시 먼저 읽을 것
1. `tasks/2048-game/spec.md` — 특히 2절(UI/UX: 레이아웃, 타일 색상, 점수판, 오버레이, 반응형).
2. `tasks/2048-game/dom-contract.md` — 실제 HTML 구조와 정확한 id/class. **이 문서에 명시된 선택자만 사용해서 스타일링해야 한다** (HTML을 직접 열어볼 필요 없음, 5절에 전체 HTML이 나와 있음).
3. `assets/css/style.css` — 기존 CSS 변수(`--color-bg`, `--color-text`, `--color-accent`, `--color-border`, `--color-code-bg` 등)와 다크모드 오버라이드 패턴(`@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {...} }` 및 `:root[data-theme="dark"] {...}`)을 그대로 참고해서 **동일한 패턴으로** 타일 색상 변수를 정의해야 한다.

## 기술 제약
- 외부 라이브러리 없음, 순수 CSS. `assets/css/style.css`가 이미 `dist/assets/css/style.css`로 로드되므로 `game-2048.css`는 그 이후에 별도로 로드된다(색상 변수는 `:root`에 다시 정의해야 함 — style.css의 변수를 상속받지 못한다고 가정하고 독립적으로 동작하게 작성. 단, 실제로는 같은 페이지에 둘 다 로드되므로 style.css의 변수를 그대로 사용해도 되지만, 새로 필요한 타일 전용 변수는 이 파일에서 정의).

## 구현해야 할 것 (spec.md 2절 그대로, dom-contract.md 선택자 기준)

1. **점수판** (`.score-board`, `.score-box`, `.score-label`, `.score-value`, `#new-game-btn`): 가로 배치, `--color-border`/`--color-code-bg` 기반 둥근 사각형 박스. `#new-game-btn`은 기존 `#theme-toggle` 버튼 스타일(테두리, 둥근 모서리, hover 시 `--color-code-bg`)과 일관되게.

2. **그리드** (`#game-grid`/`.game-grid`): `position: relative`, CSS Grid 4열×4행, `aspect-ratio: 1/1`, `max-width: 420px`, 화면 폭에 맞춰 축소. `.grid-cell` 16개는 배경 빈 칸(둥근 모서리, `--color-code-bg` 계열 배경).

3. **타일 레이어** (`#tile-layer`/`.tile-layer`): `position: absolute; inset: 0;`, `#game-grid`와 **완전히 동일한** `grid-template-columns`/`grid-template-rows`/`gap` 값을 가져야 타일이 배경 칸과 정확히 겹친다 (dom-contract.md 2절 필수 요구사항). `.tile`은 `display: flex; align-items: center; justify-content: center;` 등으로 중앙 정렬된 숫자, 둥근 모서리.

4. **타일 색상**: `.tile[data-value="2"]`부터 `.tile[data-value="2048"]`까지 속성 선택자로 배경색/글자색을 정의. 값이 커질수록 색이 진해지거나 채도가 높아지는 시각적 위계. 2048은 강조색으로 눈에 띄게. 라이트/다크 모드 각각 `:root`와 `:root[data-theme="dark"]` / `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {...} }` 블록에 타일 색상 변수(`--tile-2-bg` 등)를 나눠 정의하고 `.tile[data-value="N"]`이 그 변수를 사용하게 한다. 2048보다 큰 값(4096 등)을 대비한 fallback 스타일도 하나 넣어라(예: `.tile:not([data-value="2"]):not([data-value="4"])...` 대신 간단히 마지막에 큰 값 전용 진한 색 규칙 하나 추가).

5. **오버레이** (`#game-overlay`/`.game-overlay`, `.overlay-content`, `#overlay-message`, `.overlay-actions`, `#continue-btn`, `#overlay-new-game-btn`): `position: absolute; inset: 0;`, 반투명 배경(`--color-bg` 기반 rgba 또는 `backdrop-filter`), 중앙 정렬된 메시지+버튼. 다크모드에서도 가독성 유지. `hidden` 속성이 있으면 당연히 안 보여야 하므로(브라우저 기본 동작이지만 `display` 관련 CSS로 덮어쓰지 않도록 주의 — `.game-overlay[hidden] { display: none; }`을 명시하거나, `display: flex`를 줄 때 `:not([hidden])`을 쓰는 방식 중 하나를 선택).

6. **헤더 링크** (`.header-link`, dom-contract.md 7절 참고): 이 파일이 게임 페이지에만 로드되므로 전역 헤더 스타일은 건드리지 않는 게 맞지만, 만약 `.header-link`를 이 파일에서 스타일링하면 게임 페이지에서만 적용되고 다른 페이지에는 적용 안 되는 문제가 생긴다. **`.header-link` 스타일링은 하지 마라** (범위 밖, `assets/css/style.css` 담당 — 이번 작업에는 포함 안 됨. 그대로 둬도 무방).

7. **반응형**: `@media (max-width: 480px)` 브레이크포인트(기존 style.css와 동일 기준)에서 그리드 폭 축소, 타일 폰트 크기 `clamp()`, 점수판/버튼 줄바꿈 또는 세로 배치.

## 완료 후
파일을 다 쓴 뒤, 최종 응답에 정의한 CSS 변수 목록과 다크모드 대응 여부를 간단히 요약해라.
