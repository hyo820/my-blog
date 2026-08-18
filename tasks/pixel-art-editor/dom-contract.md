# DOM 계약: 픽셀 아트 에디터 (Work 1단계 산출물)

`src/templates.js`의 `renderPixelArtPage()`가 생성하는 정적 뼈대 HTML의 구조를 정의한다.
`pixel-art.js`(로직)와 `pixel-art.css`(스타일) 담당 서브에이전트는 이 문서만 보고
실제 HTML을 열어보지 않아도 정확히 연동할 수 있어야 한다.

렌더링되는 실제 `.content` 내부 HTML 전문은 아래 "5. 렌더링되는 정적 HTML 전문" 참고.

---

## 1. 팔레트 (`#palette`)

| 요소 | 선택자 | 설명 |
|---|---|---|
| 팔레트 컨테이너 | `#palette` (`.palette`) | 16개 색상 스와치 버튼 + 커스텀 색상 input을 순서대로 담는 flex-wrap 컨테이너 |
| 색상 스와치 (15개) | `.palette-swatch` | `<button type="button">`. `data-color` 속성에 CSS 색상 문자열(예: `"#ef4444"`)이 들어있다. `style="background-color: ..."`가 **정적 HTML에 이미 인라인으로 박혀 있으므로** JS가 배경색을 새로 지정할 필요는 없다(아래 "구현 방식 결정" 참고). |
| 투명 스와치 | `.palette-swatch.palette-swatch-transparent` | `data-color="transparent"`. 배경색 인라인 스타일이 **없다** — CSS가 `.palette-swatch-transparent`에 체커보드 배경(`--pixel-checker-a`/`--pixel-checker-b` 기반)을 그려야 한다. |
| 커스텀 색상 입력 | `#custom-color` (`.custom-color`) | `<input type="color">`. 초기값 `value="#000000"`. `input` 이벤트가 발생하면 그 값을 `currentColor`로 즉시 반영한다. |
| 현재 색상 미리보기 | `#current-color-preview` (`.current-color-preview`) | 빈 `<span>`. JS가 `currentColor`가 바뀔 때마다 `style.backgroundColor`를 갱신한다. `currentColor === null`(지우개/투명 선택)일 때는 `style.backgroundColor = ''`로 지우고 CSS가 이 상태를 체커보드로 보여줄 수 있도록 `.transparent` 클래스를 추가/제거한다(클래스명은 JS/CSS 담당자가 합의해 자유롭게 정해도 되며, 최소한 "투명 상태를 시각적으로 구분 가능"해야 한다는 요구사항만 고정 계약이다). |

### 정확한 `data-color` 값 목록 (순서대로, row 없이 한 줄에 16개 + 커스텀 입력)

| 순서 | 색상명 | `data-color` | 비고 |
|---|---|---|---|
| 1 | 검정 | `#000000` | |
| 2 | 흰색 | `#ffffff` | |
| 3 | 빨강 | `#ef4444` | |
| 4 | 주황 | `#f97316` | |
| 5 | 노랑 | `#facc15` | |
| 6 | 라임 | `#84cc16` | |
| 7 | 초록 | `#22c55e` | |
| 8 | 청록 | `#14b8a6` | |
| 9 | 하늘 | `#22d3ee` | |
| 10 | 파랑 | `#3b82f6` | |
| 11 | 남색 | `#6366f1` | |
| 12 | 보라 | `#a855f7` | |
| 13 | 분홍 | `#ec4899` | |
| 14 | 갈색 | `#92400e` | |
| 15 | 회색 | `#9ca3af` | |
| 16 | 투명 | `transparent` | `data-color="transparent"` (빈 문자열이 아님. JS는 `if (swatch.dataset.color === 'transparent')`로 판별하고 `currentColor = null`로 설정) |

### 선택 강조

