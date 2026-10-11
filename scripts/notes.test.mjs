import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { lint } from 'markdownlint/promise';
import { formatNote, selectNotes, fences, contentHash } from './notes.mjs';

const file = path.resolve('docs/embedded/control_algorithm/esc.md');

test('整理正文时保留代码缩进、参数、尾部空格和代码中的美元符号', async () => {
  const code = '```python\nif enabled:\n    value = 0.25   \n    print("$x$")\n```\n';
  const source = '# 示例\n\n\n-   说明\n\n' + code;
  const formatted = await formatNote(source.replaceAll('\n', '\r\n'), file);
  assert(formatted.includes(code));
  assert(formatted.includes('- 说明'));
  assert.equal(await formatNote(formatted, file), formatted);
});

test('行内和独立公式保持原样', async () => {
  const inline = '$e(k) = r(k) - y(k)$';
  const block = '$$\nu(k) = K_p e(k) + K_i \\sum_{j=0}^{k} e(j)\n$$';
  const formatted = await formatNote('# 公式\n\n\n' + inline + '\n\n' + block + '\n', file);
  assert(formatted.includes(inline));
  assert(formatted.includes(block));
});

test('包含公式的技术笔记能使用项目规则检查', async () => {
  const text = '---\ntitle: 公式示例\n---\n\n## 误差\n\n行内公式 $e(k) = r(k) - y(k)$。\n\n$$\nu(k) = K_p e(k) + K_i \\sum_{j=0}^{k} e(j)\n$$\n';
  const results = await lint({ strings: { example: text }, config: JSON.parse(fs.readFileSync('.markdownlint.json', 'utf8')) });
  assert.deepEqual(results.example, []);
});

test('带嵌套围栏的示例和引用中的代码不会被当成普通正文', async () => {
  const nested = '````markdown\n```c\nint n = 42;   \n```\n````\n';
  const quoted = '> ```text\n> REGISTER = 0x10   \n> ```\n';
  const formatted = await formatNote('# 示例\n\n' + nested + '\n' + quoted, file);
  assert(formatted.includes(nested));
  assert(formatted.includes(quoted));
});

test('未闭合的代码围栏不能自动整理', async () => {
  await assert.rejects(formatNote('# 示例\n\n```c\nint x = 1;\n', file), /没有闭合/);
});

test('文章的固定地址和图片相对路径保持不变', async () => {
  const source = '---\ntitle: 示例\npermalink: /embedded/example.html\n---\n\n\n![示意图](./assets/示意图.png)\n';
  const formatted = await formatNote(source, file);
  assert(formatted.includes('permalink: /embedded/example.html'));
  assert(formatted.includes('![示意图](./assets/示意图.png)'));
});

test('默认选择不包含未改动的原笔记，包括原先未提交的笔记', () => {
  const selected = selectNotes();
  const baseline = JSON.parse(fs.readFileSync('migration/publication-baseline.json', 'utf8'));
  for (const item of baseline.files.filter(item => item.source.endsWith('.md'))) {
    const hash = contentHash(fs.readFileSync(item.source, 'utf8'));
    if (hash === item.referenceSha256LF) assert(!selected.includes(path.resolve(item.source)), item.source);
  }
  assert.deepEqual(selectNotes(['docs/embedded/control_algorithm/pid.md']), [path.resolve('docs/embedded/control_algorithm/pid.md')]);
  assert(!selected.some(file => file.includes('/.vuepress/') || file.includes('\\.vuepress\\')));
  assert.throws(() => selectNotes(['README.md']), /只处理 docs/);
});

test('Windows 与 Linux 换行不会让未修改原笔记被误判为改动，实际文本变化仍被识别', () => {
  assert.equal(contentHash('## 原文\r\n\r\n正文\r\n'), contentHash('## 原文\n\n正文\n'));
  assert.notEqual(contentHash('## 原文\n\n正文\n'), contentHash('## 原文\n\n改写正文\n'));
});
