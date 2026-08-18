'use strict';

const SITE_TITLE = 'My Blog';

function tagLink(rootPath, tag) {
  return `<a class="tag" href="${rootPath}/tags/${tag}/">${tag}</a>`;
}

function postMetaHtml(rootPath, post) {
  const tags = (post.tags || []).map((tag) => tagLink(rootPath, tag)).join(' ');
  return `<div class="post-meta"><time datetime="${post.date}">${post.date}</time>${
    tags ? ` <span class="tags">${tags}</span>` : ''
  }</div>`;
}

// 모든 페이지 공통 레이아웃. rootPath는 dist 루트까지의 상대 경로
// (index.html이면 '.', posts/<slug>/나 tags/<tag>/ 처럼 두 단계 아래면 '../..').
// extraStyles/extraScripts는 게임 페이지처럼 공용 style.css/theme.js 외에
// 추가 CSS/JS가 필요한 페이지를 위한 선택적 파라미터다(기본값 빈 배열).
// 값은 rootPath 기준 상대 경로 문자열 배열이다(예: ['assets/css/game-2048.css']).
function layout({ title, rootPath, bodyHtml, extraStyles = [], extraScripts = [] }) {
  const extraStyleTags = extraStyles
    .map((href) => `<link rel="stylesheet" href="${rootPath}/${href}">`)
    .join('\n');
  const extraScriptTags = extraScripts
    .map((src) => `<script src="${rootPath}/${src}"></script>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · ${SITE_TITLE}</title>
<link rel="stylesheet" href="${rootPath}/assets/css/style.css">
${extraStyleTags ? extraStyleTags + '\n' : ''}<script>
  (function () {
    var saved = localStorage.getItem('theme');
    var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>
</head>
<body>
<header class="site-header">
  <a class="site-title" href="${rootPath}/">${SITE_TITLE}</a>
  <a class="header-link" href="${rootPath}/game/2048/">🎮 2048</a>
  <a class="header-link" href="${rootPath}/pixel-art/">🎨 픽셀 아트</a>
  <button id="theme-toggle" type="button" aria-label="다크 모드 전환">🌓</button>
</header>
<main class="content">
${bodyHtml}
</main>
<footer class="site-footer">
  <p>&copy; ${SITE_TITLE}</p>
</footer>
<script src="${rootPath}/assets/js/theme.js"></script>
${extraScriptTags ? extraScriptTags + '\n' : ''}</body>
</html>
`;
}

function renderIndexPage(posts) {
  const items = posts
    .map(
      (post) => `<li class="post-item">
  <a class="post-title" href="./posts/${post.slug}/">${post.title}</a>
  ${postMetaHtml('.', post)}
</li>`
    )
    .join('\n');

  const body = `<h1>글 목록</h1>
<ul class="post-list">
${items}
</ul>`;

  return layout({ title: '글 목록', rootPath: '.', bodyHtml: body });
}

function renderPostPage(post) {
  const body = `<article>
<h1>${post.title}</h1>
${postMetaHtml('../..', post)}
<div class="post-content">
${post.contentHtml}
</div>
</article>`;

  return layout({ title: post.title, rootPath: '../..', bodyHtml: body });
}

function renderTagPage(tag, posts) {
  const items = posts
    .map(
      (post) => `<li class="post-item">
  <a class="post-title" href="../../posts/${post.slug}/">${post.title}</a>
  ${postMetaHtml('../..', post)}
</li>`
    )
    .join('\n');

  const body = `<h1>태그: ${tag}</h1>
<ul class="post-list">
${items}
</ul>`;

  return layout({ title: `태그: ${tag}`, rootPath: '../..', bodyHtml: body });
}

// 2048 게임 페이지. 정적 뼈대 HTML만 렌더링하며, 실제 타일 렌더링/상태 갱신은
// game-2048.js가 클라이언트에서 담당한다. DOM id/class 계약은
// tasks/2048-game/dom-contract.md 참고.
function renderGamePage() {
  const gridCells = Array.from({ length: 16 }, () => '  <div class="grid-cell"></div>').join('\n');

  const body = `<h1>2048</h1>
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
${gridCells}
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
<p class="game-instructions">방향키로 타일을 움직여 2048을 만들어보세요.</p>`;

  return layout({
    title: '2048 게임',
    rootPath: '../..',
    bodyHtml: body,
    extraStyles: ['assets/css/game-2048.css'],
    extraScripts: ['assets/js/game-2048.js'],
  });
}

// 픽셀 아트 에디터 페이지. 정적 뼈대 HTML만 렌더링하며, 실제 채색/저장 로직은
// pixel-art.js가 클라이언트에서 담당한다. DOM id/class 계약은
// tasks/pixel-art-editor/dom-contract.md 참고.
function renderPixelArtPage() {
  // 팔레트 15색 + 투명 스와치 = 16개. 각 스와치는 data-color에 색상값을 담고,
  // 배경색은 빌드 시점에 정적으로 확정되므로 inline style로 직접 지정한다
  // (자세한 이유는 dom-contract.md 2절 참고).
  const paletteColors = [
    { color: '#000000', label: '검정' },
    { color: '#ffffff', label: '흰색' },
    { color: '#ef4444', label: '빨강' },
    { color: '#f97316', label: '주황' },
    { color: '#facc15', label: '노랑' },
    { color: '#84cc16', label: '라임' },
    { color: '#22c55e', label: '초록' },
    { color: '#14b8a6', label: '청록' },
    { color: '#22d3ee', label: '하늘' },
    { color: '#3b82f6', label: '파랑' },
    { color: '#6366f1', label: '남색' },
    { color: '#a855f7', label: '보라' },
    { color: '#ec4899', label: '분홍' },
    { color: '#92400e', label: '갈색' },
    { color: '#9ca3af', label: '회색' },
  ];

  const paletteSwatches = paletteColors
    .map(
      ({ color, label }) =>
        `  <button type="button" class="palette-swatch" data-color="${color}" style="background-color: ${color};" aria-label="${label}"></button>`
    )
    .join('\n');

  const transparentSwatch =
    '  <button type="button" class="palette-swatch palette-swatch-transparent" data-color="transparent" aria-label="투명"></button>';

  const pixelCells = Array.from(
    { length: 256 },
    (_, i) => `  <div class="pixel-cell" data-index="${i}"></div>`
  ).join('\n');

  const body = `<h1>픽셀 아트 에디터</h1>
<div class="palette-panel">
  <div id="palette" class="palette">
${paletteSwatches}
${transparentSwatch}
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
${pixelCells}
</div>
<canvas id="export-canvas" width="256" height="256" hidden></canvas>
<p class="pixel-instructions">칸을 클릭하거나 드래그해서 그림을 그려보세요.</p>`;

  return layout({
    title: '픽셀 아트 에디터',
    rootPath: '..',
    bodyHtml: body,
    extraStyles: ['assets/css/pixel-art.css'],
    extraScripts: ['assets/js/pixel-art.js'],
  });
}

module.exports = { renderIndexPage, renderPostPage, renderTagPage, renderGamePage, renderPixelArtPage };
