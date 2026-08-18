# spec: 픽셀 아트 에디터

## 1. 기능 범위

### 격자
- 16열 × 16행 = 정확히 256칸의 정사각형 격자를 클라이언트 상태로 관리한다.
- 상태는 길이 256인 1차원 배열(`pixels[row * 16 + col]`)로 표현하며, 각 원소는 CSS 색상 문자열(예: `"#ef4444"`) 또는 `null`(미채색/투명)이다.
- 초기 상태는 256칸 모두 `null`(투명)이다.

### 색상 팔레트
- 미리 정의된 16색 스와치를 제공한다(원색 위주 + 검정/흰색/회색/갈색 + 투명 포함):
  - 검정 `#000000`, 흰색 `#ffffff`, 빨강 `#ef4444`, 주황 `#f97316`, 노랑 `#facc15`, 라임 `#84cc16`, 초록 `#22c55e`, 청록 `#14b8a6`, 하늘 `#22d3ee`, 파랑 `#3b82f6`, 남색 `#6366f1`, 보라 `#a855f7`, 분홍 `#ec4899`, 갈색 `#92400e`, 회색 `#9ca3af`, **투명**(체커보드 아이콘 스와치, 값은 `null`).
- 각 스와치는 `<button type="button" class="palette-swatch" data-color="#ef4444">` 형태(투명 스와치는 `data-color=""` 또는 `data-color="transparent"`로 구분)로 구현하고, 클릭 시 `currentColor`를 해당 값으로 설정한다.
- 현재 선택된 스와치는 `--color-accent` 기반 테두리/링으로 강조 표시한다.
- **커스텀 색상**: 팔레트 마지막에 `<input type="color" id="custom-color">`를 배치한다. 값이 바뀌면(`input` 이벤트) 그 값을 `currentColor`로 즉시 반영하고, 모든 팔레트 스와치의 선택 강조를 해제한 뒤 커스텀 색상 입력 자체에 선택 표시(테두리 강조)를 준다.
- **지우개는 별도 도구가 아니라 "투명"을 선택하는 것과 동일한 동작으로 통합한다.** 즉 지우개 버튼(`#eraser-btn`)을 누르면 팔레트의 "투명" 스와치를 선택한 것과 완전히 동일하게 `currentColor = null`이 되고, 시각적으로도 "투명" 스와치가 선택된 상태로 강조된다. 이렇게 하면 "현재 선택된 색"이라는 단일 상태(`currentColor`)만으로 브러시/지우개를 모두 표현할 수 있어 로직이 단순해진다.

### 채색 동작
- 격자 칸을 클릭하면 해당 칸의 값이 `currentColor`로 바뀐다(`currentColor`가 `null`이면 그 칸도 `null`, 즉 지워짐).
- **드래그 채색을 지원한다(필수로 채택)**: `mousedown` 시 채색을 시작하고(누른 칸도 즉시 채색), `mousedown`이 유지된 채 다른 칸 위로 `mouseover`(또는 `mousemove`)가 발생하면 그 칸도 같은 `currentColor`로 채색한다. `mouseup`은 `window`에 등록해 격자 바깥에서 마우스를 놓아도 드래그가 정상적으로 종료되도록 한다.
- 이미 같은 색으로 칠해진 칸을 다시 칠해도(드래그 중 동일 칸 재통과 포함) 부작용 없이 같은 값을 유지한다(멱등).

### 전체 지우기(Clear)
- `#clear-btn` 클릭 시 확인창 없이 즉시 256칸을 모두 `null`로 초기화한다(2048의 "새 게임" 버튼과 동일하게 확인 절차 없음).

