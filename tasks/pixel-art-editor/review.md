# Review: 픽셀 아트 에디터

## 종합 결론

**통과 — 발견된 이슈 없음(치명적/차단 이슈 0건).** 코드 추적 + 실제 macOS Safari 렌더링(스크린샷 1건) +
정밀 폰트 메트릭 계산(3개 추가 뷰포트)으로 교차 검증한 결과, spec.md 6절 체크리스트 전 항목이 통과다.
사소한 코드 가독성 제안 1건(기능적 버그 아님, 수정 불필요)만 참고로 남긴다.

- 검증 방식: **부분적으로 실제 브라우저 사용** — macOS Safari 26.6을 로컬 정적 서버(`dist/`, `python3 -m
  http.server`)에 실제로 접속시켜 360px 뷰포트에서 스크린샷 1장을 확보했다(아래 2절 참고). 이후
  `screencapture`/디스플레이 캡처가 이 환경(가상 디스플레이로 추정)에서 비활성화되어 375/480/720px
  스크린샷은 추가로 얻지 못했다. 이를 보완하기 위해 macOS AppKit(CoreText, San Francisco 시스템 폰트 —
  Safari의 `-apple-system`이 실제로 매핑되는 폰트와 동일)으로 헤더 텍스트의 **실측 렌더 폭**을 Swift
  스크립트로 계산해 375/480/720px을 정량적으로 교차 검증했다(글자 수 기반 추정이 아님). 나머지
  상호작용(팔레트/드래그/PNG 저장/다크모드)은 브라우저 클릭 자동화 도구(Playwright/Puppeteer 등)와
  Accessibility 권한이 이 환경에 없어 **코드 추적**으로 검증했다.

---

## 1. 빌드 검증 — 통과

- `node build.js` 에러 없이 완료: `빌드 완료: 포스트 3개, 태그 5개 → dist/`
- 생성 확인: `dist/pixel-art/index.html`, `dist/assets/css/pixel-art.css`, `dist/assets/js/pixel-art.js` 모두 존재.
- 회귀 없음: `git diff HEAD -- build.js src/templates.js assets/css/style.css` 확인 결과 각 파일에 픽셀 아트
  관련 추가분(및 `.header-link` margin 조정)만 존재하고 기존 로직 삭제/변경 없음. `dist/index.html`,
  `dist/posts/*/index.html`, `dist/tags/*/index.html`, `dist/game/2048/index.html`에서 헤더에
  `🎨 픽셀 아트` 링크가 정확한 상대경로로 추가된 것 외 다른 구조 변화 없음(grep으로 4개 페이지 전부 확인).

---

## 2. 헤더 레이아웃 검증 (최우선 확인 항목) — **문제 없음, 이슈 미발견**

### 실제 브라우저 스크린샷 (360px, 실측)

로컬 서버(`http://localhost:8934/`)에 Safari로 접속해 창 폭을 360px로 리사이즈하고 헤더 영역을 캡처했다
(다크 모드가 시스템 기본값으로 적용된 상태). 결과: **"My Blog" · 🎮 2048 · 🎨 픽셀 아트 · 🌓 토글 네 요소가
줄바꿈 없이 한 줄에 모두 들어갔고, 잘리거나 겹치는 요소가 전혀 없었다.** 2048 링크와 픽셀 아트 링크
사이 간격도 `site-title`과 2048 링크 사이 간격보다 좁고 자연스러워, dom-contract.md 7절이 우려한
"margin-left: auto 이중 적용으로 인한 간격 벌어짐" 버그는 **실제로 발생하지 않음**을 확인했다(현재 코드는
이미 `.site-title + .header-link`로 수정되어 있어 예상대로 동작).

이후 375/480/720px 스크린샷을 추가로 시도했으나, 이 환경의 화면 캡처(`screencapture`)가 최초 1회 성공
후 `"could not create image from display"` 오류로 비활성화되어(가상/원격 디스플레이 세션 특성으로 추정)
추가 스크린샷은 얻지 못했다. Accessibility 권한도 없어(`osascript`의 System Events 접근 거부, 코드
-1719) 창 크기·위치를 좌표 기반으로 재확인하는 것도 불가능했다.

### 정밀 폰트 메트릭 계산 (375/480/720px 보완 검증)

dom-contract.md 7절의 "글자 수 기반 추정"(±범위가 넓어 360px에서 여유 –23px~+거의없음으로 불확실했던
값)을 macOS AppKit(`NSAttributedString.size()`, San Francisco 시스템 폰트 — Safari의 CSS
`-apple-system`이 실제로 렌더링에 쓰는 폰트와 동일 엔진)으로 **실측 글리프 폭**을 계산해 대체했다.