- 정확히 하나의 `.palette-swatch` 또는 `#custom-color` 에만 `.selected` 클래스가 붙어 있어야 한다(정적 HTML에는 아무 것도 선택되어 있지 않다 — 초기 상태에서 JS가 로드되자마자 기본 선택을 정해야 한다면 첫 스와치(검정)에 `.selected`를 추가하는 것을 권장하되, 필수는 아니다. 반대로 초기 `currentColor`를 검정으로 미리 정해두는 것을 권장).
- 스와치를 클릭하면: 모든 `.palette-swatch`와 `#custom-color`에서 `.selected`를 제거하고, 클릭된 스와치에만 `.selected`를 추가한다.
- `#custom-color`의 `input` 이벤트가 발생하면: 모든 `.palette-swatch`에서 `.selected`를 제거하고 `#custom-color`에 `.selected`를 추가한다.
- `.selected` 스타일(CSS 담당): `2px solid var(--color-accent)` 테두리 + 약간의 `box-shadow` (spec.md 2절).
- 투명 스와치가 `.selected` 상태가 되는 것은 `#eraser-btn`이 활성 상태가 되는 것과 **완전히 동일한 사건**이다(2절 참고) — 하나의 클릭 핸들러(예: 공통 `selectColor(value)` 함수)로 스와치 클릭/지우개 버튼 클릭을 모두 처리하는 것을 권장한다.

---

## 2. 도구 버튼 (`.tool-row`)

| 요소 | 선택자 | 설명 |
|---|---|---|
| 지우개 버튼 | `#eraser-btn` (`.tool-btn`) | 클릭 시 `currentColor = null`로 설정하고, 팔레트의 "투명" 스와치(`.palette-swatch-transparent`)를 선택한 것과 동일하게 처리한다(그 스와치에 `.selected` 추가, 다른 선택 해제). **활성 상태 표시**: `currentColor === null`일 때 `#eraser-btn` 자체에도 `.active` 클래스를 추가한다(CSS: `#eraser-btn.active { border-color: var(--color-accent); }` 등, spec.md 2절 "도구 버튼" 참고). `currentColor`가 다시 색상으로 바뀌면 `.active`를 제거한다. |
| 전체 지우기 버튼 | `#clear-btn` (`.tool-btn`) | 클릭 시 확인창 없이 즉시 `pixels` 배열 256칸을 모두 `null`로 초기화하고 화면(`.pixel-cell` 256개)도 즉시 갱신한다. 지속적인 "활성" 상태는 없다(순간 동작 버튼이므로 `.active` 클래스 불필요). |
| PNG 저장 버튼 | `#save-btn` (`.tool-btn`) | 클릭 시 spec.md 1절 "PNG 저장" 절차를 수행한다. 지속적인 "활성" 상태 없음. |

세 버튼 모두 공통 클래스 `.tool-btn`을 가지므로 CSS는 `.tool-btn`에 공통 스타일(테두리/패딩/radius/hover)을 적용하고, `#eraser-btn.active`에만 강조 스타일을 추가하면 된다.

---

## 3. 격자 (`#pixel-grid`)

```
#pixel-grid (.pixel-grid)         ← CSS Grid 16열×16행 컨테이너, 배경에 체커보드 패턴
  └─ .pixel-cell × 256             ← 정적으로 이미 존재. data-index="0"~"255", row-major
```