### PNG 저장
- 정적 HTML에 화면에는 보이지 않는 내보내기 전용 `<canvas id="export-canvas" width="256" height="256" hidden></canvas>`를 둔다(사용자에게 보여지는 16×16 격자는 별도의 DOM 칸 요소들로 구성되며, 저장 시에만 이 캔버스에 그려서 사용한다 — 아래 "구현 방식 결정" 참고).
- **해상도**: 1칸 = 16실제픽셀로 확대하여 저장한다. 즉 최종 PNG는 **256×256px**. 캔버스 크기 상수(`const SCALE = 16;`)로 코드에 명시한다.
- **저장 절차**(외부 라이브러리 없이 브라우저 네이티브 API만 사용):
  1. `export-canvas`의 2D 컨텍스트를 가져와 `ctx.clearRect(0, 0, 256, 256)`으로 초기화한다(투명 배경 보장).
  2. `pixels` 배열을 순회하며(`i = 0..255`, `row = Math.floor(i / 16)`, `col = i % 16`), 값이 `null`이 아니면 `ctx.fillStyle = pixels[i]; ctx.fillRect(col * 16, row * 16, 16, 16);`으로 채운다. `null`인 칸은 그리지 않아 PNG에서 투명하게 남는다(알파 채널 보존).
  3. `const dataUrl = canvas.toDataURL('image/png');`로 데이터 URL을 얻는다.
  4. 임시 `<a>` 엘리먼트를 만들어 `a.href = dataUrl`, `a.download = fileName`을 설정하고, DOM에 잠시 append 후 `a.click()`을 호출한 뒤 즉시 remove한다(크로스브라우저 호환을 위해 body에 붙였다 제거하는 방식을 권장).
- **파일명 규칙**: `pixel-art-YYYYMMDD-HHmmss.png` 형식(예: `pixel-art-20260818-201530.png`). 로컬 시각 기준, `Date` 객체에서 직접 포맷팅하는 작은 헬퍼 함수를 `pixel-art.js`에 둔다(외부 날짜 라이브러리 사용 금지).
- **빈 캔버스 저장 시 동작**: 256칸이 모두 `null`(빈 상태)이어도 저장 버튼은 그대로 동작하며, 완전히 투명한 256×256 PNG가 다운로드된다. 별도의 경고/차단 로직을 두지 않는다(이 동작을 Review 단계 체크리스트에 명시한다 — 아래 6절 참고).

### 구현 방식 결정: 화면에 보이는 격자 vs. 저장용 캔버스를 분리하는 이유
- 사용자가 보고 클릭/드래그하는 16×16 격자는 (2048의 타일 그리드와 동일한 패턴으로) CSS Grid 위에 놓인 `<div class="pixel-cell">` 256개로 구현한다. 이렇게 하면 셀 호버/테두리/반응형 크기 조절, 다크모드 대응을 CSS로 자연스럽게 처리할 수 있고, 클릭 좌표를 셀 인덱스로 매핑하는 로직도 각 `div`에 `data-index` 속성을 부여해 이벤트 위임(`#pixel-grid`에 하나의 `mousedown`/`mouseover` 리스너)만으로 단순하게 처리할 수 있다.
- 실제 `<canvas>`는 오직 "PNG로 저장" 시점에만 상태 배열로부터 그려지는 **숨김 처리된 내보내기 전용 캔버스** 하나만 사용한다. 이렇게 분리하면 화면 표시용 UI(격자 셀 스타일링)와 저장 로직(캔버스 픽셀 채우기)이 서로 간섭하지 않고, 상태 배열(`pixels`)이 유일한 단일 진실 공급원(source of truth)이 되어 "화면에 보이는 것과 저장된 PNG가 항상 일치"함을 보장하기 쉽다.
- 화면용 격자 칸(`.pixel-cell`)이 `null`(미채색)일 때는 배경을 `transparent`로 두고, `#pixel-grid` 컨테이너 자체에 CSS 체커보드 패턴(연한 회색 두 톤의 `repeating-conic-gradient` 등)을 배경으로 깔아 "투명 칸"임을 시각적으로 알 수 있게 한다. 라이트/다크 모드에 따라 체커보드 두 톤도 새 CSS 변수(예: `--pixel-checker-a`, `--pixel-checker-b`)로 나눠 정의한다.

