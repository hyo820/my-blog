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
function layout({ title, rootPath, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · ${SITE_TITLE}</title>
<link rel="stylesheet" href="${rootPath}/assets/css/style.css">
<script>
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
  <button id="theme-toggle" type="button" aria-label="다크 모드 전환">🌓</button>
</header>
<main class="content">
${bodyHtml}
</main>
<footer class="site-footer">
  <p>&copy; ${SITE_TITLE}</p>
</footer>
<script src="${rootPath}/assets/js/theme.js"></script>
</body>
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

module.exports = { renderIndexPage, renderPostPage, renderTagPage };
