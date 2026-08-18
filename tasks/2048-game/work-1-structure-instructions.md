# 지침: 2048 게임 - 구조/빌드 통합 (Work 1단계)

## 배경
`tasks/2048-game/spec.md`를 반드시 먼저 읽고 그대로 따른다. 이 저장소는 마크다운 → 정적 블로그 변환 프로젝트다. 프레임워크/번들러/외부 라이브러리 금지, Node 내장 모듈(`fs`, `path`)만 사용.

기존 파일 `src/templates.js`, `build.js`, `assets/css/style.css`를 읽고 기존 코드 스타일(들여쓰기, 템플릿 리터럴 사용 방식 등)을 그대로 따른다.

## 범위 (아래 파일만 수정/생성한다)
- `src/templates.js` (수정: `renderGamePage()` 함수 추가, `layout()`이 필요 시 추가 CSS/JS를 받을 수 있도록 확장, 헤더에 "🎮 2048" 링크 추가)
- `build.js` (수정: `dist/game/2048/index.html`을 생성하는 단계 추가)
- `tasks/2048-game/dom-contract.md` (신규 생성)

**절대 건드리지 마라**: `assets/css/style.css`(기존 내용), `assets/js/theme.js`, `posts/*.md`, `assets/css/game-2048.css`, `assets/js/game-2048.js` (이 두 파일은 존재하지 않아도 만들지 마라 — 다른 서브에이전트가 만든다).

## 해야 할 일

1. `renderGamePage()`를 `src/templates.js`에 추가한다. spec.md 4절(파일 구조)의 제안대로:
   - 기존 `layout()`을 재사용하고 `rootPath: '../..'` 사용.
   - `<head>`에 `../../assets/css/game-2048.css`를 추가로 링크하고, `</body>` 직전에 `../../assets/js/game-2048.js`를 추가로 넣을 수 있도록 `layout()`에 파라미터(예: `extraStyles`, `extraScripts` 배열)를 추가한다. **기존 `renderIndexPage`/`renderPostPage`/`renderTagPage` 호출은 수정하지 않아도 동작해야 한다** (새 파라미터는 선택적/기본값 빈 배열).
   - body에는 제목, 점수판 마크업(현재 점수/최고 점수), 새 게임 버튼, 4x4 그리드 컨테이너(빈 셀 16개 또는 JS가 채울 빈 컨테이너), 승리/패배 오버레이 컨테이너(기본 숨김)의 **정적 뼈대 HTML만** 넣는다. 실제 타일 렌더링은 JS가 담당하므로 여기서는 빈 그리드/오버레이 구조만 만든다.

2. `layout()`의 헤더(`.site-header`)에 게임 페이지로 가는 링크를 추가한다 (`#theme-toggle` 버튼 근처). 텍스트는 "🎮 2048" 정도로. **모든 페이지에서 보여야 하므로 `layout()` 자체에 추가한다.**

3. `build.js`에 `dist/game/2048/index.html`을 생성하는 단계를 추가한다. 기존 index/posts/tags 생성 로직은 절대 변경하지 않는다.

4. **`tasks/2048-game/dom-contract.md`를 작성한다.** 이 파일은 이후 JS/CSS 서브에이전트가 참고할 계약서다. 다음을 정확히 명시한다:
   - 점수판의 현재 점수/최고 점수를 표시할 요소의 정확한 id (예: `#score-current`, `#score-best`)
   - 새 게임 버튼의 id (예: `#new-game-btn`)
   - 그리드 컨테이너의 id/class (예: `#game-grid`), 그리고 JS가 타일을 어떻게 그 안에 렌더링해야 하는지(예: JS가 매 프레임 innerHTML을 다시 그리는 방식인지, 셀 16개가 이미 존재하고 JS가 각 셀의 텍스트/data-value만 바꾸는 방식인지 — 네가 선택해서 명시)
   - 오버레이 컨테이너의 id/class (예: `#game-overlay`), 승리/패배 메시지 표시 영역, "계속하기"/"새 게임" 버튼의 id
   - 타일 요소에 값(2,4,8...2048)을 표시하기 위해 사용할 class 또는 `data-*` 속성 이름 규칙 (CSS가 `[data-value="2"]` 같은 선택자로 색을 입힐 수 있도록)
   - 이 문서만 읽으면 JS/CSS 담당자가 실제 HTML을 보지 않고도 정확히 연동할 수 있어야 한다.

## 완료 후
`node build.js`를 실행해 에러 없이 빌드되는지 확인하고 (아직 game-2048.css/js가 없어 404가 나는 것은 정상이며 문제 삼지 않는다), 최종 응답에 `dom-contract.md`의 핵심 요약을 남겨라.