### 드래그 채색 / 실행취소
- 드래그 채색: 위에서 결정한 대로 **지원한다(필수)**.
- 실행취소(undo): **필수 아님.** 넣는다면 다음과 같은 단일 단계(1-depth) undo를 제안한다: 각 스트로크(마우스 `mousedown` 시점) 시작 전에 `pixels` 배열 전체의 스냅샷을 `lastSnapshot` 변수 하나에 저장해 두고, `Ctrl+Z` 키 입력 또는 별도 "실행취소" 버튼 클릭 시 `pixels`를 `lastSnapshot`으로 되돌린다(여러 단계 히스토리 스택은 이번 범위에 포함하지 않는다). Work 단계에서 시간 여유에 따라 포함 여부를 결정한다.

---

## 2. UI/UX

### 레이아웃
- 기존 사이트의 `.site-header`(제목 + 헤더 링크들 + 다크모드 토글) / `.content` / `.site-footer` 레이아웃을 그대로 재사용한다(`src/templates.js`의 `layout()` 참고).
- `.content` 내부에 세로로 배치: 제목, 팔레트(색상 스와치 + 커스텀 색상 입력 + 현재 선택 색 표시), 도구 버튼 행(지우개/전체지우기/PNG저장), 16×16 격자, (선택) 조작 안내 문구.

### 격자
- CSS Grid(`grid-template-columns: repeat(16, 1fr)`, `grid-template-rows: repeat(16, 1fr)`)로 구현하고 각 셀은 `aspect-ratio: 1 / 1`로 정사각형을 유지한다.
- 격자 컨테이너(`#pixel-grid`)는 `.content`의 `max-width: 720px` 안에서 별도의 `max-width`(예: 480px)를 두고 화면 폭에 맞춰 축소되도록 한다.
- 각 셀은 얇은 `border: 1px solid var(--color-border)`로 격자선을 표시한다. 셀 크기는 컨테이너 폭을 16으로 나눈 값으로 자동 결정되며 최소 크기를 강제하지 않는다(좁은 화면에서는 컨테이너 자체가 줄어들며 셀도 함께 줄어듦).
- 위에서 설명한 체커보드 배경으로 투명 칸을 표시한다.

### 팔레트 UI
- 16개 색상 스와치를 `flex-wrap: wrap`으로 배치한 목록(`#palette`)으로 구성한다. 각 스와치는 원형 또는 둥근 사각형 버튼(약 28~32px)이며 `background-color`가 해당 색이다. 투명 스와치는 작은 체커보드 아이콘 배경으로 표시한다.
- 현재 선택된 스와치(또는 커스텀 색상 입력)는 `2px solid var(--color-accent)` 테두리 + 약간의 `box-shadow`로 강조한다.
- 팔레트 옆(또는 위)에 "현재 색상" 미리보기 칩을 하나 두어 `currentColor`를 실시간으로 반영한다(지우개 선택 시에는 체커보드로 표시).

### 도구 버튼
- `#eraser-btn`(지우개), `#clear-btn`(전체 지우기), `#save-btn`(PNG로 저장) 세 버튼을 팔레트 아래 한 행에 배치한다.
- 스타일은 기존 `#theme-toggle`, 2048의 버튼 스타일과 톤을 맞춘다: `background: none; border: 1px solid var(--color-border); border-radius: 999px (또는 8px); padding: 0.35rem 0.8rem; hover 시 background: var(--color-code-bg);`
- `#eraser-btn`이 활성(현재 `currentColor === null`) 상태일 때는 `--color-accent` 테두리로 강조해 지우개 도구가 선택되어 있음을 알 수 있게 한다(팔레트의 "투명" 스와치 강조와 동일한 시각 언어 사용).

