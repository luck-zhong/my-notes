import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import * as prettier from 'prettier';
import { lint } from 'markdownlint/promise';

const root = path.resolve('docs');
const baseline = JSON.parse(fs.readFileSync('migration/publication-baseline.json', 'utf8'));
const original = new Map(baseline.files.filter(item => item.source.endsWith('.md')).map(item => [path.resolve(item.source), item.referenceSha256LF]));
const normalize = text => text.replaceAll('\r\n', '\n');
export const contentHash = text => crypto.createHash('sha256').update(normalize(text)).digest('hex');
const hash = file => contentHash(fs.readFileSync(file, 'utf8'));
const slash = file => file.replaceAll('\\', '/');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true })
  .filter(entry => !entry.name.startsWith('.') && entry.name !== 'assets')
  .flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) :
    /\.md$/i.test(entry.name) && !/^(readme|index)\.md$/i.test(entry.name) ? [path.join(dir, entry.name)] : []);

// Keep complete fenced blocks, including whitespace inside examples. Prettier's
// embedded-language setting alone can still trim Markdown code-block whitespace.
export const fences = text => {
  const regions = [];
  const lines = normalize(text).match(/[^\n]*\n|[^\n]+$/g) ?? [];
  let offset = 0;
  let open = null;
  for (const line of lines) {
    const value = line.replace(/\n$/, '');
    if (!open) {
      const match = value.match(/^([ \t]*(?:>[ \t]*)*)(`{3,}|~{3,})([^\n]*)$/);
      if (match && !(match[2][0] === '`' && match[3].includes('`')))
        open = { start: offset, prefix: match[1], delimiter: match[2], info: match[3].trim() };
    } else {
      const close = value.match(/^[ \t]*(?:>[ \t]*)*(`+|~+)[ \t]*$/);
      if (close && close[1][0] === open.delimiter[0] && close[1].length >= open.delimiter.length) {
        regions.push({ ...open, end: offset + line.length, text: normalize(text).slice(open.start, offset + line.length) });
        open = null;
      }
    }
    offset += line.length;
  }
  if (open) throw new Error('代码围栏没有闭合，请先补齐结束标记。');
  return regions;
};

const math = text => {
  let prose = normalize(text);
  for (const region of fences(prose).reverse()) prose = prose.slice(0, region.start) + '\n' + prose.slice(region.end);
  return prose.match(/\$\$[\s\S]*?\$\$|(?<!\\)\$(?!\$)(?:\\.|[^$\n])+\$(?!\$)/g) ?? [];
};

export const formatNote = async (text, filepath) => {
  const source = normalize(text);
  const config = await prettier.resolveConfig(filepath);
  let formatted = await prettier.format(source, { ...config, parser: 'markdown', embeddedLanguageFormatting: 'off', endOfLine: 'lf' });
  const before = fences(source);
  const after = fences(formatted);
  if (before.length !== after.length || before.some((region, i) => region.info !== after[i].info))
    throw new Error('排版将改变代码块结构，请人工检查；文件未写入。');
  if (before.some((region, i) => region.prefix !== after[i].prefix))
    throw new Error('代码块所在列表或引用的缩进需人工确认；文件未写入。');
  for (let i = after.length - 1; i >= 0; i--)
    formatted = formatted.slice(0, after[i].start) + before[i].text + formatted.slice(after[i].end);
  if (JSON.stringify(math(source)) !== JSON.stringify(math(formatted)))
    throw new Error('排版将改变公式，请人工检查；文件未写入。');
  return formatted;
};

export const selectNotes = (files = []) => {
  const selected = files.length ? files.map(file => path.resolve(file)) :
    walk(root).filter(file => !original.has(file) || hash(file) !== original.get(file));
  return [...new Set(selected)].map(file => {
    if (!file.startsWith(root + path.sep) || !file.endsWith('.md') || slash(path.relative(root, file)).split('/').some(part => part.startsWith('.') || part === 'assets'))
      throw new Error(`只处理 docs 中的 Markdown 笔记：${file}`);
    if (!fs.existsSync(file)) throw new Error(`文件不存在：${file}`);
    return file;
  });
};

const main = async () => {
  const [mode, ...args] = process.argv.slice(2);
  if (!['check', 'format'].includes(mode)) throw new Error('用法：npm run notes:check 或 npm run notes:format -- docs/分类/笔记.md');
  const files = selectNotes(args);
  if (!files.length) { console.log('没有新建或改动过的笔记；原有笔记保留现状。'); return; }
  let failed = false;
  const config = JSON.parse(fs.readFileSync('.markdownlint.json', 'utf8'));
  for (const file of files) {
    const name = slash(path.relative(process.cwd(), file));
    const text = fs.readFileSync(file, 'utf8');
    let formatted;
    try { formatted = await formatNote(text, file); }
    catch (error) { console.error(`${name}: ${error.message}`); failed = true; continue; }
    if (mode === 'format') {
      if (text !== formatted) fs.writeFileSync(file, formatted);
      console.log(`已整理：${name}（保留代码与公式）`);
    } else if (normalize(text) !== formatted) {
      console.error(`${name}: 排版不统一，请运行 npm run notes:format -- "${name}"`);
      failed = true;
    }
    const results = await lint({ strings: { [name]: mode === 'format' ? formatted : text }, config });
    const errors = results[name];
    for (const error of errors) {
      console.error(`${name}:${error.lineNumber} ${error.ruleNames[0]} ${error.ruleDescription}${error.errorDetail ? ': ' + error.errorDetail : ''}`);
      failed = true;
    }
  }
  if (failed) process.exitCode = 1;
  else console.log(`笔记格式检查通过：${files.length} 篇。内容和技术结论仍需人工审阅。`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
