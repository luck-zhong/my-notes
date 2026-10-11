# 知识库文件夹分类方案

规划日期：2026-10-11。此文是分类方案，尚未移动、删除或合并原文件。

当前内容主要围绕嵌入式控制、MCU 电源问题、光模块链路和硅光原理。保留“嵌入式”“光模块”两个入口；第二层按技术主题分类。文章是原理介绍、算法还是问题案例，通过标题和开头说明，不再用“知识扩展”装下所有主题。

发布同步说明：随后同步远程更新，保留了作者在 GitHub 上建立的 DSP／Optical／PIC 分类，并实现相应的旧地址兼容。本方案基于同步前的内容清单，进一步分类与技术内容整理尚未全面实施；当前目录以[发布准备记录](../migration/publication.md)为准。

## 1. 建议的目录

```text
my-notes/
├─ docs/                              网站公开内容
│  ├─ README.md                       首页
│  ├─ .vuepress/                      网站配置、组件和公共图标
│  ├─ embedded/                       嵌入式
│  │  ├─ control-algorithms/           控制算法
│  │  │  ├─ pid.md
│  │  │  ├─ esc.md
│  │  │  └─ assets/                   本分类的图片
│  │  └─ mcu-power/                    MCU 电源与复位
│  │     ├─ stm32-pvd-bor-dsp-brownout.md
│  │     └─ assets/
│  └─ optical-module/                 光模块
│     ├─ architecture/                模块架构
│     │  └─ lpo-lro-npo-cpo-xpo.md
│     ├─ signal-integrity/            链路与信号质量
│     │  ├─ host-media-paths.md
│     │  └─ ctle-dfe-ffe.md
│     ├─ silicon-photonics/           硅光与调制器
│     │  └─ dr4-pic-mzm-bias.md
│     └─ cmis/                        有正文后建立此分类
│        └─ introduction.md
├─ writing/                           给作者使用的写作资料
│  ├─ STYLE_GUIDE.md
│  ├─ CLASSIFICATION_PLAN.md
│  ├─ review-prompt.md
│  ├─ guides/
│  │  └─ issue-recording.md            原“问题记录模板”的详细指导
│  ├─ templates/                      可复制的简短写作模板
│  └─ reviews/                        审阅意见、清单及历史快照
├─ drafts/                            尚未公开的笔记
│  └─ optical-module/cmis/introduction.md
├─ archive/                           保留原稿及已停用的示例资料
│  ├─ duplicate-notes/
│  └─ docusaurus/
├─ migration/                         迁移前清单、地址记录及验收记录
├─ scripts/                           构建、检查与本地预览工具
├─ .github/workflows/                 自动发布流程
├─ requirements.md                    项目需求
└─ README.md                          新手维护入口
```

这是目标目录示意，草稿、归档、CMIS 分类暂不批量创建。现有资料足以支撑控制算法、MCU 电源、模块架构、链路信号和硅光五个专题；有新文章后再增加细分目录。

网站菜单对应中文名称：嵌入式 → 控制算法／MCU 电源与复位；光模块 → 模块架构／链路与信号质量／硅光与调制器。CMIS 有完整入门内容后再进入菜单。

## 2. 现有九个笔记文件怎样归类

下面的目标路径均为建议。现有文件位置见[逐文审阅报告](reviews/library-audit.md)。