### 다크모드
- UI 크롬(격자 테두리, 팔레트 배경, 버튼, 체커보드 톤)은 기존 CSS 변수 체계(`--color-bg`, `--color-text`, `--color-accent`, `--color-border`, `--color-code-bg`)와 새로 추가하는 `--pixel-checker-a`/`--pixel-checker-b`를 다크모드에서도 각각 정의해 대비를 확보한다.
- **캔버스에 실제로 칠해지는 픽셀 색상 자체(팔레트에서 고른 색)는 테마와 무관하게 사용자가 고른 값 그대로 유지되어야 한다.** 예를 들어 사용자가 검정을 칠했다면 다크모드에서도 그 칸은 여전히 검정으로 보여야 하며, 테마 전환에 따라 자동으로 색이 바뀌면 안 된다(이는 그려진 그림의 무결성 문제이므로 중요하게 취급한다).

### 반응형
- `@media (max-width: 480px)`(기존 브레이크포인트)에서 격자 `max-width`를 뷰포트에 맞춰 축소(예: `min(90vw, 480px)`)하고, 팔레트 스와치 크기도 약간 줄여(`24px` 등) 한 화면(360px 폭 기준)에서도 잘리지 않고 줄바꿈되어 모두 보이도록 한다.
- 도구 버튼 행도 좁은 화면에서 줄바꿈되거나 세로 배치로 전환될 수 있게 한다.

---

## 3. 조작

- **마우스 클릭 + 드래그(필수)**: `mousedown`으로 채색 시작(누른 칸 즉시 채색 포함), 버튼이 눌린 채 다른 칸에 진입 시(`mouseover`) 계속 채색, `mouseup`(윈도우 전역 리스너)으로 종료.
- **터치 지원(선택, 제안)**: 모바일에서도 그림을 그릴 수 있도록 `touchstart`/`touchmove`에서 `event.preventDefault()`로 스크롤을 막고, `document.elementFromPoint(touch.clientX, touch.clientY)`로 터치 좌표 아래의 `.pixel-cell`을 찾아 동일한 채색 함수를 호출하는 방식을 제안한다. 필수는 아니며, 지원하지 않더라도 격자/팔레트가 모바일에서 보기 좋게 표시되는 반응형 레이아웃은 필수다.
- **키보드 조작은 필수가 아니다**(2048과 달리 방향키 조작 없음). 실행취소를 구현할 경우에만 `Ctrl+Z`(또는 `Cmd+Z`)를 선택적으로 지원한다.

---

## 4. 파일 구조

프레임워크/외부 라이브러리를 전혀 도입하지 않고, 기존 `build.js` + `src/` 구조에 2048 게임과 동일한 패턴으로 최소한으로 통합한다.

### 제안 구조

```
my-blog/
├── assets/
│   ├── css/
│   │   ├── style.css          (기존, 공용 변수/레이아웃 유지, 수정 금지)
│   │   ├── game-2048.css      (기존, 그대로 유지)
│   │   └── pixel-art.css      (신규: 팔레트/격자/버튼/체커보드 전용 스타일)
│   └── js/
│       ├── theme.js           (기존, 그대로 재사용)
│       ├── game-2048.js       (기존, 그대로 유지)
│       └── pixel-art.js       (신규: 픽셀 상태 관리, 채색/지우개/전체지우기, PNG 저장 로직)
├── src/
│   └── templates.js           (renderPixelArtPage() 함수 추가)
├── build.js                   (dist/pixel-art/index.html 생성 단계 추가)
└── dist/                      (빌드 산출물, build.js가 생성)
    ├── assets/...
    ├── game/2048/index.html   (기존)
    └── pixel-art/
        └── index.html         (신규)
```