| 요소 | 계산된 실제 렌더 폭 |
|---|---|
| `.site-title` "My Blog" (bold, 17.6px) | 67.47px |
| `.header-link` "🎮 2048" (16px) | 66.19px |
| `.header-link` "🎨 픽셀 아트" (16px) | 86.73px |
| `#theme-toggle` (이모지 + padding 0.6rem×2 + border 2px) | 44.20px |
| **4개 아이템 합 + gap 3×12px** | **300.60px** |

뷰포트별 `.site-header` 좌우 padding과 사용 가능 폭, 여유(slack) 계산:

| 뷰포트 | 헤더 좌우 padding | 사용 가능 폭 | 여유(slack) | 결과 |
|---|---|---|---|---|
| 360px | 32px (`1rem`×2, `@media max-width:480px`) | 328px | **+27.4px** | 줄바꿈 없이 한 줄에 들어감 |
| 375px | 32px | 343px | **+42.4px** | 여유 있음 |
| 480px | 32px | 448px | **+147.4px** | 여유 충분 |
| 720px | 40px (`1.25rem`×2, 기본 padding) | 680px | **+379.4px** | 여유 매우 충분 |

(참고: 이 뷰포트 범위(360~900px)에서는 `font-size: clamp(16px, 1.5vw, 18px)`의 `1.5vw` 항이 16px을
넘지 않아 — `1.5vw ≥ 16px`이 되려면 뷰포트가 약 1067px 이상이어야 함 — body 기준 폰트 크기가 항상
16px로 고정된다. 계산에 이를 반영했다.)

**결론: dom-contract.md 7-8절이 "경계선 상황"으로 표시했던 360px 케이스도 실제로는 약 27px의 여유가
있어 줄바꿈이 발생하지 않는다.** 360px 실측 스크린샷 결과와도 정확히 일치한다. `flex-wrap: wrap` 추가는
**불필요**하며(적용해도 해가 되진 않지만, 현재 스펙 범위에서 필요하지 않음), 현재 상태 그대로 유지를
권장한다.

**단, 주의할 점**: 위 계산은 macOS/Safari(San Francisco 폰트) 기준이다. Windows(Segoe UI)/Android
(Roboto)에서는 글리프 폭이 다소 다를 수 있으나, 지금 계산된 여유폭(360px에서 +27.4px, 이는 필요
폭 300.6px의 약 9%에 해당)을 고려하면 일반적인 폰트 간 폭 차이(수 px 수준)로는 뒤집히지 않을
가능성이 높다. 다만 실기기/타 브라우저에서의 육안 확인은 여전히 유의미하므로, 여유가 있다면 배포 후
한 번 더 확인을 권장한다(차단 이슈는 아님).

---

## 3. 체크리스트 검증 (spec.md 6절)