- `.pixel-cell`은 `row = Math.floor(index / 16)`, `col = index % 16`으로 계산되는 위치에 CSS Grid auto-placement로 자동 배치된다(별도 `grid-column`/`grid-row` 인라인 스타일 없음 — 2048 타일과 달리 셀이 애초에 고정 격자라서 위치 지정이 필요 없다).
- **구현 방식 결정: 셀 색상 반영은 `style.backgroundColor` 직접 설정 방식을 채택한다.**
  이유: 커스텀 색상(`<input type="color">`)에서 임의의 hex 값이 나올 수 있는데, `data-color` 속성 + CSS 속성선택자 방식을 쓰면 CSS가 사전에 알 수 없는 색상 값마다 규칙을 동적으로 추가해야 해서(예: `[data-color="#a1b2c3"] { background: #a1b2c3 }`) CSSOM 조작이 필요해지고 번거롭다. 대신 JS가 `pixels[i]`가 색상 문자열이면 `cell.style.backgroundColor = pixels[i]`, `null`이면 `cell.style.backgroundColor = ''`(인라인 스타일 제거)로 직접 설정한다.
  - `cell.style.backgroundColor = ''`로 지우면 `.pixel-cell`의 CSS 기본 배경(`background: transparent` 등)이 노출되고, 그 아래 `#pixel-grid` 컨테이너의 체커보드 배경이 비쳐 보인다(spec.md "구현 방식 결정" 절 참고). 즉 셀 자체는 항상 투명 배경을 기본값으로 갖고, 채색된 경우에만 인라인으로 덮어쓴다.
  - JS는 `data-index`를 읽어 `pixels` 배열 인덱스와 1:1 매핑하면 된다. 클릭/드래그 이벤트는 `#pixel-grid`에 위임(`mousedown`/`mouseover`)해 `event.target.closest('.pixel-cell')`의 `data-index`를 사용할 것을 권장(spec.md 3절).
- CSS 담당자는 `#pixel-grid`에 `grid-template-columns: repeat(16, 1fr); grid-template-rows: repeat(16, 1fr);`를 적용하고, 각 `.pixel-cell`은 `aspect-ratio: 1 / 1; border: 1px solid var(--color-border);`로 정사각형 격자선을 표시한다(spec.md 2절).
- `.pixel-cell`에는 그 외 어떤 데이터 속성도 없다(선택 상태 없음 — 격자 칸은 "선택"되는 대상이 아니라 "채색"되는 대상).

---

## 4. 내보내기 캔버스 (`#export-canvas`)

| 요소 | 선택자 | 설명 |
|---|---|---|
| 내보내기 캔버스 | `#export-canvas` | `<canvas width="256" height="256" hidden>`. 화면에는 항상 숨겨져 있다(`hidden` 속성 유지, JS가 제거하지 않음). 오직 `#save-btn` 클릭 시점에만 JS가 이 캔버스의 2D 컨텍스트를 얻어 `pixels` 배열 내용을 그린 뒤 `toDataURL('image/png')`로 PNG를 생성한다. 화면에 보이는 `#pixel-grid`와는 완전히 독립적인 요소이며 JS가 매 채색마다 이 캔버스를 갱신할 필요는 없다(저장 시점에만 그리면 충분). |

- 크기: 정확히 256×256px (`SCALE = 16` 상수 × 16칸, spec.md 1절 "PNG 저장" 참고). `width`/`height` 속성이 이미 정적 HTML에 박혀 있으므로 JS/CSS가 별도로 크기를 지정할 필요 없음.
- 용도: PNG 저장 전용. 화면 렌더링에는 전혀 관여하지 않는다(CSS도 `hidden` 속성을 굳이 덮어쓸 필요 없음).

---

## 5. 렌더링되는 정적 HTML 전문 (`renderPixelArtPage()`의 `.content` 내부)

