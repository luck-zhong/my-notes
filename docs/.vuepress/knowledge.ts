import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createPage, type Plugin, type App } from 'vuepress/core';
import { parse } from 'yaml';
import { load } from 'cheerio';

export const sourceRoot = path.resolve('docs');
export const base = '/my-notes/';
const publication = JSON.parse(fs.readFileSync('migration/publication-baseline.json', 'utf8'));
const sourceRenames: Record<string, string> = publication.sourceRenames;
const labels: Record<string, string> = {
  embedded: '嵌入式', 'optical-module': '光模块',
  control_algorithm: '控制算法', issue_list: '问题记录',
  DSP: 'DSP 与电链路', Optical: '光链路', PIC: '硅光 PIC',
  pid: 'PID 控制', esc: '极值寻优控制（ESC）', cmis: 'CMIS 协议',
};
export const label = (name: string): string => labels[name] ?? name.replaceAll('_', ' ');
const slash = (file: string): string => file.replaceAll('\\', '/');
export const contentFiles = (dir = sourceRoot): string[] => fs.readdirSync(dir, { withFileTypes: true })
  .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'assets')
  .flatMap((entry) => entry.isDirectory() ? contentFiles(path.join(dir, entry.name)) :
    entry.name.endsWith('.md') && !/^(README|index)\.md$/i.test(entry.name) ? [path.join(dir, entry.name)] : []);

export const frontmatter = (file: string): Record<string, unknown> => {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return match ? parse(match[1]) ?? {} : {};
};
export const articlePath = (file: string): string => {
  const meta = frontmatter(file);
  const permalink = meta.permalink;
  if (typeof permalink === 'string') {
    if (!permalink.startsWith('/') || (!permalink.endsWith('.html') && !permalink.endsWith('/')))
      throw new Error(`${file}: permalink 必须以 / 开头，并以 .html 或 / 结尾`);
    return permalink;
  }
  return '/' + slash(path.relative(sourceRoot, file)).replace(/\.md$/, '.html');
};
export const articleTitle = (file: string): string => {
  const meta = frontmatter(file);
  return typeof meta.title === 'string' ? meta.title : label(path.basename(file, '.md'));
};

