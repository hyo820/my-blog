# DOM 계약: 2048 게임 (Work 1단계 산출물)

`src/templates.js`의 `renderGamePage()`가 생성하는 정적 뼈대 HTML의 구조를 정의한다.
`game-2048.js`(로직)와 `game-2048.css`(스타일) 담당 서브에이전트는 이 문서만 보고
실제 HTML을 열어보지 않아도 정확히 연동할 수 있어야 한다.

렌더링되는 실제 body HTML 전문은 아래 "5. 렌더링되는 정적 HTML 전문" 참고.

---

## 1. 점수판

| 요소 | 선택자 | 설명 |
|---|---|---|
| 현재 점수 박스 | `.score-box` (2개 중 첫 번째) | 스타일링용 컨테이너 |
| 현재 점수 값 | `#score-current` | 텍스트 콘텐츠를 숫자 문자열로 갱신(예: `"128"`). 초기값 `"0"`. |
| 최고 점수 값 | `#score-best` | 텍스트 콘텐츠를 숫자 문자열로 갱신. 초기값 `"0"`. |
| 새 게임 버튼 | `#new-game-btn` | 클릭 시 즉시 새 게임 시작(확인 없음). |

JS는 `#score-current`/`#score-best`의 `textContent`만 바꾸면 된다. 라벨(`.score-label`,
"점수"/"최고 점수" 텍스트)은 정적 HTML에 이미 있으므로 건드릴 필요 없음.

---

## 2. 그리드 / 타일 렌더링 방식

**선택한 방식: 배경 셀(정적) + 타일 레이어(JS가 매 이동마다 통째로 다시 그림).**

```
#game-grid (.game-grid)          ← position: relative, CSS Grid 4열×4행 컨테이너
  ├─ .grid-cell × 16              ← 정적 배경 칸(빈 칸 표시용), 이미 HTML에 존재. JS가 건드리지 않음.
  ├─ #tile-layer (.tile-layer)    ← position: absolute; inset: 0; 이며 game-grid와
  │                                  동일한 4열×4행 CSS Grid를 정의(CSS 담당자가 game-grid와
  │                                  똑같은 grid-template-columns/rows, gap 값을 적용해야
  │                                  타일이 배경 칸과 정확히 겹친다).
  │                                  JS가 매 상태 변경(이동/새게임/초기화)마다
  │                                  innerHTML을 비우고 타일 div를 다시 채워 넣는 "전체 재렌더" 방식.
  └─ #game-overlay (.game-overlay) ← 승리/패배 오버레이. 3절 참고.
```

- `#game-grid`, `.grid-cell` 16개, `#tile-layer`, `#game-overlay`는 정적 HTML에
  이미 순서대로 존재한다 (`.grid-cell` 16개가 먼저, 그다음 `#tile-layer`, 그다음
  `#game-overlay`). CSS는 `#tile-layer`와 `#game-overlay`를 `position: absolute; inset: 0;`
  로 `#game-grid` 위에 겹쳐야 한다(`#game-grid`는 `position: relative` 필요).
- `.grid-cell`은 순서대로 row-major(왼쪽→오른쪽, 위→아래) 배치: 인덱스 0~3이 1행,
  4~7이 2행, 8~11이 3행, 12~15가 4행. `.grid-cell`은 내용 없는 빈 `<div>`이며 CSS Grid
  auto-placement로 자동 배치된다(별도 `data-*` 없음).

### 타일 렌더링 규칙 (JS가 매 이동/상태 변경 후 수행)

1. `#tile-layer`의 `innerHTML`을 비운다.
2. 보드 배열(4x4, `row`/`col`은 0-indexed)에서 값이 0이 아닌 각 칸마다 타일 `<div>`를
   생성해 `#tile-layer`에 append한다:
   ```html
   <div class="tile" data-value="128" style="grid-column: 3; grid-row: 2;">128</div>
   ```
   - `grid-column`/`grid-row`는 **1-indexed** (`col + 1`, `row + 1`).
   - `data-value` 속성 값은 타일 숫자(문자열, 예: `"2"`, `"4"`, ..., `"2048"`, 그 이상도 가능).
     CSS는 `.tile[data-value="2"]`, `.tile[data-value="2048"]` 같은 속성 선택자로 색을 입힌다.
   - 타일의 `textContent`도 동일한 숫자.
   - class는 항상 `tile` 하나만 사용(추가 상태 class 불필요. 값별 스타일은 `data-value`
     속성 선택자로 처리).
3. `#tile-layer`의 CSS Grid 설정(열/행 개수, gap)은 `#game-grid`와 반드시 동일해야
   타일이 배경 칸 위에 정확히 겹쳐진다. (CSS 담당자 책임)

이 방식을 선택한 이유: 애니메이션(이동/등장 트랜지션)이 필수 요구사항이 아니므로
매번 전체 재렌더가 가장 단순하고 버그 여지가 적다. 추후 애니메이션을 추가하고
싶다면 `.tile`에 `transition: grid-column, grid-row` 등을 시도할 수 있으나 이번
범위에는 포함되지 않는다.

---

## 3. 승리/패배 오버레이

