# 지침: 픽셀 아트 에디터 spec.md 작성 (Plan 단계)

## 범위
너의 작업 범위는 **`tasks/pixel-art-editor/spec.md` 파일을 작성하는 것뿐**이다.
코드를 구현하지 마라. 다른 파일을 수정하지 마라.

## 배경
이 저장소(`my-blog`)는 마크다운을 정적 HTML 블로그로 변환하는 프로젝트다.
- 프레임워크/번들러/외부 런타임 라이브러리 없음. 순수 HTML, CSS, JavaScript만 사용.
- `build.js`가 Node 내장 모듈(`fs`, `path`)만으로 `posts/*.md` → `dist/`를 생성한다.
- `assets/css/style.css`, `assets/js/theme.js`가 있고 `build.js`가 `assets/`를 `dist/assets/`로 복사한다.
- 다크모드(시스템 감지 + 수동 토글, localStorage 저장), 기존 CSS 변수 체계(`--color-bg`, `--color-text`, `--color-accent`, `--color-border`, `--color-code-bg` 등, `assets/css/style.css` 참고).
- 최근에 같은 방식으로 "2048 게임"을 추가한 선례가 있다. **`tasks/2048-game/spec.md`, `tasks/2048-game/dom-contract.md`를 반드시 읽고 동일한 통합 패턴(별도 정적 페이지, `src/templates.js`에 render 함수 추가, `layout()`의 `extraStyles`/`extraScripts` 파라미터 재사용, `build.js`에 생성 단계 추가, 헤더에 링크 추가)을 그대로 따라라.** `layout()`은 이미 `extraStyles`/`extraScripts` 배열 파라미터를 지원하도록 확장되어 있다(`src/templates.js` 확인).
- npm 의존성 없음(`package.json` 없음).

## 요청 기능
사용자가 요청한 기능: **픽셀 아트 에디터**
- 16x16 격자에 도트(픽셀)를 찍어서 그림을 그리는 도구
- 완성하면 PNG로 저장 가능
- 색상 팔레트 포함

## spec.md에 포함해야 할 내용

1. **기능 범위**:
   - 16x16 격자(정확히 16열×16행 = 256칸)에 클릭/드래그로 픽셀을 색칠.
   - 색상 팔레트: 미리 정의된 색상 목록(최소 8~16색 정도 제안, 원색 위주 + 검정/흰색/투명 포함)에서 선택. 커스텀 색상 입력(`<input type="color">`)도 넣을지 제안.
   - 지우개 기능(투명/배경색으로 되돌리기).
   - 전체 지우기(Clear) 버튼.
   - **PNG 저장**: `<canvas>`의 `toDataURL('image/png')`와 `<a download>` 링크를 활용해 외부 라이브러리 없이 다운로드하는 방식을 구체적으로 설계. 저장되는 이미지 해상도(16x16 그대로 저장할지, 확대해서 저장할지 — 픽셀 아트는 보통 확대 저장, 예: 1픽셀=16px로 256x256 PNG 저장 등 구체적으로 결정)와 파일명 규칙을 명시.
   - (선택) 마우스 드래그로 여러 칸을 한 번에 칠하는 것 지원 여부.
   - (선택) 실행취소(undo) 여부 — 필수는 아님을 명시하되 넣을지 제안.

2. **UI/UX**:
   - 기존 사이트의 헤더/다크모드/레이아웃(`layout()`, `.site-header`/`.content`/`.site-footer`)을 그대로 재사용.
   - 격자 레이아웃(CSS Grid 16x16), 각 셀 크기(반응형 고려), 격자 테두리.
   - 팔레트 UI(색상 스와치 목록, 현재 선택된 색 표시).
   - 지우개/전체지우기/PNG저장 버튼 배치. 기존 `#theme-toggle`, 2048 게임의 버튼 스타일(`--color-border`, `--color-code-bg` 기반 둥근 버튼)과 톤 일치.
   - 다크모드에서도 격자/팔레트/버튼 대비가 충분해야 함(단, 실제 그려지는 캔버스 픽셀 색상 자체는 사용자가 고른 색 그대로 유지되어야 하며 테마에 따라 바뀌면 안 됨 — UI 크롬만 다크모드 대응).
   - 반응형: 좁은 화면(`@media (max-width: 480px)`, 기존 브레이크포인트)에서도 격자와 팔레트가 잘리지 않게.

3. **조작**:
   - 마우스 클릭(및 드래그) 기반 필수. 터치 지원 여부 제안(모바일에서 그림 그리기 가능하면 좋음, 필수는 아님을 명시).

4. **파일 구조**: `tasks/2048-game/spec.md`의 4절과 동일한 패턴으로 구체적으로 제안.
   - 예: `assets/css/pixel-art.css`, `assets/js/pixel-art.js` 신규, `src/templates.js`에 `renderPixelArtPage()` 추가, `build.js`에 `dist/pixel-art/index.html`(또는 유사 경로) 생성 단계 추가.
   - 새 프레임워크나 외부 라이브러리는 절대 제안하지 마라. PNG 저장은 반드시 브라우저 네이티브 `<canvas>` API만 사용.

5. **연동 지점**: 헤더에 "🎨 픽셀 아트" 같은 링크를 추가할지 제안(2048 게임 링크 옆에 나란히 배치되는 형태 고려).

6. **테스트 관점**: Review 단계에서 확인해야 할 체크리스트(격자가 정확히 16x16인지, 클릭/드래그로 정확한 칸에 색이 칠해지는지, 팔레트 선택이 반영되는지, 지우개/전체지우기 동작, PNG 다운로드가 실제로 그려진 내용과 일치하는지, 파일명, 빈 캔버스 저장 시 동작, 다크모드, 모바일 레이아웃, 빌드 회귀 없음).

## 출력
`tasks/pixel-art-editor/spec.md` 파일 하나만 작성하고 끝내라. 최종 응답에는 spec.md의 핵심 요약만 간단히 남겨라.
