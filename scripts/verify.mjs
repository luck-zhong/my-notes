import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { load } from 'cheerio';

const root = path.resolve('docs/.vuepress/dist');
const baseline = JSON.parse(fs.readFileSync('migration/content-baseline.json', 'utf8'));
const publication = JSON.parse(fs.readFileSync('migration/publication-baseline.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'knowledge-manifest.json'), 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const migrationCheck = process.argv.includes('--migration');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const output = walk(root);
const imageHashes = new Set(output.filter(file => /\.(png|jpe?g|svg)$/i.test(file)).map(hash));
for (const item of baseline.files) {
  const archived = publication.archivedNotes.find(note => note.source === item.source);
  const current = archived?.snapshot ?? publication.sourceRenames[item.source] ?? item.source;
  assert(fs.existsSync(current), `原始文件缺失: ${item.source}`);
  if (migrationCheck) {
    const reference = publication.files.find(file => file.source === current);
    if (item.source.endsWith('.md') && reference)
      assert.equal(crypto.createHash('sha256').update(fs.readFileSync(current, 'utf8').replaceAll('\r\n', '\n')).digest('hex'), reference.referenceSha256LF, `迁移时原文已改变: ${item.source}`);
    else assert.equal(hash(current), item.sha256, `迁移时原始文件已改变: ${item.source}`);
  }
  if (!item.source.endsWith('.md')) assert(imageHashes.has(hash(current)), `发布结果缺少图片: ${item.source}`);
  else {
    if (archived) {
      assert.equal(hash(current), item.sha256, `归档原文已改变: ${item.source}`);
      assert(manifest.archivedNotes.some(note => note.source === item.source), `归档地址遗漏: ${item.source}`);
      assert(fs.readFileSync(path.join(root, archived.path.slice(1)), 'utf8').includes('尚未填写正文'), 'CMIS 旧址缺少状态说明');
    } else {
      assert(manifest.notes.some(note => note.source === current), `笔记遗漏: ${item.source}`);
      const route = manifest.routes.find(route => route.source === current);
      for (const anchor of item.anchors ?? []) assert(route?.hashMap[anchor.id], `旧章节锚点未映射: ${item.source}#${anchor.id}`);
      if (current !== item.source) {
        const alias = item.source.slice('docs/'.length).replace(/\.md$/, '.html');
        assert(fs.existsSync(path.join(root, alias)), `目录调整前地址不可访问: ${alias}`);
        assert(fs.readFileSync(path.join(root, alias), 'utf8').includes(JSON.stringify(encodeURI(baseline.base.slice(0, -1) + route.path))), `目录调整前地址跳转错误: ${alias}`);
      }
    }
    const legacy = item.legacyPath.replace(/^\/my-notes\//, '');
    assert(fs.existsSync(path.join(root, legacy, 'index.html')) || fs.existsSync(path.join(root, legacy + '.html')), `旧地址不可访问: ${item.legacyPath}`);
  }
}
for (const item of publication.files) {
  assert(fs.existsSync(item.source), `同步文件缺失: ${item.source}`);
  if (item.source.endsWith('.md')) assert(manifest.notes.some(note => note.source === item.source), `同步笔记遗漏: ${item.source}`);
  else assert(imageHashes.has(item.sha256), `发布结果缺少同步图片: ${item.source}`);
}
const paths = new Set();
for (const note of manifest.notes) {
  assert(!paths.has(note.path), `文章地址重复: ${note.path}`);
  paths.add(note.path);
  const rel = decodeURI(note.path).replace(/^\//, '');
  const file = path.join(root, rel.endsWith('/') ? rel + 'index.html' : rel);
  assert(fs.existsSync(file), `页面不存在: ${note.path}`);
  const html = fs.readFileSync(file, 'utf8');
  assert(!/NaN|Invalid Date/.test(html), `页面日期异常: ${note.path}`);
  if (note.path.endsWith('.html')) assert(fs.existsSync(path.join(root, rel.replace(/\.html$/, ''), 'index.html')), `无扩展名历史地址缺失: ${note.path}`);
  const missing = publication.missingImages.filter(item => item.source === note.source);
  if (missing.length) {
    assert.equal(load(html)('.missing-note-image').length, missing.length, '缺失原图提示数量不正确');
    for (const item of missing) assert(!html.includes(item.reference), `页面仍引用仓库外的缺失图片: ${item.reference}`);
  }
}
for (const category of manifest.categories) assert(fs.existsSync(path.join(root, category.path.slice(1), 'index.html')), `分类页缺失: ${category.path}`);
assert(fs.existsSync(path.join(root, '404.html')), '缺少 404 页面');
assert(output.some(file => /slimsearch.*\.js$/.test(file)), '缺少全文搜索资源');
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(homepage.includes('知识分类') && homepage.includes('最近更新'), '首页内容缺失');
assert(homepage.includes('hero-fullscreen'), '首页未启用整屏介绍');
for (const file of output.filter(file => file.endsWith('.html'))) {
  const $ = load(fs.readFileSync(file, 'utf8'));
  assert(!$('link[rel="canonical"]').attr('href')?.includes('/my-notes/my-notes/'), `规范地址重复部署前缀: ${file}`);
  for (const element of $('a[href],img[src],script[src],link[href]').toArray()) {
    const url = $(element).attr('href') ?? $(element).attr('src');
    if (!url?.startsWith('/') || url.startsWith('//')) continue;
    assert(url.startsWith('/my-notes/'), `资源或链接缺少部署前缀: ${file}: ${url}`);
    const rel = decodeURIComponent(url.split(/[?#]/)[0].slice('/my-notes/'.length));
    const target = path.join(root, rel);
    assert(fs.existsSync(target), `资源或链接目标缺失: ${file}: ${url}`);
  }
}
assert(!fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').includes('/my-notes/my-notes/'), '搜索引擎索引地址重复部署前缀');
console.log(`验证通过：${manifest.notes.length} 篇笔记、${publication.files.filter(item => !item.source.endsWith('.md')).length} 张图片、${manifest.categories.length} 个分类；CMIS 旧址与全部历史章节完整。${migrationCheck ? ' 原文已按统一换行校验。' : ''}`);
