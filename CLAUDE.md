# DeepSeekHarness 学习站 · 项目规范

## 这是什么
把博主「淋雨家 / 马上淋雨」的 DSH（DeepSeek Harness）AI 工作台设计理念，整理成一个**从理念到实战**的赛博风学习网站。
- 内容来源：GitHub 仓库 `mashanglinyu/luanyujia-workbench`（MIT）+ B 站视频 BV15mnJ6YELj（无公开字幕，仅简介可用）
- 前端：原生 ES Module + three.js（CDN importmap 引入，**零构建、零 npm 依赖**）

## 目录约定
```
DeepSeekHarness/
├── CLAUDE.md            本文件：规范先行，改规范先改这里
├── index.html           唯一页面入口（结构与章节骨架）
├── css/style.css        全部样式；颜色只用 :root 里的 token
├── js/
│   ├── main.js          启动入口：装配场景、UI、滚动联动
│   ├── scene.js         three.js 背景场景（粒子形态 / 场景节点 / 后期辉光）
│   ├── content.js       课程内容数据（纯数据，不写 DOM）
│   ├── ui.js            理念部分（开机 → 专题）DOM 渲染与交互，导出公共小工具
│   └── ui-practice.js   实战部分（机制化 → 判据 + 页脚）：清单、JSON 构建器、交接计量器、测验
├── assets/figures/      原仓库 `配图/` 的 MIT 原图（保持原文件名，出处写进 docs/sources.md）
├── assets/video/        原视频时间轴截图 / GIF，命名 `t<mmss>-<主题>.jpg|gif`
├── docs/
│   ├── sources.md       内容出处与提炼说明
│   └── LICENSE-luanyujia-workbench.txt  原仓库 MIT 许可证全文
└── .claude/launch.json  本地预览服务配置（python3 静态服务 8731，带 no-store 防缓存）
```
- 章节编号由 `content.js` 的 `CH` 顺序自动生成，渲染里用 `head('<章节id>', …)`，不写死编号
- 新增章节：先在 `content.js` 加数据，再在 `ui.js` 写渲染，**不要把文案硬写进 index.html**
- 新增 3D 形态：只在 `scene.js` 的 `FORMATIONS` 里加，章节通过 `data-formation` 属性切换
- 不引入构建工具；需要第三方库时只用 jsdelivr/unpkg 带**精确版本号**的地址
- 架构图：节点数据只放 `content.js` 的 `ARCH`，章节↔节点对应放 `CH_NODES`；章节头的「你在这里」定位小图由 `head()` 自动生成，不在各章手写
- 通俗化：每章「大白话」块的数据放 `content.js` 的 `PLAIN[章节id]`（一句类比 + 可选配图；具体例子一律用作者的真实经历 `STORY`，不自编故事），由 `plain(id)` 渲染，插在章节头之后、专业内容之前
- 配图来源只有两类：MIT 原仓库的图；原视频画面（用户 2026-11-10 决定使用）。视频截图 / GIF 必须标时间戳并链接到 B 站对应秒数（`?t=`）；GIF 宽 ≤640、单个 ≤1.5 MB、懒加载
- 视频转写稿只放 scratchpad，不进仓库；站内只放自己的概述和不超过一句的原话引用
- 视频内容不单独成章：作者在视频里的经历以 `content.js` 的 `STORY` 嵌进对应讲解子模块（`at` 指子模块锚点），由 `story(章节id, at)` 渲染，结构固定为「遇到的问题 → 作者怎么做 → 结果 / 定下的规矩」+ 画面 + 可跳转时间戳
- 术语：原文的内部节号（`§〇` / `§五` / `§6.4`）不当概念名用。`§〇` 一律写「场景记忆 · 开头交接」（AI 开场读场景记忆，读的就是这一节），首次出现注明「原文记作 §〇，即场景记忆文件第 0 节」
- 案例：只能来自原仓库原文或视频转写，每条标出处（仓库文件路径或视频时间戳），原话加引号照抄；推断不得写成案例。数据放 `content.js` 的 `CASES`，由 `cases(id)` 渲染，结构固定为「出了什么事 → 后果 → 所以这样设计 → 出处」
- 理论文案以作者仓库 https://github.com/mashanglinyu/luanyujia-workbench 为准，改文案前先回原文核对
- 学习进度等用户状态只存 `localStorage`，键名统一前缀 `dsh.` 并带版本号（如 `dsh.progress.v1`），读写包 try/catch

## 内容纪律
- 结论先行；每个机制写清「是什么 / 判据一句话 / 不这样会怎样」
- 原仓库的占位符（`<DSH根>`、`session-0000…`）保持占位，不编造真实路径或会话 id
- 不编造视频里没说、仓库里没写的内容；自己的提炼要标明是提炼
- 「大白话」类比属于本站提炼，页面上必须带「本站提炼」标记；先讲人话，再讲专业，专业内容不删

## 验证
```bash
python3 -m http.server 8731   # 在项目根目录起静态服务
```
- 打开 http://localhost:8731 ，检查：控制台无报错、3D 背景渲染、章节切换时粒子形态变化、测验/清单可交互
- 手机宽度（375px）无横向滚动
- 全景图节点可点、能跳章；每章定位小图高亮正确；配图都能加载与放大