| 当前文件（均在 `docs` 内）                                           | 建议位置                                                                             | 处理方式                                                                                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `embedded/control_algorithm/pid.md`                                  | `docs/embedded/control-algorithms/pid.md`                                            | 保留原稿，补采样周期与边界说明，再整理排版                                                                              |
| `embedded/control_algorithm/esc.md`                                  | `docs/embedded/control-algorithms/esc.md`                                            | 保留已整理的风格；技术问题单独修订                                                                                      |
| `embedded/issue_list/PWR_Monitor功能.md`                             | `docs/embedded/mcu-power/stm32-pvd-bor-dsp-brownout.md`                              | 标题建议“STM32 PVD／BOR：MCU 与 DSP 掉电状态不一致”；补型号、证据与回归                                                 |
| `embedded/issue_list/问题记录模板.md`                                | `writing/guides/issue-recording.md`                                                  | 是写作指南，保留详细解释；与简短问题模板互相链接                                                                        |
| `optical-module/cmis.md`                                             | `drafts/optical-module/cmis/introduction.md`，完成后进入 `docs/optical-module/cmis/` | 当前为零字节；移出正式文章列表时，旧公开地址需留“内容待补充”提示页                                                      |
| `optical-module/知识扩展/高速光模块架构_LRO_LPO_NPO_XPO.md`          | `docs/optical-module/architecture/lpo-lro-npo-cpo-xpo.md`                            | 补来源日期与架构适用条件；内容已包含 CPO，标题一并体现                                                                  |
| `optical-module/知识扩展/400G_DR4_硅光PIC工作原理_VDAC_VB_RF笔记.md` | `docs/optical-module/silicon-photonics/dr4-pic-mzm-bias.md`                          | 先保留为一篇完整教程，补模型条件与资料信息；不急于拆成很多小文件                                                        |
| `optical-module/知识扩展/光模块 HRx  HTx  LRx  LTx 参数.md`          | `docs/optical-module/signal-integrity/host-media-paths.md`                           | 前 634 行作为四个接口位置的主文；末尾均衡器对比转入下篇，并加入交叉链接                                                 |
| `optical-module/知识扩展/CTLE、DFE、FFE区别.md`                      | `docs/optical-module/signal-integrity/ctle-dfe-ffe.md`                               | 当前全文重复上篇的主体。原稿保存在 `archive/duplicate-notes/`；用上篇末尾的对比表建立符合标题的文章，再补适用条件和来源 |

PVD 案例同时涉及光模块系统，但其核心是电压检测和复位协调，因此主文放在 MCU 电源分类；光模块文章用链接引用它，不复制全文。ESC 在嵌入式目录解释算法，硅光文章链接到它说明 Bias 控制应用。

400G DR4 长文先用二级／三级标题改善浏览。只有以后出现可以独立复用的完整专题，例如“MZM 传输模型”或“工作点校准实验”，才拆文；拆文时保留总览和旧章节跳转。

## 3. 图片、草稿和旧示例

两张原 PNG 分别随 ESC 和 PVD 案例所在专题迁移，保持图片文件名。改动前检查相对引用；迁移后确认浏览器加载到同一张图，核对图片 SHA-256。

`docs/.vuepress/public/note.svg` 是全站图标，应留在公共资源目录。笔记图像使用所在专题的 `assets/`。文件名只需能识别用途，同一图片不要在不同文章文件夹反复复制。

`drafts/`、`writing/` 和 `archive/` 均位于 `docs/` 外，当前 VuePress 构建不会把它们加入公开目录和全文搜索。没有完成的笔记先放草稿；不要只在 `docs` 内新建一个叫 `drafts` 的文件夹，那仍可能被当前自动目录逻辑发布。

旧 `blog/` 中的四篇 Docusaurus 示例及配套图片、作者和标签文件，建议整体归档到 `archive/docusaurus/blog/`。旧 `static/img/` 的七个图标／示例图暂留；确认没有外部引用后再归档。它们是停用资料，不能只因“看起来多余”就删除。

## 4. 命名与新增文章的判断方法

目录用短而稳定的英文小写名称，词间使用连字符；页面中文名称在网站配置中定义。新文件也用英文短名，文章标题使用自然的中文。这是以后新增内容的约定，已发布文件不需要为了命名整齐而立即改名。

新增文章时依次判断：

1. 主要讲 MCU、控制算法和通用固件，还是光模块的接口、光路与管理协议？选择一级分类。
2. 是否能放进现有专题？能放就直接添加；同一主题已有两三篇、读者也确实需要按它查找时再细分。
3. 是已完成的内容、未完成的草稿，还是供作者复制的模板？分别放入 `docs`、`drafts`、`writing`。
4. 属于多个主题时，确定一份主文，在其他文章中链接引用。

