'use strict';

const fs = require('fs');
const path = require('path');

const { parseFrontmatter } = require('./src/frontmatter');
const { parseMarkdown } = require('./src/markdown');
const { renderIndexPage, renderPostPage, renderTagPage } = require('./src/templates');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'posts');
const ASSETS_DIR = path.join(ROOT, 'assets');
const DIST_DIR = path.join(ROOT, 'dist');

function slugify(filename) {
  return filename.replace(/\.md$/, '');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function loadPosts() {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, content } = parseFrontmatter(raw);
    const slug = slugify(file);

    return {
      slug,
      title: data.title || slug,
      date: data.date || '',
      tags: data.tags || [],
      contentHtml: parseMarkdown(content),
    };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}

function build() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const posts = loadPosts();

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), renderIndexPage(posts));

  for (const post of posts) {
    const postDir = path.join(DIST_DIR, 'posts', post.slug);
    fs.mkdirSync(postDir, { recursive: true });
    fs.writeFileSync(path.join(postDir, 'index.html'), renderPostPage(post));
  }

  const tagMap = new Map();
  for (const post of posts) {
    for (const tag of post.tags) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag).push(post);
    }
  }
  for (const [tag, tagPosts] of tagMap) {
    const tagDir = path.join(DIST_DIR, 'tags', tag);
    fs.mkdirSync(tagDir, { recursive: true });
    fs.writeFileSync(path.join(tagDir, 'index.html'), renderTagPage(tag, tagPosts));
  }

  copyDir(ASSETS_DIR, path.join(DIST_DIR, 'assets'));

  console.log(`빌드 완료: 포스트 ${posts.length}개, 태그 ${tagMap.size}개 → dist/`);
}

build();