### 통합 방식
- `assets/` 전체는 이미 `build.js`의 `copyDir(ASSETS_DIR, ...)`로 통째로 `dist/assets/`에 복사되므로, `pixel-art.css`/`pixel-art.js`를 `assets/css/`, `assets/js/`에 추가하는 것만으로 별도 복사 로직 없이 자동 반영된다.
- `src/templates.js`에 `renderPixelArtPage()`를 추가하고 기존 `layout()`(이미 `extraStyles`/`extraScripts` 배열 파라미터를 지원함)을 그대로 재사용한다:
  ```js
  layout({
    title: '픽셀 아트 에디터',
    rootPath: '..',
    bodyHtml: body,
    extraStyles: ['assets/css/pixel-art.css'],
    extraScripts: ['assets/js/pixel-art.js'],
  });
  ```
  - `renderPixelArtPage()`의 body에는 제목, 팔레트/도구 버튼의 정적 뼈대 HTML, 16×16 격자 칸(`.pixel-cell` 256개) 정적 뼈대, 숨김 내보내기 캔버스(`#export-canvas`)만 넣는다. 실제 채색 상태 갱신, 이벤트 처리, PNG 생성은 `pixel-art.js`가 클라이언트에서 수행한다.
  - **`rootPath`는 `'..'`를 사용한다**: `dist/pixel-art/index.html`은 `posts/<slug>/`나 `game/2048/`(2단계 깊이, `'../..'`)과 달리 `dist/` 바로 아래 1단계 디렉터리(`pixel-art/`)이므로 루트까지 한 단계만 올라가면 된다. Work 단계에서 이 상대경로 깊이를 반드시 확인한다.
- `build.js`의 `build()` 함수에 다음 단계를 추가한다(다른 로직 변경 없음):
  ```js
  const pixelArtDir = path.join(DIST_DIR, 'pixel-art');
  fs.mkdirSync(pixelArtDir, { recursive: true });
  fs.writeFileSync(path.join(pixelArtDir, 'index.html'), renderPixelArtPage());
  ```
  기존 `game/2048` 생성 단계 바로 아래(또는 위)에 추가하며, 순서는 상관없다.
- 새 npm 패키지, 프레임워크, 번들러는 도입하지 않는다. PNG 생성은 반드시 브라우저 네이티브 `<canvas>`의 `toDataURL('image/png')`와 `<a download>`만 사용한다. Node 내장 모듈(`fs`, `path`)만으로 빌드한다는 프로젝트 원칙을 그대로 따른다.

---

## 5. 연동 지점

- `src/templates.js`의 `layout()`이 모든 페이지 공통 `.site-header`를 렌더링하므로, 여기에 픽셀 아트 에디터로 가는 링크를 추가하면 모든 페이지(index, 포스트, 태그, 게임, 픽셀 아트)에서 접근 가능해진다.
- 현재 `.site-header`에는 이미 `.header-link` 클래스를 쓰는 2048 링크가 있다:
  ```html
  <a class="header-link" href="${rootPath}/game/2048/">🎮 2048</a>
  ```
  같은 클래스, 같은 스타일 톤으로 그 옆에 나란히 추가한다:
  ```html
  <a class="header-link" href="${rootPath}/pixel-art/">🎨 픽셀 아트</a>
  ```
  배치 순서는 `.site-title` → `🎮 2048` 링크 → `🎨 픽셀 아트` 링크 → `#theme-toggle` 버튼이다.
- 참고: `assets/css/style.css`의 `.header-link { margin-left: auto; ... }` 규칙은 현재 하나의 `.header-link`를 오른쪽으로 밀어내는 용도로 쓰이고 있다. 두 번째 `.header-link`를 추가해도 flex 컨테이너(`.site-header`)에서 `margin-left: auto`가 적용된 첫 링크가 남은 공간을 오른쪽으로 밀고, 그 뒤를 따르는 두 번째 링크와 토글 버튼은 자연스럽게 그 옆에 이어 붙으므로 별도 CSS 수정 없이도 의도한 대로(제목 …… 2048 링크, 픽셀아트 링크, 토글) 배치될 가능성이 높다. 다만 좁은 화면에서 세 요소(제목/두 링크/토글)가 겹치거나 줄바꿈이 어색하지 않은지는 Work 단계에서 실제 렌더링으로 반드시 확인한다(`assets/css/style.css` 자체는 이번 범위에서 수정하지 않는 것이 원칙이지만, `.header-link` 간격 등 사소한 보정이 꼭 필요하다면 최소한으로 조정할 수 있음을 예외로 남겨둔다).