| 항목 | 결과 | 근거 |
|---|---|---|
| 격자 16×16(256칸), row-major | **통과** | `templates.js`가 `data-index="0"`~`"255"` 256개 `.pixel-cell`을 순서대로 생성, CSS Grid 기본 auto-flow(row)가 `row=⌊i/16⌋, col=i%16`과 일치. `dist/pixel-art/index.html`에서 개수(256)·순서 실측 확인. |
| 클릭 좌표=채색 좌표 일치(오프바이원 없음) | **통과(코드 추적)** | `paintCell()`이 `cell.dataset.index`를 그대로 `pixels[index]`에 매핑, 이벤트 위임(`closest('.pixel-cell')`)이라 좌표 변환 계산이 없어 오프바이원 발생 여지 자체가 없음. |
| 드래그 중 통과 칸 모두 채색, 격자 밖 드래그 안전 | **통과(코드 추적)** | `mousedown`(즉시 채색)→`mouseover`(드래그 중 채색)→`window.mouseup`(전역 종료) 구조가 spec 그대로 구현됨. 격자 밖으로 나가면 `mouseover`가 `#pixel-grid`에서 발생하지 않아 자연히 무시되고 에러 없음. |
| 스와치 선택/강조 단일성 | **통과(코드 추적)** | `selectColor()`가 매번 전체 `.selected` 제거 후 하나만 추가하는 단일 경로로 통일. |
| 커스텀 색상 즉시 반영 | **통과(코드 추적)** | `#custom-color`의 `input` 이벤트 → `selectColor(value, customColorEl)`. |
| 지우개↔투명 스와치 상태 공유 | **통과(코드 추적)** | 둘 다 동일하게 `selectColor(null, transparentSwatch)`를 거치며, `#eraser-btn.active`와 투명 스와치 `.selected`가 함께 갱신됨(`updateEraserActiveState()`가 `selectColor` 내부에서 항상 호출됨). |
| 전체 지우기(확인창 없음, 즉시 256칸 초기화) | **통과(코드 추적)** | `clearBtn` 클릭 → `pixels.fill(null)` + 모든 `.pixel-cell` 인라인 배경 제거, `confirm()` 등 차단 로직 없음. |
| PNG 화면 일치 / 256×256 / 좌표 매핑 | **통과(코드 추적)** | `drawExportCanvas()`가 spec 1절 알고리즘(`row=⌊i/16⌋, col=i%16`, `fillRect(col*16,row*16,16,16)`)과 동일. `<canvas width="256" height="256">` 확인. |
| 투명 알파 보존 | **통과(코드 추적)** | 매 저장 시 `ctx.clearRect(0,0,256,256)`로 초기화 후 `null`이 아닌 칸만 `fillRect` — 미채색 칸은 알파 0 유지. |
| 파일명 형식 `pixel-art-YYYYMMDD-HHmmss.png` | **통과(코드 추적)** | `formatTimestamp()`가 `getFullYear()+pad2(month+1)+pad2(date)+'-'+pad2(h)+pad2(m)+pad2(s)`로 정확히 해당 포맷 생성, 매 호출 `new Date()` 기준이라 반복 저장 시 값이 달라짐(초 단위까지 같으면 동일 파일명이 될 수 있으나 이는 spec 요구사항 밖). |
| 빈 캔버스 저장 시 정상 동작 | **통과(코드 추적)** | 별도 가드 없이 `savePng()`가 항상 실행되며 `pixels`가 전부 `null`이어도 `drawExportCanvas()`가 그냥 아무것도 안 그리고 넘어감 → 완전 투명 PNG 다운로드. spec이 요구하는 "경고 없음" 조건도 충족. |
| 다크모드 UI 대비 / 픽셀 색상 테마 독립성 | **통과(코드 추적)** | 픽셀 색상은 오직 `cell.style.backgroundColor` 인라인으로만 설정되고 CSS가 이를 건드리지 않음(`pixel-art.css` 주석에도 명시). 체커보드/테두리/버튼은 `--pixel-checker-a/b`, `--color-*` 변수를 `style.css`와 동일한 3-블록 패턴(`:root`/`prefers-color-scheme`/`[data-theme="dark"]`)으로 정의. |
| 테마 토글 즉시 반영 | **통과(코드 추적)** | `theme.js`(재사용, 미변경)가 `data-theme` 속성을 즉시 갱신하고 모든 CSS 변수가 이를 구독하므로 에디터 페이지도 동일하게 즉시 반영됨. |
| 모바일/반응형(360px 잘림 없음) | **통과** | 2절 참고(실측+계산 모두 통과). `pixel-art.css`의 `@media (max-width:480px)`가 스와치 24px, 그리드 `min(90vw,480px)`, 도구 버튼 줄바꿈+확장으로 축소. |
| 터치 시 스크롤 방지 | **통과(코드 추적)** | `touchstart`/`touchmove` 모두 `{passive:false}`로 등록하고 `event.preventDefault()` 호출, 스펙에서 제안한 `elementFromPoint` 방식 그대로 구현. |
| 헤더 연동(모든 페이지 노출, 겹침/잘림 없음) | **통과** | 1절/2절 참고. index/포스트/태그/2048/픽셀아트 5개 페이지 유형 모두에서 `href` 상대경로 실측 확인. |
| 빌드/통합(정상 생성, 회귀 없음, 콘솔 에러/외부 의존성 없음) | **통과** | 1절 참고. `pixel-art.js`/`pixel-art.css`에 외부 URL·라이브러리 import 없음(전량 grep 확인, `fetch`/`import`/`<link>` 외부 호스트 없음). 콘솔 에러는 브라우저 상호작용 자동화가 불가해 실행 중 직접 관찰은 못했으나, 코드 추적상 `document.getElementById`가 모두 `null` 체크(`if (!paletteEl ...) return;`, `if (eraserBtn)` 등) 후 사용되어 요소 누락 시에도 예외를 던지지 않도록 방어되어 있음. |

**확인불가 항목 없음** — 모든 항목이 통과로 판정되었으며, 판정 근거는 실측(코드/HTML) 또는 코드
추적이다.

