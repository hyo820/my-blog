'use strict';

const { highlight, escapeHtml } = require('./highlight');

// 인라인 마크다운(코드/이미지/링크/굵게/기울임)을 HTML로 변환한다.
// 순서가 중요하다: 인라인 코드 → 이미지 → 링크 → 굵게 → 기울임.
function inline(text) {
  let out = escapeHtml(text);

  out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);

  out = out.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, url) => `<img src="${url}" alt="${alt}">`
  );

  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label, url) => `<a href="${url}">${label}</a>`
  );

  out = out.replace(
    /\*\*([^*]+)\*\*|__([^_]+)__/g,
    (_, a, b) => `<strong>${a || b}</strong>`
  );

  out = out.replace(
    /\*([^*]+)\*|_([^_]+)_/g,
    (_, a, b) => `<em>${a || b}</em>`
  );

  return out;
}

// 라인 단위 블록 파서. 코드 펜스 → 헤딩 → 수평선 → 목록 → 인용구 →
// 문단 순으로 각 줄을 분류하며, 문단은 연속된 일반 줄을 하나로 합친다.
function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let paragraphBuf = [];
  let i = 0;

  function flushParagraph() {
    if (paragraphBuf.length) {
      html.push(`<p>${inline(paragraphBuf.join(' '))}</p>`);
      paragraphBuf = [];
    }
  }

  const ulRe = /^[-*]\s+(.+)$/;
  const olRe = /^\d+\.\s+(.+)$/;
  const bqRe = /^>\s?(.*)$/;

  while (i < lines.length) {
    const line = lines[i];

    const fenceMatch = line.match(/^```(\w*)\s*$/);
    if (fenceMatch) {
      flushParagraph();
      const lang = fenceMatch[1];
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      const codeHtml = highlight(codeLines.join('\n'), lang);
      const langClass = lang ? ` class="language-${lang}"` : '';
      html.push(`<pre><code${langClass}>${codeHtml}</code></pre>`);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${inline(headingMatch[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      flushParagraph();
      html.push('<hr>');
      i++;
      continue;
    }

    if (ulRe.test(line)) {
      flushParagraph();
      const items = [];
      while (i < lines.length && ulRe.test(lines[i])) {
        items.push(inline(lines[i].match(ulRe)[1].trim()));
        i++;
      }
      html.push(`<ul>${items.map((it) => `<li>${it}</li>`).join('')}</ul>`);
      continue;
    }

    if (olRe.test(line)) {
      flushParagraph();
      const items = [];
      while (i < lines.length && olRe.test(lines[i])) {
        items.push(inline(lines[i].match(olRe)[1].trim()));
        i++;
      }
      html.push(`<ol>${items.map((it) => `<li>${it}</li>`).join('')}</ol>`);
      continue;
    }

    if (bqRe.test(line)) {
      flushParagraph();
      const contentLines = [];
      while (i < lines.length && bqRe.test(lines[i])) {
        contentLines.push(lines[i].match(bqRe)[1]);
        i++;
      }
      html.push(`<blockquote><p>${inline(contentLines.join(' ').trim())}</p></blockquote>`);
      continue;
    }

    paragraphBuf.push(line.trim());
    i++;
  }

  flushParagraph();
  return html.join('\n');
}

module.exports = { parseMarkdown };
