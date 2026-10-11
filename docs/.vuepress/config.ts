import { defineUserConfig } from 'vuepress';
import { viteBundler } from '@vuepress/bundler-vite';
import { hopeTheme } from 'vuepress-theme-hope';
import { base, knowledgePlugin, sidebar } from './knowledge.js';

export default defineUserConfig({
  base,
  lang: 'zh-CN',
  title: '笔记',
  description: '记录我的学习与工程实践',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: base + 'note.svg' }]],
  dest: 'docs/.vuepress/dist',
  bundler: viteBundler({ viteOptions: { build: { assetsInlineLimit: 0 }, ssr: { noExternal: ['@vuepress/search-helper'] } } }),
  theme: hopeTheme({
    hostname: 'https://luck-zhong.github.io',
    logo: '/note.svg',
    repo: 'luck-zhong/my-notes',
    docsDir: 'docs',
    docsBranch: 'master',
    navbar: [{ text: '首页', link: '/' }, { text: '嵌入式', link: '/embedded/' }, { text: '光模块', link: '/optical-module/' }],
    sidebar: sidebar(),
    sidebarSorter: [],
    breadcrumb: true,
    toc: true,
    darkmode: 'switch',
    pure: true,
    fullscreen: false,
    pageInfo: false,
    lastUpdated: true,
    contributors: false,
    editLink: false,
    footer: '记录 · 理解 · 实践',
    copyright: '© 笔记',
    displayFooter: true,
    markdown: { math: { type: 'katex' } },
    plugins: {
      blog: false,
      comment: false,
      slimsearch: { indexContent: true, locales: { '/': { placeholder: '搜索标题或正文', emptyResult: '没有找到相关笔记，试试其他关键词。' } } },
      copyCode: { showInMobile: true },
    },
  }),
  plugins: [knowledgePlugin()],
});
