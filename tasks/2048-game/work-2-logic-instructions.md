# 지침: 2048 게임 - 게임 로직 (Work 2단계, JS)

## 범위
**`assets/js/game-2048.js` 파일 하나만 새로 만든다.** 다른 파일은 절대 수정하지 마라
(`src/templates.js`, `build.js`, `assets/css/*` 건드리지 말 것 — 다른 서브에이전트가 담당 중).

## 반드시 먼저 읽을 것
1. `tasks/2048-game/spec.md` — 게임 규칙, 점수 계산, 승패 조건, localStorage 요구사항 전체.
2. `tasks/2048-game/dom-contract.md` — 실제 HTML 구조와 정확한 id/class 계약. **이 문서의 선택자와 정확히 일치하게 구현해야 한다.** (예: 그리드는 `.grid-cell` 16개 + `#tile-layer`가 이미 정적으로 존재하며, JS는 매 상태 변경마다 `#tile-layer`의 innerHTML을 통째로 다시 그린다 — dom-contract.md 2절 참고)

## 기술 제약
- 외부 라이브러리/프레임워크 금지. 순수 바닐라 JavaScript (ES 최신 문법 가능, 브라우저 네이티브 기능만).
- 번들러 없음 — `<script src="...">`로 그대로 로드되는 단일 파일. 모듈 시스템(import/export) 사용하지 말고 IIFE나 그냥 top-level 스크립트로 작성.
- `assets/js/theme.js`를 참고해서 기존 코드 스타일(세미콜론, 들여쓰기 등)을 맞춰라.

## 구현해야 할 것 (spec.md 1절 그대로)
1. 4x4 보드 상태(2차원 배열 또는 1차원 16칸, 0은 빈칸).
2. 새 게임 시작 시 랜덤 빈칸 2곳에 타일 생성(90% 확률 2, 10% 확률 4).
3. 방향키(ArrowUp/Down/Left/Right) `keydown` 리스너, `event.preventDefault()`로 스크롤 방지.
4. 이동/병합 로직: 각 방향으로 밀착 + 인접 동일값 병합, 병합은 이동당 타일당 최대 1회, 병합된 타일도 끝까지 밀착.
5. 유효한 이동(보드가 실제로 바뀐 경우)에만 새 타일 하나 생성. 보드가 안 바뀌면 아무것도 하지 않음.
6. 점수: 병합될 때마다 병합 결과값만큼 현재 점수에 가산. `#score-current` textContent 갱신.
7. 최고 점수: localStorage 키 `game2048.best`. 현재 점수가 최고 점수를 넘으면 갱신 + 즉시 저장. `#score-best` textContent 갱신. `try/catch`로 감싸서 localStorage 접근 불가 환경에서도 게임이 죽지 않게 처리(그 경우 최고 점수 기능만 조용히 비활성화).
8. 승리 판정: `2048` 타일이 처음 생성되는 순간 `#game-overlay`를 노출(hidden 속성 제거)하고 `#overlay-message`에 승리 메시지, `#continue-btn`을 노출(hidden 제거). 이미 승리를 본 적 있으면(플래그로 관리) 같은 판에서 다시 트리거하지 않음.
9. 패배 판정: 보드가 가득 찼고 어느 방향으로도 병합 불가능할 때 `#game-overlay` 노출, `#overlay-message`에 패배 메시지, `#continue-btn`은 hidden 유지, `#overlay-new-game-btn`만 노출.
10. `#continue-btn` 클릭: 오버레이 닫기(`#game-overlay`에 hidden 재설정), 게임 계속.
11. `#new-game-btn`과 `#overlay-new-game-btn` 둘 다: 클릭 시 보드 초기화, 점수 0, 랜덤 타일 2개 생성, 오버레이 닫기, 승리 플래그 리셋. (최고 점수는 유지)
12. 매 상태 변경 후 `#tile-layer` 재렌더링: dom-contract.md 2절의 정확한 규칙대로 (`innerHTML` 비우고 `<div class="tile" data-value="N" style="grid-column:C; grid-row:R;">N</div>` 생성, 1-indexed grid-column/row).
13. (선택) 모바일 스와이프 지원 — 필수는 아니지만 여력이 되면 `touchstart`/`touchend` 좌표 차이로 방향 판별해 동일 이동 함수 호출.
14. 페이지 로드 시(`DOMContentLoaded` 또는 스크립트가 `</body>` 직전이므로 즉시 실행 가능) 저장된 최고 점수를 불러와 표시하고 새 게임을 시작한다.

## 완료 후
파일을 다 쓴 뒤, 최종 응답에 구현한 함수 목록과 dom-contract.md 계약을 정확히 지켰는지 간단히 요약해라. 브라우저 없이 코드 리뷰 수준으로 로직을 스스로 재검토(엣지 케이스: 빈 보드, 한 줄 전체가 같은 값일 때 병합, 이동 불가 판정)하고 이상이 없는지 확인해라.