```html
<h1>픽셀 아트 에디터</h1>
<div class="palette-panel">
  <div id="palette" class="palette">
  <button type="button" class="palette-swatch" data-color="#000000" style="background-color: #000000;" aria-label="검정"></button>
  <button type="button" class="palette-swatch" data-color="#ffffff" style="background-color: #ffffff;" aria-label="흰색"></button>
  <button type="button" class="palette-swatch" data-color="#ef4444" style="background-color: #ef4444;" aria-label="빨강"></button>
  <button type="button" class="palette-swatch" data-color="#f97316" style="background-color: #f97316;" aria-label="주황"></button>
  <button type="button" class="palette-swatch" data-color="#facc15" style="background-color: #facc15;" aria-label="노랑"></button>
  <button type="button" class="palette-swatch" data-color="#84cc16" style="background-color: #84cc16;" aria-label="라임"></button>
  <button type="button" class="palette-swatch" data-color="#22c55e" style="background-color: #22c55e;" aria-label="초록"></button>
  <button type="button" class="palette-swatch" data-color="#14b8a6" style="background-color: #14b8a6;" aria-label="청록"></button>
  <button type="button" class="palette-swatch" data-color="#22d3ee" style="background-color: #22d3ee;" aria-label="하늘"></button>
  <button type="button" class="palette-swatch" data-color="#3b82f6" style="background-color: #3b82f6;" aria-label="파랑"></button>
  <button type="button" class="palette-swatch" data-color="#6366f1" style="background-color: #6366f1;" aria-label="남색"></button>
  <button type="button" class="palette-swatch" data-color="#a855f7" style="background-color: #a855f7;" aria-label="보라"></button>
  <button type="button" class="palette-swatch" data-color="#ec4899" style="background-color: #ec4899;" aria-label="분홍"></button>
  <button type="button" class="palette-swatch" data-color="#92400e" style="background-color: #92400e;" aria-label="갈색"></button>
  <button type="button" class="palette-swatch" data-color="#9ca3af" style="background-color: #9ca3af;" aria-label="회색"></button>
  <button type="button" class="palette-swatch palette-swatch-transparent" data-color="transparent" aria-label="투명"></button>
  <input type="color" id="custom-color" class="custom-color" value="#000000" aria-label="커스텀 색상">
  </div>
  <div class="current-color-box">
    <span class="current-color-label">현재 색상</span>
    <span id="current-color-preview" class="current-color-preview"></span>
  </div>
</div>
<div class="tool-row">
  <button id="eraser-btn" type="button" class="tool-btn">🧹 지우개</button>
  <button id="clear-btn" type="button" class="tool-btn">🗑️ 전체 지우기</button>
  <button id="save-btn" type="button" class="tool-btn">💾 PNG로 저장</button>
</div>
<div id="pixel-grid" class="pixel-grid">
  <div class="pixel-cell" data-index="0"></div>
  <!-- ... .pixel-cell 총 256개(data-index="0"~"255") 반복 ... -->
</div>
<canvas id="export-canvas" width="256" height="256" hidden></canvas>
<p class="pixel-instructions">칸을 클릭하거나 드래그해서 그림을 그려보세요.</p>
```

이 body는 `layout()`을 통해 기존 `.site-header`/`.site-footer`로 감싸지고,
`<head>`에 `../assets/css/pixel-art.css`가, `</body>` 직전에
`../assets/js/pixel-art.js`가 자동으로 삽입된다(6절 참고).

---

## 6. `layout()` 호출 (JS/CSS 담당자는 참고만, 수정 불필요)

`renderPixelArtPage()`는 다음과 같이 `layout()`을 호출한다:

```js
layout({
  title: '픽셀 아트 에디터',
  rootPath: '..',
  bodyHtml: body,
  extraStyles: ['assets/css/pixel-art.css'],
  extraScripts: ['assets/js/pixel-art.js'],
});
```

**`rootPath`는 `'..'`다.** `dist/pixel-art/index.html`은 `dist/` 바로 아래 1단계
디렉터리(`pixel-art/`)이므로 루트까지 한 단계만 올라가면 된다(`dist/game/2048/index.html`이
2단계 깊이라 `'../..'`를 쓰는 것과 다르다). 빌드 후 실제 산출물에서
`<link rel="stylesheet" href="../assets/css/style.css">`, `<link rel="stylesheet"
href="../assets/css/pixel-art.css">`, `<script src="../assets/js/theme.js">`,
`<script src="../assets/js/pixel-art.js">`, `<a class="site-title" href="../">`로
확인 완료.

