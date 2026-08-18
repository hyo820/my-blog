# 지침: 픽셀 아트 에디터 - 로직 (Work 2단계, JS)

## 범위
**`assets/js/pixel-art.js` 파일 하나만 새로 만든다.** 다른 파일은 절대 수정하지 마라
(`src/templates.js`, `build.js`, `assets/css/*` 건드리지 말 것 — 다른 서브에이전트가 담당 중).

## 반드시 먼저 읽을 것
1. `tasks/pixel-art-editor/spec.md` — 특히 1절(기능 범위), 3절(조작).
2. `tasks/pixel-art-editor/dom-contract.md` — 정확한 선택자 계약. **이 문서와 정확히 일치하게 구현해야 한다.**
3. `assets/js/game-2048.js` — 기존 코드 스타일(세미콜론, 들여쓰기, 모듈 없이 top-level 스크립트) 참고.

## 기술 제약
- 외부 라이브러리/프레임워크 금지. 순수 바닐라 JavaScript. 모듈 시스템(import/export) 사용 금지.
- PNG 생성은 반드시 `<canvas>`의 `toDataURL('image/png')`와 `<a download>`만 사용(외부 라이브러리 금지).

## 구현해야 할 것 (spec.md 1절/3절, dom-contract.md 기준)

1. **상태**: `pixels` = 길이 256 배열(초기 전부 `null`). `currentColor` = 초기값 `"#000000"`(검정).
2. **팔레트 클릭**: `#palette`에 이벤트 위임(`click`). `.palette-swatch` 클릭 시:
   - `data-color`가 `"transparent"`면 `currentColor = null`, 아니면 `currentColor = dataset.color`.
   - 모든 `.palette-swatch`/`#custom-color`에서 `.selected` 제거 후 클릭된 요소에 `.selected` 추가.
   - `#eraser-btn`의 `.active` 클래스를 `currentColor === null` 여부에 맞춰 갱신(dom-contract.md 1절/2절).
   - `#current-color-preview`의 `style.backgroundColor` 갱신(`currentColor`가 `null`이면 빈 문자열 + 투명 표시용 클래스 토글 — 계약에 명시된 대로 최소한 시각적으로 구분 가능하게).
3. **커스텀 색상**(`#custom-color`의 `input` 이벤트): `currentColor`를 그 값으로 설정, 모든 `.palette-swatch`의 `.selected` 제거, `#custom-color`에 `.selected` 추가, `#eraser-btn.active` 제거, 미리보기 갱신.
4. **지우개 버튼**(`#eraser-btn` 클릭): `currentColor = null`로 설정하고 팔레트의 `.palette-swatch-transparent`를 선택한 것과 동일하게 처리(2번과 같은 선택 갱신 로직 재사용 권장 — 공통 `selectColor()` 함수로 묶어라).
5. **채색**(`#pixel-grid`에 이벤트 위임):
   - `mousedown`: 그리기 시작 플래그 on, `event.target.closest('.pixel-cell')`이 있으면 해당 칸 즉시 채색.
   - `mouseover`(그리기 플래그 on일 때만): `closest('.pixel-cell')` 칸을 채색.
   - `window`의 `mouseup`: 그리기 플래그 off (격자 밖에서 놓아도 정상 종료).
   - 채색 함수: `data-index`로 `pixels` 배열 갱신 후 해당 `.pixel-cell`의 `style.backgroundColor`를 `currentColor`(색상 문자열) 또는 `''`(currentColor가 null일 때)로 직접 설정 — dom-contract.md 3절의 "구현 방식 결정" 그대로.
   - (선택) 터치 지원: `touchstart`/`touchmove`에서 `preventDefault()` 후 `document.elementFromPoint()`로 칸을 찾아 동일 채색 함수 호출.
6. **전체 지우기**(`#clear-btn` 클릭): `pixels` 256칸을 모두 `null`로 초기화하고, 모든 `.pixel-cell`의 `style.backgroundColor`를 `''`로 되돌린다.
7. **PNG 저장**(`#save-btn` 클릭): spec.md 1절 "PNG 저장" 절차 그대로.
   - `#export-canvas`의 2D 컨텍스트: `ctx.clearRect(0,0,256,256)` 후 `pixels` 순회하며 `null`이 아닌 칸만 `ctx.fillStyle = pixels[i]; ctx.fillRect(col*16, row*16, 16, 16);` (`SCALE = 16` 상수 사용).
   - `canvas.toDataURL('image/png')` → 임시 `<a>` 생성, `href`/`download` 설정, body에 append → `click()` → remove.
   - 파일명: `pixel-art-YYYYMMDD-HHmmss.png` (로컬 시각, 직접 포맷팅하는 헬퍼 함수 작성, 외부 라이브러리 금지). `String(n).padStart(2, '0')` 활용.
8. **초기화**: 스크립트 로드 시(모듈이 `</body>` 직전이므로 즉시 실행 가능) 검정(`#000000`) 스와치에 기본 선택 표시를 해도 되고, 정적 HTML에 아무 것도 선택 안 돼 있어도 되지만 **`currentColor` 초기값과 화면상 선택 표시가 일치**해야 한다(dom-contract.md 1절 권장사항 참고 — 검정 스와치에 `.selected`를 부여하는 것을 권장).

## 완료 후
파일을 다 쓴 뒤, 최종 응답에 구현한 함수 목록과 dom-contract.md 계약(선택자, `.active`/`.selected` 갱신 규칙, `style.backgroundColor` 직접 설정 방식)을 정확히 지켰는지 요약해라. 엣지 케이스(빈 캔버스 저장, 드래그가 격자 밖으로 나갈 때, 같은 칸 재클릭)를 스스로 코드 추적으로 재검토해라.