| 요소 | 선택자 | 설명 |
|---|---|---|
| 오버레이 컨테이너 | `#game-overlay` (`.game-overlay`) | 기본 상태: `hidden` 속성 있음(숨김). 표시하려면 `hidden` 속성을 제거하고, 다시 숨기려면 `hidden` 속성을 추가. |
| 메시지 영역 | `#overlay-message` | 승리 시 `textContent`를 `"You Win! 🎉"` 류로, 패배 시 `"Game Over"` 류로 설정. |
| 계속하기 버튼 | `#continue-btn` | 승리 시에만 노출(`hidden` 속성 제거), 패배 시에는 `hidden` 속성 유지(숨김). 클릭 시 오버레이를 닫고(`#game-overlay`에 `hidden` 재설정) 게임을 이어서 진행. |
| 오버레이 안 새 게임 버튼 | `#overlay-new-game-btn` | 승리/패배 모두에서 노출. `#new-game-btn`과 별개의 id(같은 페이지에 버튼 2개 존재하므로 id 중복 방지). 동작은 `#new-game-btn`과 동일(새 게임 시작). |

- `#game-grid`는 `.game-overlay`가 `position: absolute; inset: 0;`로 겹칠 수 있도록
  `position: relative`여야 한다(위 2절과 동일 요구사항, CSS 담당자가 한 번만 처리하면 됨).
- 승리 판정: `2048` 타일이 "처음" 생성되는 순간에만 오버레이를 띄운다(이후 계속하기를
  누르면 같은 판에서 다시 2048이 나와도 재트리거하지 않음 — JS 로직에서 "이미 승리
  오버레이를 본 적 있는지" 플래그로 관리).
- 패배 판정 후에는 `#continue-btn`을 숨긴 채로 `#overlay-new-game-btn`만 보여준다.

---

## 4. 새 게임 버튼이 2개인 이유

- `#new-game-btn`: 점수판 옆의 상시 노출 버튼.
- `#overlay-new-game-btn`: 승리/패배 오버레이 안의 버튼.

두 버튼 모두 같은 동작(새 게임 시작: 보드 초기화, 점수 0, 랜덤 타일 2개 생성,
오버레이 닫기)을 수행해야 하며, JS는 두 버튼 모두에 동일한 핸들러를 등록하면 된다.

---

## 5. 렌더링되는 정적 HTML 전문 (`renderGamePage()`의 `.content` 내부)

```html
<h1>2048</h1>
<div class="score-board">
  <div class="score-box">
    <span class="score-label">점수</span>
    <span id="score-current" class="score-value">0</span>
  </div>
  <div class="score-box">
    <span class="score-label">최고 점수</span>
    <span id="score-best" class="score-value">0</span>
  </div>
  <button id="new-game-btn" type="button">새 게임</button>
</div>
<div id="game-grid" class="game-grid">
  <div class="grid-cell"></div>
  <!-- ... .grid-cell 총 16개 반복 ... -->
  <div id="tile-layer" class="tile-layer"></div>
  <div id="game-overlay" class="game-overlay" hidden>
    <div class="overlay-content">
      <p id="overlay-message" class="overlay-message"></p>
      <div class="overlay-actions">
        <button id="continue-btn" type="button" hidden>계속하기</button>
        <button id="overlay-new-game-btn" type="button">새 게임</button>
      </div>
    </div>
  </div>
</div>
<p class="game-instructions">방향키로 타일을 움직여 2048을 만들어보세요.</p>
```

이 body는 `layout()`을 통해 기존 `.site-header`/`.site-footer`로 감싸지고,
`<head>`에 `../../assets/css/game-2048.css`가, `</body>` 직전에
`../../assets/js/game-2048.js`가 자동으로 삽입된다(`layout()`의 신규
`extraStyles`/`extraScripts` 파라미터 사용, 아래 6절 참고).

---

## 6. `layout()` 확장 (JS/CSS 담당자는 참고만, 수정 불필요)

`src/templates.js`의 `layout()`이 `extraStyles`/`extraScripts` 배열 파라미터를
받도록 확장되었다(둘 다 기본값 `[]`, 기존 `renderIndexPage`/`renderPostPage`/
`renderTagPage` 호출은 그대로 동작). `renderGamePage()`는 다음과 같이 호출한다:

```js
layout({
  title: '2048 게임',
  rootPath: '../..',
  bodyHtml: body,
  extraStyles: ['assets/css/game-2048.css'],
  extraScripts: ['assets/js/game-2048.js'],
});
```

즉 CSS/JS 담당자는 `assets/css/game-2048.css`, `assets/js/game-2048.js` 경로에
파일을 만들기만 하면 게임 페이지(`dist/game/2048/index.html`)에 자동으로
링크/스크립트 태그가 삽입된다. 별도 HTML 수정 불필요.

---

## 7. 사이트 헤더 변경 사항 (모든 페이지 공통, 참고용)

`layout()`의 `.site-header`에 게임 페이지로 가는 링크가 추가되었다:

```html
<a class="header-link" href="${rootPath}/game/2048/">🎮 2048</a>
```

`.site-title`와 `#theme-toggle` 사이에 위치하며, 모든 페이지(index, 포스트, 태그,
게임 페이지)에 공통으로 노출된다. `.header-link`에 대한 전용 스타일은 이번
범위(`assets/css/style.css` 수정 금지)에 포함되지 않으며, 기존 `a { color:
var(--color-accent); }` 전역 규칙만 적용된 상태다.

---

## 8. localStorage 키 (참고)

spec.md 1절에 명시된 대로 최고 점수 저장 키는 `game2048.best`를 사용한다
(JS 담당자가 구현, 이 문서는 구조 계약이므로 재확인 차원에서 기록).