CSS/JS 담당자는 `assets/css/pixel-art.css`, `assets/js/pixel-art.js` 경로에 파일을
만들기만 하면 `dist/pixel-art/index.html`에 자동으로 링크/스크립트 태그가 삽입된다.
별도 HTML 수정 불필요.

---

## 7. 사이트 헤더 변경 사항 (모든 페이지 공통, 참고용)

`layout()`의 `.site-header`에 픽셀 아트 에디터로 가는 링크가 추가되었다:

```html
<a class="header-link" href="${rootPath}/pixel-art/">🎨 픽셀 아트</a>
```

기존 `🎮 2048` 링크 바로 뒤, `#theme-toggle` 버튼 앞에 위치하며, 모든 페이지(index,
포스트, 태그, 2048 게임, 픽셀 아트)에 공통으로 노출된다. 배치 순서:
`.site-title` → `🎮 2048` → `🎨 픽셀 아트` → `#theme-toggle`.

### `assets/css/style.css`에 대한 최소 예외 조정 (spec.md 5절에서 허용된 범위)

기존 규칙 `.header-link { margin-left: auto; ... }`는 헤더 링크가 하나뿐일 때는
문제없이 동작하지만(그 하나의 링크를 오른쪽 끝으로 밀어냄), 이번에 `.header-link`
클래스를 가진 요소가 **두 개**(`🎮 2048`, `🎨 픽셀 아트`)가 되면서 CSS 값 기반으로
다음과 같은 실제 레이아웃 버그가 확인되어 최소 범위로 수정했다:

- Flexbox 스펙상 `margin-left: auto`가 여러 flex item에 동시에 걸리면, 컨테이너의
  남는 여유 공간(free space)이 auto 마진들에 **균등 분배**된다. `.header-link`가
  두 개 다 `margin-left: auto`를 가지면 여유 공간의 절반씩이 "site-title→2048 링크"
  사이와 "2048 링크→픽셀아트 링크" 사이에 각각 들어가 버려, 의도한 "두 링크가 서로
  붙어 있고 전체 링크 묶음만 오른쪽으로 밀림" 형태가 아니라 두 링크 사이가 눈에
  띄게 벌어지는 결과가 나온다(뷰포트가 넓을수록 벌어지는 간격이 커짐).
- **수정 내용**: `.header-link`의 기본 규칙에서 `margin-left: auto`를 제거하고,
  대신 `.site-title + .header-link { margin-left: auto; }`(인접 형제 선택자)를
  추가했다. 이렇게 하면 `.site-title` 바로 다음에 오는 **첫 번째** `.header-link`
  (`🎮 2048`)에만 `margin-left: auto`가 적용되어 링크 묶음 전체를 오른쪽으로
  밀어내고, 그 뒤를 따르는 `🎨 픽셀 아트` 링크와 `#theme-toggle`은 `.site-header`의
  기존 `gap: 0.75rem`만큼만 떨어져 자연스럽게 이어붙는다.
- 이 변경은 헤더 링크가 하나뿐이던 기존 페이지 동작에는 영향이 없다(`.site-title +
  .header-link` 선택자가 그 하나의 링크에 동일하게 매치되므로 이전과 동일하게
  오른쪽으로 밀려남).
- **브라우저 렌더링으로 실측하지 못했다**(이 환경에 브라우저가 없음). 위 판단은
  CSS Flexbox 스펙(auto margin이 여러 개일 때 여유 공간을 균등 분배한다는 규칙)에
  근거한 값 기반 추론이다. Review 단계에서 실제 브라우저로 렌더링해 헤더의
  두 링크 간격이 자연스럽게 붙어 있는지(비정상적으로 벌어지지 않는지) 반드시
  재확인할 것을 권장한다.

### 좁은 화면(360~480px)에서 헤더 겹침/잘림 검토 (CSS 값 기반 추론)

브라우저가 없어 실제 렌더링 대신 CSS 선언 값으로 추론했다. 360px 뷰포트 기준:

