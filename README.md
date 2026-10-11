# 笔记 · 个人技术知识库

基于 VuePress 2、VuePress Theme Hope 和 Vite，使用 Markdown 维护技术笔记。提供整屏介绍首页、分类导航、全文搜索、代码复制与数学公式。

- 网站：https://luck-zhong.github.io/my-notes/
- 产品需求：[requirements.md](requirements.md)
- 迁移清单：[migration/content-baseline.json](migration/content-baseline.json)
- 验收记录：[migration/verification.md](migration/verification.md)
- 笔记写法：[writing/STYLE_GUIDE.md](writing/STYLE_GUIDE.md)

## 1. 准备环境

安装 Node.js 22（至少 22.18.0；也可使用更新的兼容版本）和 Git。在项目目录打开终端：

```powershell
node --version
npm install --global npm@11.13.0
npm --version
npm ci
```

首次安装需要联网。本地和 GitHub Actions 都使用 npm 11.13.0，避免不同版本对锁文件的解析差异。`npm ci` 按锁文件安装，日常不用升级依赖。

## 2. 本地预览

```powershell
npm start
```

打开终端显示的地址，如 `http://localhost:8080/my-notes/`。已有文章的正文修改可以实时预览；添加文章、文件夹或修改文件头时，Ctrl+C 停止服务后重新运行 `npm start`，刷新自动导航和首页列表。

发布前查看完整生产结果：

```powershell
npm run typecheck
npm run notes:check
npm run build
npm run verify
npm run serve
```

打开 `http://127.0.0.1:4173/my-notes/`。全文搜索和旧地址跳转以生产预览为准；发布使用相同构建流程。Ctrl+C 停止服务。

## 3. 添加或编辑笔记

编辑 `docs` 中的 `.md` 文件，`##`、`###` 自动成为章节目录。新笔记可放入已有文件夹，如 `docs/embedded/control_algorithm/新算法.md`：

```markdown
---
title: 新算法笔记
---

## 问题背景

这里写正文。

## 实现方法

这里写正文。
```

`title` 可选，未填写时使用文件名。默认网页地址是 `/my-notes/embedded/control_algorithm/新算法.html`。如需固定地址，可在文件头加入：

```yaml
permalink: /embedded/control_algorithm/my-algorithm.html
```

永久链接以 `/` 开头，以 `.html` 或 `/` 结尾，**不包含 `/my-notes/`**，不能与其他文章重复。公开文章的永久链接应保持稳定。

更新时间与“最近更新”来自 Git 提交。尚未提交的文章没有日期，但仍可阅读和搜索；提交后自动显示。

## 4. 图片、代码和公式

图片放在文章旁边的 `assets` 文件夹：

```markdown
![图片说明](./assets/示意图.png)
```

已有的 `assets/...` 写法也兼容。代码使用带语言的三个反引号围栏，例如 `c` 或 `python`，页面会显示高亮和复制按钮。行内公式使用 `$e = r-y$`；独立公式写在两行 `$$` 之间。

## 5. 增加分类

在 `docs` 下增加文件夹并放入笔记。第一层目录自动成为首页分类，子目录成为折叠目录，分类介绍页自动生成。`assets` 和点开头的目录不进入导航。

例如 `docs/计算机基础/网络/TCP.md` 生成“计算机基础 → 网络 → TCP”。现有英文目录的中文名称在 `docs/.vuepress/knowledge.ts` 的 `labels` 中维护。自定义分类介绍可添加 `README.md` 并写 `article: false`，它不会作为普通笔记进入最近更新。

## 6. 修改首页

- 网站名称和描述：`docs/.vuepress/config.ts`。
- 首页名称与标语：`docs/README.md` 的 `heroText` 和 `tagline`。
- 图标：替换 `docs/.vuepress/public/note.svg`。
- 分类卡片和最近更新：自动生成，无需手动逐篇添加。

## 7. 发布到 GitHub Pages

本地检查通过后，查看文件，提交并推送 `master`：

```powershell
git status
git add docs
git commit -m "更新技术笔记"
git push origin master
```

配置、脚本或文档也有变动时，将对应文件加入提交。**只保存文件，不会更新线上网站。** 首次发布需在 GitHub Settings → Pages 将 Source 设为 GitHub Actions。

推送后进入 Actions 查看工作流。工作流获取完整 Git 历史用于正确计算更新时间；检查成功才部署，失败时线上保留上次成功版本。打开红色步骤看失败原因，在本地运行同一命令复现，修复后重新提交即可。

## 8. 完整性与历史地址

`npm run verify` 检查文章、图片、分类、首页和旧地址，允许正常编辑笔记。首次迁移可运行 `npm run verify -- --migration`，确认原始 Markdown 内容不变（统一 Windows／Linux 换行后比较），图片仍按原字节校验。

旧的不带 `.html` 的地址生成静态跳转页，保留查询参数与章节锚点。不要删除迁移清单；移动原笔记时，在 `migration/publication-baseline.json` 中同步维护 `sourceRenames` 及跳转规则。空 CMIS 原稿保存在 `migration/archived/cmis.md`，旧公开地址显示内容待补充的说明。

`blog`、`static` 是原项目保留下来的模板资料，不作为新网站的内容来源。

## 9. 整理笔记与获得修改建议

先看 [ESC 风格示范](docs/embedded/control_algorithm/esc.md)，再参考 [笔记风格指南](writing/STYLE_GUIDE.md)。复制 [概念](writing/templates/concept.md)、[算法](writing/templates/algorithm.md) 或 [问题记录](writing/templates/issue.md) 模板到 `docs` 的相应目录，填写标题和永久链接。模板不需要全部填满，删除不适用的章节即可。

写完后运行：

```powershell
npm run notes:format
npm run notes:check
```

默认处理新建或相对原文基线改动过的普通笔记，未改过的存量笔记保持现状。基线也包含首次发布时同步的远程笔记，并忽略 Windows／Linux 换行差异。代码围栏保留原内容，公式若可能被改变会提示并停止该文件写入。格式检查给出文件与行号，但不会判断技术结论是否正确。

需要内容建议时，在这个聊天使用 [审阅提示词](writing/review-prompt.md)。先审阅、再预览，最后提交和推送；GitHub Actions 会检查格式，失败时不部署。自动检查不调用 AI，也不会自动改写笔记。

ESC 本次已按你的要求整理，因此与迁移前哈希不同。日常编辑后运行 `npm run verify`；`--migration` 用于初次迁移原文校验，不用于要求日常编辑后的文章仍与旧版逐字相同。原文快照保存在 `writing/reviews/esc-original.txt`，不进入网站。

## 10. 文档审阅、分类与发布记录

- [逐文审阅报告](writing/reviews/library-audit.md)与[分类建议](writing/CLASSIFICATION_PLAN.md)：分类方案尚未全面实施，技术疑问需要另行补证据。
- [首次发布准备记录](migration/publication.md)：同步远程笔记后的目录兼容、图片状态与检查结果。
- [发布基线](migration/publication-baseline.json)：源路径映射、现有 13 个笔记文件和 6 张 PNG 的记录。

光链路笔记中有 4 个图片引用指向仓库外，当前没有提供原图。页面会显示“原文此处的图片暂未提供”，源文件保留原引用。补图时先把原图放进该笔记的 `.assets/`，更新引用并移除发布基线中对应的 `missingImages` 项，再构建检查。
