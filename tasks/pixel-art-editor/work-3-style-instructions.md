# 지침: 픽셀 아트 에디터 - 스타일 (Work 3단계, CSS)

## 범위
**`assets/css/pixel-art.css` 파일 하나만 새로 만든다.** 다른 파일은 절대 수정하지 마라
(`assets/css/style.css`, `src/templates.js`, `build.js`, `assets/js/*` 건드리지 말 것).
단, `assets/css/style.css`와 `assets/css/game-2048.css`는 **읽기만** 해서 기존 CSS 변수 체계와
패턴(라이트/다크 모드 3-블록 구조)을 파악하고 재사용해야 한다.

## 반드시 먼저 읽을 것
1. `tasks/pixel-art-editor/spec.md` — 특히 2절(UI/UX).
2. `tasks/pixel-art-editor/dom-contract.md` — 정확한 선택자 계약(팔레트, 도구 버튼, 격자, 캔버스).
3. `assets/css/style.css` — 기존 CSS 변수(`--color-bg`, `--color-text`, `--color-accent`, `--color-border`, `--color-code-bg` 등)와 다크모드 3-블록 패턴(`:root`, `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {...} }`, `:root[data-theme="dark"] {...}`).
4. `assets/css/game-2048.css` — 같은 프로젝트에서 이미 만든 버튼/오버레이 스타일 패턴 참고(톤 일치).

## 구현해야 할 것 (spec.md 2절, dom-contract.md 선택자 기준)

1. **팔레트** (`#palette`/`.palette`, `.palette-swatch`, `.palette-swatch-transparent`, `#custom-color`, `.current-color-box`, `#current-color-preview`):
   - `.palette`: `flex-wrap: wrap`, 스와치들을 가로로 배치.
   - `.palette-swatch`: 원형 또는 둥근 사각형 버튼(약 28~32px), `border: 1px solid var(--color-border)`. 배경색은 정적 HTML의 인라인 `style`로 이미 지정되어 있으므로 CSS에서 배경색을 지정하지 마라(단, `.palette-swatch-transparent`는 인라인 배경이 없으므로 **CSS가 체커보드 배경을 그려야 한다** — 새 변수 `--pixel-checker-a`/`--pixel-checker-b`를 정의해 작은 체커보드 패턴(`repeating-conic-gradient` 등)으로 표현).
   - `.palette-swatch.selected` / `#custom-color.selected`: `2px solid var(--color-accent)` 테두리 + 약간의 `box-shadow`로 강조(dom-contract.md 1절).
   - `#custom-color`: 네이티브 `<input type="color">` 스타일을 팔레트 스와치와 비슷한 크기로 맞춰라(`width`/`height` 지정, `border-radius` 등 — 브라우저마다 네이티브 색상 picker 모양이 달라 완전히 통일은 어려우니 크기/테두리만 맞춰도 충분).
   - `.current-color-box`, `.current-color-label`, `#current-color-preview`: 작은 미리보기 칩(스와치와 비슷한 크기), 텍스트 라벨과 나란히. `#current-color-preview`가 "투명" 상태를 표시할 때 쓸 클래스(예: `.transparent`)에 대한 체커보드 스타일도 만들어라(JS가 이 클래스를 토글한다고 가정하고, 정확한 클래스명은 자유롭게 정하되 `assets/js/pixel-art.js`를 만드는 다른 에이전트도 참고할 수 있도록 흔히 쓰이는 이름인 `.transparent`를 권장).

2. **도구 버튼** (`.tool-row`, `.tool-btn`, `#eraser-btn`, `#clear-btn`, `#save-btn`):
   - `.tool-row`: 가로 배치, `flex-wrap: wrap`, 버튼 사이 `gap`.
   - `.tool-btn`: 기존 `#theme-toggle`/`game-2048.css`의 버튼 톤과 일치 — `background: none; border: 1px solid var(--color-border); border-radius: 999px; padding: 0.35rem 0.8rem; cursor: pointer; hover 시 background: var(--color-code-bg);`.
   - `#eraser-btn.active`: `border-color: var(--color-accent); color: var(--color-accent);` 등으로 강조(dom-contract.md 2절).

3. **격자** (`#pixel-grid`/`.pixel-grid`, `.pixel-cell`):
   - `#pixel-grid`: `display: grid; grid-template-columns: repeat(16, 1fr); grid-template-rows: repeat(16, 1fr);`, `max-width: 480px`, 화면 폭에 맞춰 축소, 정사각형 유지(`aspect-ratio: 1 / 1`을 그리드 컨테이너에도 적용).
   - 체커보드 배경을 `#pixel-grid`에 적용해 미채색 칸에서 비쳐 보이게 한다(`--pixel-checker-a`/`--pixel-checker-b` 재사용, 위 1번과 동일 변수).
   - `.pixel-cell`: `aspect-ratio: 1 / 1; border: 1px solid var(--color-border); background: transparent;` (JS가 채색 시 인라인 `background-color`로 덮어씀 — dom-contract.md 3절).

4. **내보내기 캔버스** (`#export-canvas`): 화면에 절대 보이지 않아야 한다. `hidden` 속성이 이미 있으므로 별도 CSS 불필요(굳이 `display: none`을 추가해도 무방하지만 필수는 아님).

5. **다크모드**: `--pixel-checker-a`/`--pixel-checker-b`를 라이트/다크 각각 정의(기존 3-블록 패턴 그대로). **주의**: `.palette-swatch`의 인라인 배경색(사용자가 고를 색상 자체)과 `.pixel-cell`의 인라인 배경색(그려진 그림)은 테마와 무관하게 항상 그대로 유지되어야 하므로, 이 CSS 파일에서 그 값들을 절대 건드리지 마라(인라인 스타일을 덮어쓰는 규칙을 쓰지 말 것). UI 크롬(테두리, 체커보드, 버튼, 선택 강조)만 다크모드 변수를 사용해라.

6. **반응형**: `@media (max-width: 480px)`(기존 브레이크포인트)에서 격자 `max-width`를 `min(90vw, 480px)` 등으로 축소, 팔레트 스와치 크기를 약간 줄이고(`24px` 등), 도구 버튼 행이 줄바꿈되게.

## 완료 후
파일을 다 쓴 뒤, 최종 응답에 정의한 CSS 변수 목록과 다크모드 대응 여부, 그리고 "그려진 그림의 색상은 테마와 무관하게 고정된다"는 요구사항을 어떻게 지켰는지 간단히 요약해라.