---

## 6. 테스트 관점 (Review 단계 체크리스트)

- **격자 정확성**
  - 격자가 정확히 16열×16행(256칸)인지, 셀 순서가 row-major(왼쪽→오른쪽, 위→아래)인지
  - 클릭한 칸과 실제로 채색되는 칸이 항상 일치하는지(오프바이원 없음)
  - 드래그 중 통과한 모든 칸이 빠짐없이 채색되는지, 격자 바깥으로 드래그가 나가도 오류 없이 처리되는지
- **팔레트/도구**
  - 팔레트 스와치 클릭 시 `currentColor`가 정확히 반영되고 선택 강조가 스와치 하나에만 표시되는지
  - 커스텀 색상 입력(`<input type="color">`) 값이 즉시 브러시 색상에 반영되는지
  - 지우개 버튼과 "투명" 스와치가 서로 상태를 공유하며(하나를 선택하면 다른 하나도 선택 표시되는지) 동일하게 동작하는지
  - 전체 지우기 클릭 시 256칸이 모두 즉시 초기화되는지(확인창 없음)
- **PNG 저장**
  - 저장된 PNG가 화면에 그려진 내용과 정확히 일치하는지(칸별 색상, 좌표 매핑)
  - 저장된 PNG 해상도가 정확히 256×256px인지(1칸 = 16px)
  - 미채색(투명) 칸이 PNG에서 실제로 투명(알파 0)하게 저장되는지
  - 파일명이 `pixel-art-YYYYMMDD-HHmmss.png` 형식을 따르는지, 반복 저장 시에도 매번 다른 파일명이 생성되는지
  - **빈 캔버스(모두 미채색) 상태에서 저장 버튼을 눌러도 오류 없이 완전히 투명한 PNG가 다운로드되는지**
- **다크모드**
  - 격자 테두리/체커보드/팔레트/버튼이 라이트/다크 모두에서 충분한 대비를 갖는지
  - 사용자가 칠한 픽셀 색상 자체가 테마 전환 시 절대 바뀌지 않는지(그림 내용의 테마 독립성)
  - 시스템 설정 감지 및 수동 토글(`#theme-toggle`) 전환 시 에디터 화면도 즉시 반영되는지
- **모바일/반응형 레이아웃**
  - 좁은 화면(예: 360px)에서 격자와 팔레트가 잘리지 않고 줄바꿈되는지
  - 도구 버튼이 좁은 화면에서도 탭하기 충분한 크기인지
  - (터치를 구현한 경우) 터치로 그림을 그릴 때 페이지 스크롤이 함께 발생하지 않는지
- **헤더 연동**
  - 모든 페이지(index, 포스트, 태그, 2048 게임, 픽셀 아트)에서 헤더에 "🎨 픽셀 아트" 링크가 노출되고 정확한 상대경로로 연결되는지
  - 좁은 화면에서 헤더의 제목/두 링크/테마 토글이 서로 겹치거나 잘리지 않는지
- **빌드/통합**
  - `node build.js` 실행 후 `dist/pixel-art/index.html`이 정상 생성되는지
  - 기존 `dist/index.html`, 포스트, 태그, `dist/game/2048/index.html` 출력에 변화가 없는지(회귀 없음)
  - 콘솔 오류 없음, 외부 네트워크 요청/외부 라이브러리 의존 없음
