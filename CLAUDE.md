# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

`posts/`에 마크다운(.md)으로 글을 쓰면 빌드 타임 Node.js 스크립트(`build.js`)가 이를 읽어 `dist/`에 정적 HTML 블로그를 생성한다. 결과물(`dist/`)은 서버나 번들러 없이 그대로 정적 호스팅할 수 있다.

## 기술 제약 (사용자 확정 요구사항)

- **프레임워크 사용 금지**: React, Vue, Svelte는 물론 Next.js, Hugo, Jekyll, Eleventy 같은 정적 사이트 생성기도 쓰지 않는다. 결과물은 순수 HTML, CSS, JavaScript다.
- **빌드 도구는 콘텐츠 생성용 스크립트만 허용**: `build.js`는 번들러/트랜스파일러가 아니라 `.md`를 읽어 `.html`을 써내는 Node 내장 모듈(`fs`, `path`)만 사용하는 스크립트다. npm 의존성은 없다(`package.json` 없음).
- **마크다운 파서·문법 강조 모두 자체 구현**: `marked`, `highlight.js` 같은 외부 라이브러리를 쓰지 않는다. 새로운 외부 라이브러리를 추가하고 싶어질 경우 "프레임워크 없음" 원칙에 어긋나지 않는지 먼저 사용자와 확인한다.

## 자주 쓰는 명령어

```bash
node build.js                      # posts/*.md → dist/ 로 빌드
cd dist && python3 -m http.server 8000   # 빌드 결과물 로컬 미리보기 (http://localhost:8000)
```

린트/테스트 스크립트는 아직 없다.

## 아키텍처

```
posts/*.md          → build.js가 읽는 원본 글. front matter(title/date/tags) + 마크다운 본문
src/frontmatter.js  → front matter 파싱 (완전한 YAML이 아닌 간단한 key: value 포맷)
src/markdown.js      → 커스텀 마크다운 → HTML 파서 (블록 단위 분리 후 인라인 패턴 처리)
src/highlight.js     → 코드 블록 문법 강조 (언어별 정규식 토크나이저, 미지원 언어는 강조 없이 이스케이프만)
src/templates.js     → 레이아웃 + 인덱스/포스트/태그 페이지 HTML 생성 함수
build.js             → 위 모듈들을 조합해 dist/ 생성 (index, posts/<slug>/, tags/<tag>/, assets 복사)
assets/css/style.css → 타이포그래피, 다크모드 CSS 변수, 반응형, 코드 하이라이트 색상
assets/js/theme.js   → 다크모드 토글 버튼 핸들러 (localStorage에 저장)
dist/                → 빌드 결과물. git 추적 여부는 배포 방식이 정해지면 재검토
```

**포스트 slug**는 파일명 그대로 사용한다 (예: `posts/hello-world.md` → slug `hello-world` → `dist/posts/hello-world/index.html`).

**다크모드 초기화**는 FOUC 방지를 위해 `templates.js`의 `layout()`이 `<head>` 안에 인라인 스크립트로 `localStorage` → `prefers-color-scheme` 순서로 `data-theme` 속성을 설정한다. 토글 버튼 클릭 이후 동작은 `assets/js/theme.js`가 담당한다.

**페이지 간 상대 경로**: `dist/index.html`은 depth 0, `dist/posts/<slug>/`와 `dist/tags/<tag>/`는 depth 2다. `templates.js`의 각 render 함수가 이에 맞는 `rootPath`(`.` 또는 `../..`)를 `layout()`에 넘겨 CSS/JS/링크 경로를 만든다. 새 페이지 타입을 추가할 때 이 규칙을 지켜야 한다.

새 글을 추가하려면 `posts/`에 `<slug>.md`를 만들고 front matter를 채운 뒤 `node build.js`를 실행하면 된다.
