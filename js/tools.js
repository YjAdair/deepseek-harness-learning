// 交互工具：场景 JSON 构建器（场景章）、开头交接计量器（记忆章）
import { PANEL_TYPES } from './content.js';

export const $ = (s, r = document) => r.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 无痕模式等，忽略 */ } },
};

export const builderHTML = () => `
  <div class="form">
    <div class="grid g2">
      <label>场景 id（= 文件名）<input id="sj-id" value="self-review"></label>
      <label>场景名<input id="sj-name" value="自我复盘"></label>
    </div>
    <div id="sj-panels"></div>
    <div class="row"><button class="btn sm" id="sj-add">＋ 加面板</button><button class="btn sm" id="sj-copy">复制 JSON</button></div>
    <div class="minigrid" id="sj-grid" aria-label="网格预览"></div>
    <div class="lint" id="sj-lint"></div>
    <pre class="term" id="sj-out" style="max-height:300px"></pre>
  </div>`;

export const handoffHTML = () => `
  <div class="form"><textarea id="ho" spellcheck="false" aria-label="开头交接草稿"></textarea></div>
  <div class="kb"><span id="ho-kb">0 B</span><i><b id="ho-bar" style="width:0"></b></i><span>4096 B</span></div>
  <div class="lint" id="ho-lint"></div>`;

export function initSceneBuilder(el) {
  let panels = [
    { title: '预览', type: 'review-doc', col: 1, row: 1, w: 3, h: 3 },
    { title: '库', type: 'review-files', col: 4, row: 1, w: 1, h: 3 },
    { title: 'AI·自我复盘', type: 'harness', col: 1, row: 4, w: 4, h: 2 },
  ];
  const wrap = $('#sj-panels', el);
  const opts = (v) => PANEL_TYPES.map((t) => `<option value="${t.v}" ${t.v === v ? 'selected' : ''}>${t.label}</option>`).join('');
  const num = (k, v, i) => `<label>${k}<input type="number" min="1" max="8" data-i="${i}" data-k="${k}" value="${v}"></label>`;

  function drawRows() {
    wrap.innerHTML = panels.map((p, i) => `<div class="prow">
      <label>标题<input data-i="${i}" data-k="title" value="${esc(p.title)}"></label>
      <label>type<select data-i="${i}" data-k="type">${opts(p.type)}</select></label>
      ${num('col', p.col, i)}${num('row', p.row, i)}${num('w', p.w, i)}${num('h', p.h, i)}
      <button class="x" data-del="${i}" aria-label="删除面板">×</button></div>`).join('');
  }
  function update() {
    const id = $('#sj-id', el).value.trim(), name = $('#sj-name', el).value.trim();
    const out = {
      id, name, layout: 'grid', theme: 'dark',
      panels: panels.map((p, i) => {
        const o = { id: 'p' + (i + 1), title: p.title, type: p.type };
        if (p.type === 'harness') Object.assign(o, { sessionTitle: name, sessionId: 'session-0000…', pinTarget: name });
        return Object.assign(o, { col: p.col, row: p.row, w: p.w, h: p.h });
      }),
    };
    $('#sj-out', el).textContent = `// 文件名：scenarios/${id || '<id>'}.json\n` + JSON.stringify(out, null, 2);

    // 校验（依据仓库「新手必读」与「从零到能跑」）
    const L = [];
    if (!/^[a-z0-9-]+$/.test(id)) L.push(['e', 'id 建议只用小写字母/数字/连字符；文件名必须 = id，否则标签栏不出现']);
    const cells = new Map();
    let rows = 0;
    panels.forEach((p, i) => {
      const t = PANEL_TYPES.find((x) => x.v === p.type);
      if (t?.unknown) L.push(['e', `面板「${p.title}」type 未注册 → 界面只显示一行灰字「未知面板类型」，不报错、不崩`]);
      if (p.col + p.w - 1 > 4) L.push(['e', `面板「${p.title}」越界：col + w - 1 = ${p.col + p.w - 1} > 4 列`]);
      for (let c = p.col; c < p.col + p.w; c++) for (let r = p.row; r < p.row + p.h; r++) {
        const k = c + ',' + r;
        if (cells.has(k)) L.push(['e', `面板「${p.title}」与「${cells.get(k)}」在 (${c},${r}) 重叠`]);
        else cells.set(k, p.title);
      }
      rows = Math.max(rows, p.row + p.h - 1);
    });
    const ai = panels.filter((p) => p.type === 'harness').length;
    if (!ai) L.push(['w', '没有 harness 面板：这个场景没有常驻 AI，只是个壳']);
    if (ai) L.push(['w', 'sessionId 仍是占位 session-0000… —— 必须换成你真实存在的会话 id，否则面板不钉会话（且不报错）']);
    if (ai > 1) L.push(['w', `${ai} 块 AI 面板：确认每块都有独立分区，否则会抢同一个「当前会话」键`]);
    if (!L.some((x) => x[0] === 'e')) L.push(['g', '结构校验通过（判据仍以画面为准：切过去看到的是不是那一条会话）']);
    $('#sj-lint', el).innerHTML = [...new Map(L.map((x) => [x[1], x])).values()].map(([c, m]) => `<div class="${c}">${esc(m)}</div>`).join('');

    // 网格预览
    const g = $('#sj-grid', el);
    g.style.gridTemplateRows = `repeat(${Math.max(rows, 1)}, 22px)`;
    g.innerHTML = panels.map((p) => {
      const t = PANEL_TYPES.find((x) => x.v === p.type);
      return `<div class="${p.type === 'harness' ? 'ai' : ''} ${t?.unknown ? 'bad' : ''}" style="grid-column:${p.col} / span ${Math.min(p.w, Math.max(1, 5 - p.col))};grid-row:${p.row} / span ${p.h}">${esc(p.title)}</div>`;
    }).join('');
  }
  wrap.addEventListener('input', (e) => {
    const { i, k } = e.target.dataset; if (i == null) return;
    panels[i][k] = ['col', 'row', 'w', 'h'].includes(k) ? Math.max(1, Number(e.target.value) || 1) : e.target.value;
    update();
  });
  wrap.addEventListener('click', (e) => {
    const d = e.target.dataset.del; if (d == null) return;
    panels.splice(Number(d), 1); drawRows(); update();
  });
  $('#sj-add', el).addEventListener('click', () => {
    const row = panels.reduce((m, p) => Math.max(m, p.row + p.h), 1);
    panels.push({ title: '新面板', type: 'placeholder', col: 1, row, w: 2, h: 1 }); drawRows(); update();
  });
  $('#sj-copy', el).addEventListener('click', async (e) => {
    const txt = $('#sj-out', el).textContent.split('\n').slice(1).join('\n');
    try { await navigator.clipboard.writeText(txt); e.target.textContent = '已复制 ✓'; } catch { e.target.textContent = '复制失败，请手动选中'; }
    setTimeout(() => (e.target.textContent = '复制 JSON'), 1600);
  });
  ['#sj-id', '#sj-name'].forEach((s) => $(s, el).addEventListener('input', update));
  drawRows(); update();
}