- `@media (max-width: 480px)`에서 `.site-header` padding이 `1.1rem 1rem 0.75rem`로
  줄어든다(좌우 padding 각 1rem ≈ 16px, 폭 기준 font-size clamp(16px, 1.5vw, 18px)가
  360px 뷰포트에서는 최솟값 16px로 고정되므로 `1rem = 16px`). 헤더 내부 사용 가능
  폭 ≈ 360 − 32 = 328px.
- `.site-header`는 `display: flex; gap: 0.75rem(12px)`이고 `flex-wrap`이 지정되어
  있지 않다(기본값 `nowrap`). 네 아이템(`.site-title`, 두 `.header-link`,
  `#theme-toggle`)의 대략적인 콘텐츠 폭을 글자 수 기반으로 추정하면:
  - `.site-title` "My Blog" (font-weight 700, 1.1rem≈17.6px) ≈ 75~85px
  - `🎮 2048` 링크 (1rem≈16px) ≈ 65~80px
  - `🎨 픽셀 아트` 링크 (한글 4자 + 이모지, 1rem≈16px) ≈ 90~105px
  - `#theme-toggle` (이모지 1개 + padding 0.35rem/0.6rem + border 1px×2) ≈ 38~45px
  - 합계 ≈ 268~315px + gap 3개(36px) = **약 304~351px**
- 328px 가용 폭과 비교하면 **여유가 거의 없거나(최선 추정치 기준 약 –23px까지)
  근소하게 초과할 수 있는 경계선 상황**이다. 정확한 폰트 렌더링 폭은 브라우저
  글꼴 메트릭에 따라 달라지므로 이 추정만으로 "확실히 안전하다"고 단정할 수 없다.
- `.site-header`에 `flex-wrap: wrap`이 없으므로, 실제로 폭이 초과되면 브라우저는
  기본 `flex-shrink: 1`에 따라 아이템들을 축소시키려 하고, 텍스트가 있는
  `.header-link`/`.site-title`은 최소 콘텐츠 폭까지는 줄바꿈(`white-space: normal`
  기본값)되어 두 줄로 표시될 수 있다(레이아웃이 깨지지는 않지만 다소 빽빽해 보일
  수 있음). 완전히 잘리거나(overflow: hidden 없음) 겹치는(position 겹침 없음)
  상황은 발생하지 않을 것으로 추론되지만, **정확한 여유 폭 계산은 실제 브라우저
  렌더링이 필요하다.** Review 단계에서 360px/375px/480px 각각 실측 확인을
  권장하며, 필요 시 `.site-header`에 `flex-wrap: wrap`을 추가하는 것을 후속
  조정안으로 제안한다(이번 Work 1단계 범위 밖이라 적용하지 않음).

---

## 8. 알려진 이슈 / 후속 확인 필요 사항 (Review 단계 인계)

- 위 7절에서 설명한 `.header-link` 간격 수정은 CSS 스펙 기반 추론으로 판단했으며
  실제 브라우저로 검증되지 않았다. Review 단계에서 반드시 시각적으로 재확인할 것.
- 360px 폭에서 헤더 네 요소(제목/링크 2개/토글)가 줄바꿈 없이 한 줄에 들어가는지도
  경계선 상황이므로 Review 단계에서 실측 필요. 필요하면 `.site-header`에
  `flex-wrap: wrap`을 추가하는 것을 고려할 수 있다(이번 범위 밖).
- `.pixel-cell`이 `null` 상태일 때 컨테이너(`#pixel-grid`)의 체커보드 배경이
  각 칸의 `border: 1px solid var(--color-border)` 격자선과 함께 자연스럽게
  보이는지는 CSS 담당자가 실제 값(`--pixel-checker-a`/`--pixel-checker-b`,
  체커보드 패턴 크기)을 정할 때 시각적으로 확인해야 한다(이 문서는 구조 계약만
  다루므로 패턴의 구체적 크기/색상값은 CSS 담당자 재량).