type SidebarItem = { text: string; link: string; collapsible?: boolean; children?: SidebarItem[] };
const sidebarGroup = (dir: string): SidebarItem => {
  const rel = slash(path.relative(sourceRoot, dir));
  const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => !e.name.startsWith('.') && e.name !== 'assets')
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  return { text: label(path.basename(dir)), link: '/' + rel + '/', collapsible: true,
    children: entries.flatMap((entry) => {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) return contentFiles(file).length ? [sidebarGroup(file)] : [];
      if (!entry.name.endsWith('.md') || /^(README|index)\.md$/i.test(entry.name)) return [];
      return [{ text: articleTitle(file), link: articlePath(file) }];
    }) };
};
export const sidebar = (): SidebarItem[] => fs.readdirSync(sourceRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.') && contentFiles(path.join(sourceRoot, e.name)).length)
  .map((e) => sidebarGroup(path.join(sourceRoot, e.name)));

const gitTime = (file: string): number | null => {
  try {
    const value = execFileSync('git', ['log', '--follow', '-1', '--format=%ct', '--', file], { encoding: 'utf8' }).trim();
    return value ? Number(value) * 1000 : null;
  } catch { return null; }
};

const writeRedirect = (app: App, alias: string, target: string, hashMap: Record<string, string>): void => {
  const rel = decodeURI(alias).replace(/^\/my-notes\//, '').replace(/^\//, '');
  const dest = path.resolve(app.dir.dest(), rel.endsWith('.html') ? rel : path.join(rel, 'index.html'));
  const root = path.resolve(app.dir.dest());
  if (!dest.startsWith(root + path.sep)) throw new Error(`不安全的历史地址: ${alias}`);
  if (fs.existsSync(dest)) return;
  const encoded = encodeURI(base.slice(0, -1) + target);
  const escaped = encoded.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>正在打开笔记</title><link rel="canonical" href="${escaped}"><script>const anchors=${JSON.stringify(hashMap)};let hash=location.hash;try{const old=decodeURIComponent(hash.slice(1));if(anchors[old])hash='#'+encodeURIComponent(anchors[old])}catch{}location.replace(${JSON.stringify(encoded)}+location.search+hash)</script><noscript><meta http-equiv="refresh" content="0;url=${escaped}"></noscript></head><body><p>文章地址已更新，请<a href="${escaped}">打开笔记</a>。</p></body></html>`);
};

export const knowledgePlugin = (): Plugin => ({
  name: 'my-notes-knowledge',
  extendsMarkdown(md) {
    // VuePress requires ./ for module-relative image URLs. Normalize render tokens,
    // leaving the user's Markdown bytes and relative asset locations unchanged.
    md.core.ruler.after('inline', 'relative-note-images', (state) => {
      for (const block of state.tokens) for (const token of block.children ?? []) {
        if (token.type !== 'image') continue;
        const src = token.attrGet('src');
        if (src && !/^(?:[a-z][a-z0-9+.-]*:|\/|\.\.?\/|#)/i.test(src)) token.attrSet('src', './' + src);
      }
      // The upstream note references four images outside the repository. Keep
      // source bytes intact and explicitly show the missing figure in the view.
      const missing = new Set(publication.missingImages.map((item: { reference: string }) => item.reference));
      for (const block of state.tokens) for (const token of [block, ...(block.children ?? [])]) {
        if (!['html_inline', 'html_block'].includes(token.type)) continue;
        token.content = token.content.replace(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g, (tag: string, src: string) =>
          missing.has(src) ? '<span class="missing-note-image" role="note">原文此处的图片暂未提供。</span>' : tag);
      }
    });
  },
  extendsPage(page) {
    if (!page.filePath || !contentFiles().includes(path.resolve(page.filePath))) return;
    page.title = articleTitle(page.filePath);
    page.frontmatter.title = page.title;
    page.frontmatter.article = true;
    page.frontmatter.breadcrumb = true;
    page.data.title = page.title;
    page.routeMeta.title = page.title;
    // Preserve original note files; stable explicit frontmatter permalinks are respected by VuePress.
  },
  async onInitialized(app) {
    const groups = sidebar();
    const createCategory = async (group: SidebarItem): Promise<void> => {
      const existing = app.pages.findIndex((page) => decodeURI(page.path) === group.link);
      if (existing < 0 || !app.pages[existing].filePath) {
        const childLinks = group.children?.map((child) => `- [${child.text}](${encodeURI(base.slice(0, -1) + child.link)})`).join('\n') ?? '';
        const page = await createPage(app, { path: group.link, frontmatter: { title: group.text, article: false },
          content: `${group.text}相关的学习笔记与工程实践。\n\n## 文章目录\n\n${childLinks}\n` });
        page.title = page.data.title = group.text;
        page.routeMeta.title = group.text;
        if (existing < 0) app.pages.push(page); else app.pages[existing] = page;
      }
      for (const child of group.children ?? []) if (child.children) await createCategory(child);
    };
    for (const group of groups) await createCategory(group);
    for (const archived of publication.archivedNotes) {
      const page = await createPage(app, { path: archived.path, frontmatter: { title: archived.title, article: false },
        content: '这篇 CMIS 笔记目前尚未填写正文。\n\n[返回光模块分类](/my-notes/optical-module/)\n' });
      page.title = page.data.title = archived.title;
      page.routeMeta.title = archived.title;
      app.pages.push(page);
    }
  },
  async onPrepared(app) {
    const notes = contentFiles().map((file) => {
      const category = slash(path.relative(sourceRoot, file)).split('/')[0];
      return { source: slash(path.relative(process.cwd(), file)), title: articleTitle(file), path: articlePath(file),
        category: label(category), updated: gitTime(file) };
    }).sort((a, b) => (b.updated ?? 0) - (a.updated ?? 0) || a.title.localeCompare(b.title, 'zh-CN'));
    const categories = sidebar().map((group) => ({ title: group.text, path: group.link,
      count: notes.filter((note) => note.path.startsWith(group.link) || note.category === group.text).length,
      children: group.children?.filter((child) => child.children).map((child) => child.text) ?? [] }));
    await app.writeTemp('knowledge.js', `export default ${JSON.stringify({ notes, categories })};\n`);
    await app.writeTemp('knowledge-manifest.json', JSON.stringify({ notes, categories }, null, 2));
  },
  onGenerated(app) {
    const data = JSON.parse(fs.readFileSync(app.dir.temp('knowledge-manifest.json'), 'utf8'));
    const baseline = JSON.parse(fs.readFileSync('migration/content-baseline.json', 'utf8'));
    const routes = data.notes.map((note: { source: string; path: string }) => {
      const old = baseline.files.find((file: { source: string; legacyPath?: string }) =>
        (sourceRenames[file.source] ?? file.source) === note.source);
      const rel = decodeURI(note.path).slice(1);
      const html = fs.readFileSync(app.dir.dest(rel.endsWith('/') ? rel + 'index.html' : rel), 'utf8');
      const $ = load(html);
      const normalized = (text: string): string => text.replace(/[\u200b\u200c\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();
      const headings = $('h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]').toArray().map((el) => {
        const heading = $(el).clone();
        // Hope wraps the heading text inside its anchor; retain that text.
        heading.find('a.header-anchor').each((_, anchor) => { $(anchor).replaceWith($(anchor).text()); });
        return { id: $(el).attr('id')!, text: normalized(heading.text()) };
      });
      const hashMap: Record<string, string> = {};
      const used = new Set<number>();
      for (const anchor of old?.anchors ?? []) {
        const index = headings.findIndex((heading, i) => heading.text === anchor.text && !used.has(i));
        if (index >= 0) { hashMap[anchor.id] = headings[index].id; used.add(index); }
      }
      if (old?.legacyPath) writeRedirect(app, old.legacyPath, note.path, hashMap);
      if (old && old.source !== note.source)
        writeRedirect(app, '/' + old.source.slice('docs/'.length).replace(/\.md$/, '.html'), note.path, hashMap);
      if (note.path.endsWith('.html')) writeRedirect(app, note.path.replace(/\.html$/, ''), note.path, hashMap);
      return { source: note.source, path: note.path, legacyPath: old?.legacyPath ?? null, hashMap };
    });
    for (const archived of publication.archivedNotes) writeRedirect(app, archived.legacyPath, archived.path, {});
    for (const asset of publication.files.filter((file: { source: string }) => !file.source.endsWith('.md'))) {
      const target = app.dir.dest(asset.source.slice('docs/'.length));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(asset.source, target);
    }
    fs.writeFileSync(app.dir.dest('knowledge-manifest.json'), JSON.stringify({ ...data, routes, archivedNotes: publication.archivedNotes }, null, 2));
    fs.writeFileSync(app.dir.dest('.nojekyll'), '');
  },
});