export function initHandoff(el) {
  const KEY = 'dsh.handoff.v1';
  const tpl = `## §〇 当前交接（≤ 4 KB）
### 1) 上次交接
- 2026-11-09：给「自我复盘」场景写好定位卡；证据：<路径>
### 2) 当前项目
| 项目 | 记忆文件 | 状态 | 下一步 |
|---|---|---|---|
| 学习站 | dsh-site.md | 进行中 | 补实战章节 |
### 3) 私有记忆变更
- 2026-11-09：开头交接改为覆盖写（原因：追加后没人读）
### 4) 下一步 / 卡点
- 下一步：跑 场景记忆 check，通过后再换会话
- 卡点：无
### 5) 全貌（工具生成，别手改）
`;
  const ta = $('#ho', el);
  ta.value = store.get(KEY, tpl);
  const enc = new TextEncoder();
  const check = () => {
    const v = ta.value, bytes = enc.encode(v).length, pct = Math.min(100, (bytes / 4096) * 100);
    $('#ho-kb', el).textContent = `${bytes} B`;
    const bar = $('#ho-bar', el);
    bar.style.width = pct + '%';
    bar.style.background = bytes > 4096 ? 'var(--red)' : bytes > 3400 ? 'var(--amber)' : 'var(--cyan)';
    const L = [];
    if (bytes > 4096) L.push(['e', `超出 4 KB 红线 ${bytes - 4096} B → 历史挪进 归档\\，只留指针`]);
    ['1) 上次交接', '2) 当前项目', '3) 私有记忆变更', '4) 下一步 / 卡点'].forEach((s) => { if (!v.includes(s)) L.push(['e', `缺小节「${s}」`]); });
    if (/卡点[：:]\s*$/m.test(v)) L.push(['w', '卡点为空：没有就写「无」']);
    const adj = v.match(/差不多|基本上|大概|还行|有点乱/g);
    if (adj) L.push(['w', `出现形容词「${[...new Set(adj)].join('、')}」：交接要写事实（可观察的现象 / 证据 / 路径）`]);
    if (!L.length) L.push(['g', 'check 通过：可以换会话']);
    $('#ho-lint', el).innerHTML = L.map(([c, m]) => `<div class="${c}">${esc(m)}</div>`).join('');
    window.dispatchEvent(new CustomEvent('dsh:handoff', { detail: bytes }));
    store.set(KEY, v);
  };
  ta.addEventListener('input', check); check();
}