例如：PID 调参 → 控制算法；PVD 与 BOR 故障 → MCU 电源；DFE 误码传播 → 链路与信号质量；MZM Heater 工作点 → 硅光与调制器；ApplyDPInit 状态处理 → CMIS。CMIS 示例需标明协议版本，并区分标准要求、厂商行为和自己的固件实现。

写法由模板决定，不由目录决定。问题案例不要求全部塞进 `issue_list`，概念介绍也不要求全部塞进“知识扩展”。暂不增加通用“其他”分类，以免再次变成混合目录。

## 5. 移动文件前必须解决的地址兼容

当前网站按目录生成导航，但普通文章地址默认也来自文件路径。因此文件迁移需要同步改代码；单独 `git mv` 会改变地址，并导致当前完整性检查失败。

### 5.1 将文件位置与公开地址分开

先给所有已发布笔记记录明确的 `permalink`。此次审阅已在[清单](reviews/library-inventory.json)的 `route` 字段保存当前文章地址；清单中的地址不包含部署前缀 `/my-notes/`。

例如，ESC 即使将来移动文件，也继续使用：

```yaml
---
title: 极值寻优控制（ESC）
permalink: /embedded/control_algorithm/esc.html
---
```

若选择更换文章网址，需要同时为当前 VuePress 地址和原 Docusaurus 地址提供跳转，并处理原章节链接。重复文章不能仅整体跳转：HRx 主文和均衡器对比被拆开后，属于对比表的旧章节应进入新均衡器文章，其余章节进入接口主文。

模板退出公开文章列表后，旧模板地址可以跳转到网站内的“如何记录工程问题”简短说明页；完整模板仍在仓库写作目录，页面可提供 GitHub 文件链接。CMIS 空页的旧址需要保留可访问的状态页。这些说明页要有明确用途，不冒充完成的技术文章。

### 5.2 调整当前实现

| 位置                                | 必要调整                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `docs/.vuepress/knowledge.ts`       | 增加英文新目录到中文菜单的映射；允许历史源路径映射到新文件；支持一个旧页面的不同章节进入不同新文章               |
| 同文件的分类与面包屑生成            | 目录按新分类展示；保留旧 `permalink` 时，面包屑也需明确使用新分类信息，避免显示旧目录                            |
| 同文件的 Git 修改时间读取           | 当前 `git log -- 路径` 不跟踪改名；迁移后考虑 `git log --follow`，并验证更新时间排序                             |
| `scripts/verify.mjs`                | 当前要求迁移清单中的每个原路径仍然存在；改为检查源路径映射、归档副本、目标内容和历史跳转，不删除原清单来绕过检查 |
| `scripts/notes.mjs`                 | 当前原文识别按旧源路径取哈希；迁移后让移动但未改正文的文章仍能识别，不把所有移动文件当作新文章强制一次性重排     |
| `writing/templates/` 与 `README.md` | 更新新建文章示例；旧文章保留原永久链接，新文章填写唯一地址，模板占位值不能照抄发布                               |

不覆盖 `migration/content-baseline.json`；它记录迁移前的事实。以后另外记录目录迁移映射及内容整理说明。

## 6. 建议执行顺序与验收

1. 保留本次审阅清单，先处理错名重复文章和空 CMIS 页的发布方式；保留原文副本，逐段确认提取结果。
2. 修订 ESC 示例、PID 采样说明、PVD 案例证据和硅光参考资料，分别记录改动；未取得资料的项目仍标明待验证。
3. 实现源文件映射、永久链接、旧章节跳转及检查脚本，再移动目录和图片。
4. 整理标题层级、代码语言、公式与图注，更新模板和新手说明。
5. 运行格式检查、排版保护测试、类型检查、生产构建和更新后的完整性检查；验证旧地址、旧章节、目录、中文搜索与两张图片。
6. 在 1440 和 390 像素页面检查分类路径、章节跳转和滚动；确认归档、草稿、作者模板没有进入站内搜索。

此次只交付规划。实施分类迁移时，以上步骤应在同一个可审阅改动中完成，避免出现目录已经移动、历史链接尚未修好的中间版本。
