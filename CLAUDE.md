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
├── docs/
│   └── sources.md       内容出处与提炼说明
└── .claude/launch.json  本地预览服务配置（python3 静态服务 8731，带 no-store 防缓存）
```
- 章节编号由 `content.js` 的 `CH` 顺序自动生成，渲染里用 `head('<章节id>', …)`，不写死编号
- 新增章节：先在 `content.js` 加数据，再在 `ui.js` 写渲染，**不要把文案硬写进 index.html**
- 新增 3D 形态：只在 `scene.js` 的 `FORMATIONS` 里加，章节通过 `data-formation` 属性切换
- 不引入构建工具；需要第三方库时只用 jsdelivr/unpkg 带**精确版本号**的地址
- 学习进度等用户状态只存 `localStorage`，键名统一前缀 `dsh.` 并带版本号（如 `dsh.progress.v1`），读写包 try/catch

## 内容纪律
- 结论先行；每个机制写清「是什么 / 判据一句话 / 不这样会怎样」
- 原仓库的占位符（`<DSH根>`、`session-0000…`）保持占位，不编造真实路径或会话 id
- 不编造视频里没说、仓库里没写的内容；自己的提炼要标明是提炼

## 验证
```bash
python3 -m http.server 8731   # 在项目根目录起静态服务
```
- 打开 http://localhost:8731 ，检查：控制台无报错、3D 背景渲染、章节切换时粒子形态变化、测验/清单可交互
- 手机宽度（375px）无横向滚动
