# 지침: 픽셀 아트 에디터 - 구조/빌드 통합 (Work 1단계)

## 배경
`tasks/pixel-art-editor/spec.md`를 반드시 먼저 읽고 그대로 따른다.
같은 방식으로 만든 선례인 `tasks/2048-game/dom-contract.md`와 실제 `src/templates.js`의
`renderGamePage()` 구현을 참고해서 동일한 패턴(정적 뼈대 HTML + `layout()` 재사용 + 별도
`dom-contract.md` 작성)을 따른다.

이 저장소는 마크다운 → 정적 블로그 변환 프로젝트다. 프레임워크/번들러/외부 라이브러리 금지,
Node 내장 모듈(`fs`, `path`)만 사용. 기존 파일 `src/templates.js`, `build.js`를 읽고
기존 코드 스타일을 그대로 따른다.

## 범위 (아래 파일만 수정/생성한다)
- `src/templates.js` (수정: `renderPixelArtPage()` 함수 추가, 헤더에 "🎨 픽셀 아트" 링크 추가)
- `build.js` (수정: `dist/pixel-art/index.html`을 생성하는 단계 추가)
- `tasks/pixel-art-editor/dom-contract.md` (신규 생성)

**절대 건드리지 마라**: `assets/css/style.css`(원칙상 수정 금지 — 단, spec.md 5절에서 허용한
`.header-link` 간격 관련 최소 보정이 실제 렌더링 확인 결과 꼭 필요하다면 예외적으로 아주
작은 조정만 허용된다. 확신이 없으면 건드리지 말고 dom-contract.md에 이슈로 남겨라),
`assets/js/theme.js`, `assets/css/game-2048.css`, `assets/js/game-2048.js`,
`posts/*.md`, `assets/css/pixel-art.css`, `assets/js/pixel-art.js` (이 두 파일은 존재하지
않아도 만들지 마라 — 다른 서브에이전트가 만든다).

## 해야 할 일

1. `renderPixelArtPage()`를 `src/templates.js`에 추가한다. spec.md 4절대로:
   - `layout()`을 재사용하고 `rootPath: '..'` 사용 (dist/pixel-art/index.html은 dist/ 바로 아래
     1단계 깊이 — `game/2048/`의 `'../..'`와 다름을 주의).
   - `extraStyles: ['assets/css/pixel-art.css']`, `extraScripts: ['assets/js/pixel-art.js']`.
   - body에는 제목, 팔레트(16개 색상 스와치 버튼 + 커스텀 색상 `<input type="color">` + 현재
     색상 미리보기), 도구 버튼 행(`#eraser-btn`, `#clear-btn`, `#save-btn`), 16×16 격자
     (`#pixel-grid` 안에 `.pixel-cell` 256개, 각각 `data-index="0"`~`"255"`), 숨김 내보내기
     캔버스(`<canvas id="export-canvas" width="256" height="256" hidden></canvas>`)의
     **정적 뼈대 HTML만** 넣는다. 실제 채색/저장 로직은 JS가 담당.

2. `layout()`의 헤더(`.site-header`)에 픽셀 아트 링크를 추가한다. 기존 2048 링크
   (`<a class="header-link" href="${rootPath}/game/2048/">🎮 2048</a>`) 바로 뒤에
   같은 클래스로 추가: `<a class="header-link" href="${rootPath}/pixel-art/">🎨 픽셀 아트</a>`.

3. `build.js`에 `dist/pixel-art/index.html`을 생성하는 단계를 추가한다 (기존 index/posts/tags/game
   생성 로직은 절대 변경하지 않는다).

4. **`tasks/pixel-art-editor/dom-contract.md`를 작성한다.** `tasks/2048-game/dom-contract.md`와
   같은 상세함으로, 다음을 정확히 명시한다:
   - 팔레트 스와치의 정확한 선택자(예: `.palette-swatch`, `data-color` 속성 값 규칙, 투명
     스와치 표현 방법), 선택 강조에 쓸 class(예: `.selected`)
   - 커스텀 색상 입력의 id, 현재 색상 미리보기 요소의 id
   - `#eraser-btn`, `#clear-btn`, `#save-btn`의 정확한 id와 활성 상태 표시 방법
   - `#pixel-grid`와 `.pixel-cell` 256개의 정확한 구조, `data-index` 규칙(0~255, row-major),
     JS가 칸 색을 어떻게 반영해야 하는지(예: `style.backgroundColor` 직접 설정 vs `data-color`
     속성 + CSS, 어느 방식을 선택했는지 명시)
   - `#export-canvas`의 정확한 크기와 용도
   - 이 문서만 읽으면 JS/CSS 담당자가 실제 HTML을 보지 않고도 정확히 연동할 수 있어야 한다
     (2048의 dom-contract.md 5절처럼 렌더링되는 정적 HTML 전문을 포함시켜라).

## 완료 후
`node build.js`를 실행해 에러 없이 빌드되는지, `dist/pixel-art/index.html`이 생성되는지,
기존 `dist/index.html`/`dist/game/2048/index.html`에 헤더 링크 추가 외 다른 변화가 없는지
확인해라 (아직 pixel-art.css/js가 없어 404가 나는 것은 정상). 최종 응답에 dom-contract.md의
핵심 요약과, 좁은 화면(360~480px)에서 헤더에 제목+링크 2개+토글이 겹치거나 잘리지 않는지
직접 CSS 계산으로 검토한 결과를 남겨라(브라우저가 없다면 CSS 값 기반 추론으로).