---

## 4. DOM 계약 일치 여부 (5절 지시사항)

`grep`으로 `#palette`, `.palette-swatch`, `.palette-swatch-transparent`, `#custom-color`,
`#current-color-preview`, `#eraser-btn`, `#clear-btn`, `#save-btn`, `#pixel-grid`, `.pixel-cell`,
`#export-canvas`, `.tool-btn`, `.tool-row`, `.selected`, `.active`, `.transparent` 등 전체 선택자를
`src/templates.js` / `assets/css/pixel-art.css` / `assets/js/pixel-art.js` 세 파일에서 교차 검색한 결과
모든 선택자가 세 곳 모두에서 정확히 같은 이름으로 사용됨을 확인했다. 불일치 없음.

- **JS 담당자가 남긴 확인 요청**(`.current-color-preview.transparent` 클래스를 CSS가 실제로
  스타일링했는지): **확인 완료, 정상.** `pixel-art.css` 34~43번째 줄에서 `.current-color-preview.transparent`가
  `.palette-swatch-transparent`, `.pixel-grid`와 함께 공용 체커보드 배경(`repeating-conic-gradient`)
  선택자 목록에 포함되어 있고, 126~128번째 줄에 `.current-color-preview.transparent { background-size:
  10px 10px; }`로 미리보기 칩 크기에 맞는 패턴 크기까지 별도 지정되어 있다. JS(`updateCurrentColorPreview()`)가
  `currentColor === null`일 때 이 클래스를 추가/제거하는 로직과 정확히 맞물린다.

---

## 5. 발견된 이슈

**차단/기능적 버그: 0건.**

### (참고, 수정 불필요) 코드 가독성: `CELL_COUNT`를 캔버스 픽셀 크기로 재사용

- **파일:줄**: `assets/js/pixel-art.js:174`
- **증상**: `drawExportCanvas()`에서 `ctx.clearRect(0, 0, CELL_COUNT, CELL_COUNT)`를 호출하는데,
  `CELL_COUNT`(=256)는 원래 "칸 개수"를 의미하는 상수이고 여기서는 우연히 "캔버스 픽셀 크기"
  (`SCALE * GRID_SIZE` = 16 × 16 = 256)와 숫자가 같아서 결과적으로는 정확하다.
- **재현/근거**: `GRID_SIZE = 16`, `SCALE = 16`이므로 `SCALE * GRID_SIZE = 256 = CELL_COUNT`(16×16)가
  우연히 일치. 값 자체는 현재 정확하지만 의미상 다른 두 개념이 같은 변수로 표현되어 있어, 만약 향후
  `GRID_SIZE`나 `SCALE`을 독립적으로 변경하면(예: `SCALE`을 32로 바꿔 512×512로 내보내기) 이 줄이
  조용히 틀린 크기로 `clearRect`를 호출하게 된다.
  - 기능적으로 지금 당장 버그는 아니므로 **수정하지 않았다**(review.md 범위 원칙에 따라 코드 수정
    금지). 참고용으로만 남긴다. 제안하는 수정 방향(향후 Work 시): `SCALE * GRID_SIZE`를 별도 상수(예:
    `CANVAS_SIZE`)로 두거나 `exportCanvas.width`/`exportCanvas.height`를 직접 참조.

---

## 6. 요약

- **빌드**: 통과. `node build.js` 에러 없음, `dist/pixel-art/index.html` 등 정상 생성, 기존 5개 페이지
  유형 전부 회귀 없음.
- **헤더 레이아웃(최우선 확인 항목)**: **문제 없음.** 실제 Safari 360px 스크린샷 1건 + macOS
  CoreText 실측 폰트 메트릭 기반 375/480/720px 계산 모두에서 줄바꿈·겹침·잘림이 발생하지 않음을
  확인했다. dom-contract.md가 "경계선"으로 우려했던 360px도 실제로는 약 27px의 여유가 있다.
  `flex-wrap: wrap` 추가 등 추가 수정은 불필요.
- **에디터 상호작용(팔레트/드래그/PNG 저장/다크모드)**: 브라우저 클릭 자동화가 이 환경에 없어
  코드 추적으로 검증했으며, spec.md 6절 전 항목 통과.
- **DOM 계약 일치**: 전 선택자 3파일 교차 확인 완료, 불일치 없음. `.current-color-preview.transparent`
  CSS 스타일링도 확인 완료.
- **총 이슈**: 0건(차단 이슈 없음). 참고용 코드 가독성 메모 1건(수정 불필요).
