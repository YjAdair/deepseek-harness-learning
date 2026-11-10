// 交互工具：每个工具 = { t: 标题, html(): 字符串, init(el, scene) }，挂到 TOOLS[章节id]
// 场景 JSON 构建器（含网格坐标演示）· 开头交接计量器 · 等待模拟器 · 机密闸 · 派单状态机
import { PANEL_TYPES, MCP, DISPATCH } from './content.js';

export const $ = (s, r = document) => r.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 无痕模式等，忽略 */ } },
};

// ---------- 场景 JSON 构建器 + 网格坐标演示（场景配置与面板章） ----------
export const builder = {
  t: '动手：场景 JSON 构建器 · 网格坐标演示',
  html: () => `<p style="font-size:14px">按仓库的规则实时校验：文件名 = id、type 必须已注册（24 种）、坐标越界、面板重叠、AI 面板三字段。改 <code>cols</code> 看比例怎么变。</p>
  <div class="form">
    <div class="grid g3">
      <label>场景 id（= 文件名）<input id="sj-id" value="self-review"></label>
      <label>场景名<input id="sj-name" value="自我复盘"></label>
      <label>cols（列数，默认 4）<input id="sj-cols" type="number" min="1" max="24" value="4"></label>
    </div>
    <div id="sj-panels"></div>
    <div class="row"><button class="btn sm" id="sj-add" type="button">＋ 加面板</button><button class="btn sm" id="sj-copy" type="button">复制 JSON</button></div>
    <div class="minigrid" id="sj-grid" aria-label="网格预览"></div>
    <div class="lint" id="sj-lint"></div>
    <pre class="term" id="sj-out" style="max-height:300px"></pre>
  </div>`,
  init(el) {
    let panels = [
      { title: '预览', type: 'review-doc', col: 1, row: 1, w: 3, h: 3 },
      { title: '库', type: 'review-files', col: 4, row: 1, w: 1, h: 3 },
      { title: 'AI·自我复盘', type: 'harness', col: 1, row: 4, w: 4, h: 2 },
    ];
    const wrap = $('#sj-panels', el);
    const fams = [...new Set(PANEL_TYPES.map((t) => t.fam))];
    const opts = (v) => fams.map((f) => `<optgroup label="${f}">${PANEL_TYPES.filter((t) => t.fam === f).map((t) => `<option value="${t.v}" ${t.v === v ? 'selected' : ''}>${t.v} · ${t.d}</option>`).join('')}</optgroup>`).join('');
    const num = (k, v, i) => `<label>${k}<input type="number" min="1" max="24" data-i="${i}" data-k="${k}" value="${v}"></label>`;
    const cols = () => Math.max(1, Number($('#sj-cols', el).value) || 4);

    function drawRows() {
      wrap.innerHTML = panels.map((p, i) => `<div class="prow">
        <label>标题<input data-i="${i}" data-k="title" value="${esc(p.title)}"></label>
        <label>type<select data-i="${i}" data-k="type">${opts(p.type)}</select></label>
        ${num('col', p.col, i)}${num('row', p.row, i)}${num('w', p.w, i)}${num('h', p.h, i)}
        <button class="x" type="button" data-del="${i}" aria-label="删除面板">×</button></div>`).join('');
    }
    function update() {
      const id = $('#sj-id', el).value.trim(), name = $('#sj-name', el).value.trim(), C = cols();
      const out = {
        id, name, cols: C,
        panels: panels.map((p, i) => {
          const o = { id: `${id || 'scene'}-p${i + 1}`, title: p.title, type: p.type };
          if (p.type === 'harness') Object.assign(o, { sessionTitle: name, sessionId: 'session-00000000-0000-0000-0000-000000000000', pinTarget: [name] });
          return Object.assign(o, { col: p.col, row: p.row, w: p.w, h: p.h });
        }),
      };
      $('#sj-out', el).textContent = `// 文件名：scenarios/${id || '<id>'}.json\n` + JSON.stringify(out, null, 2);

      // 校验（依据 01-场景模式 / 02-会话绑定三字段）
      const L = [];
      if (!/^[a-z0-9-]+$/.test(id)) L.push(['e', '场景 id 建议只用小写字母 / 数字 / 连字符；文件名必须 = id，否则「场景不存在」']);
      const cells = new Map();
      let rows = 0, need = C;
      panels.forEach((p) => {
        const t = PANEL_TYPES.find((x) => x.v === p.type);
        if (t?.unknown) L.push(['e', `面板「${p.title}」type 未注册 → 面板里只显示一行灰字「未知面板类型: ${p.type}」，不报错、不崩`]);
        if (p.col + p.w - 1 > C) { need = Math.max(need, p.col + p.w - 1); L.push(['e', `面板「${p.title}」越界：col + w - 1 = ${p.col + p.w - 1} > cols ${C} → 网格长出「隐式列」，比例整个乱掉（宿主会打印告警）`]); }
        for (let c = p.col; c < p.col + p.w; c++) for (let r = p.row; r < p.row + p.h; r++) {
          const k = c + ',' + r;
          if (cells.has(k)) L.push(['e', `面板「${p.title}」与「${cells.get(k)}」在 (${c},${r}) 重叠`]);
          else cells.set(k, p.title);
        }
        rows = Math.max(rows, p.row + p.h - 1);
      });
      const ai = panels.filter((p) => p.type === 'harness');
      if (!ai.length) L.push(['w', '没有 harness 面板：这个场景没有常驻 AI，只是个壳（每个场景至少一块）']);
      else L.push(['w', 'sessionId 仍是占位 session-0000… —— 必须换成你引擎里真实存在的会话 id，否则面板不钉会话（且不报错）']);
      if (ai.length > 1) L.push(['w', `${ai.length} 块 AI 面板：两条会话名字必须不同、pinTarget 首项不能相同，且一板一分区，否则串台`]);
      if (!L.some((x) => x[0] === 'e')) L.push(['g', '结构校验通过（判据仍以画面为准：切过去看到的是不是那一条会话）']);
      $('#sj-lint', el).innerHTML = [...new Map(L.map((x) => [x[1], x])).values()].map(([c, m]) => `<div class="${c}">${esc(m)}</div>`).join('');

      // 网格预览：越界时按实际需要的列数画，并标红
      const g = $('#sj-grid', el);
      g.style.gridTemplateColumns = `repeat(${need}, minmax(0, 1fr))`;
      g.style.gridTemplateRows = `repeat(${Math.max(rows, 1)}, 22px)`;
      g.innerHTML = panels.map((p) => {
        const t = PANEL_TYPES.find((x) => x.v === p.type);
        const out = p.col + p.w - 1 > C;
        return `<div class="${p.type === 'harness' ? 'ai' : ''} ${t?.unknown || out ? 'bad' : ''}" style="grid-column:${p.col} / span ${p.w};grid-row:${p.row} / span ${p.h}">${esc(p.title)}</div>`;
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
      panels.push({ title: '新面板', type: 'reserved', col: 1, row, w: 2, h: 1 }); drawRows(); update();
    });
    $('#sj-copy', el).addEventListener('click', async (e) => {
      const txt = $('#sj-out', el).textContent.split('\n').slice(1).join('\n');
      try { await navigator.clipboard.writeText(txt); e.target.textContent = '已复制 ✓'; } catch { e.target.textContent = '复制失败，请手动选中'; }
      setTimeout(() => (e.target.textContent = '复制 JSON'), 1600);
    });
    ['#sj-id', '#sj-name', '#sj-cols'].forEach((s) => $(s, el).addEventListener('input', update));
    drawRows(); update();
  },
};

// ---------- 开头交接计量器（记忆章） ----------
export const handoff = {
  t: '动手：开头交接计量器（≤ 4 KB，原文记作 §〇）',
  html: () => `<div class="form"><textarea id="ho" spellcheck="false" aria-label="开头交接草稿"></textarea></div>
  <div class="kb"><span id="ho-kb">0 B</span><i><b id="ho-bar" style="width:0"></b></i><span>4096 B</span></div>
  <div class="lint" id="ho-lint"></div>`,
  init(el) {
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
  },
};

// ---------- 等待模拟器（接手 · MCP 章） ----------
export const waitSim = {
  t: '动手：等待要分两步 —— 先等「出现」，再等「不再变」',
  html: () => `<div class="sim">
    <div class="sim-page"><span class="sim-lbl">网页版 AI 正在输出</span><div id="sim-stream"></div></div>
    <div class="sim-cap"><span class="sim-lbl">工具取回的文本</span><div id="sim-got">—</div></div>
  </div>
  <div class="row" style="margin-top:10px">
    <button class="btn sm" type="button" data-sim="appear">▶ 只等「出现」</button>
    <button class="btn sm" type="button" data-sim="stable">▶ 等「稳定」stableMs=1200</button>
  </div>
  <div class="lint" id="sim-lint"></div>`,
  init(el) {
    const stream = $('#sim-stream', el), got = $('#sim-got', el), lint = $('#sim-lint', el);
    const full = MCP.answer;
    let timer = null;
    const run = (mode) => {
      clearInterval(timer);
      stream.textContent = ''; got.textContent = '…等待中'; lint.innerHTML = '';
      let n = 0, firstAt = null, lastChange = 0, pauseUntil = null;
      const t0 = performance.now();
      timer = setInterval(() => {
        const now = performance.now() - t0;
        if (n >= 32 && pauseUntil === null) pauseUntil = now + 800; // 停顿 800ms < stableMs
        const pause = pauseUntil !== null && now < pauseUntil && n < 34;
        if (n < full.length && !pause) { n += 2; stream.textContent = full.slice(0, n); lastChange = now; if (firstAt === null) firstAt = now; }
        if (mode === 'appear' && firstAt !== null && now - firstAt > 600) {
          clearInterval(timer); got.textContent = stream.textContent;
          lint.innerHTML = `<div class="e">取到 ${stream.textContent.length}/${full.length} 字 —— 半句话。只等「出现」是最常见的实现错误</div>`;
        }
        if (mode === 'stable' && firstAt !== null && now - lastChange > 1200) {
          clearInterval(timer); got.textContent = stream.textContent;
          lint.innerHTML = `<div class="${got.textContent.length === full.length ? 'g' : 'e'}">文本 1200ms 内不再变化 → 判定说完，取到 ${got.textContent.length}/${full.length} 字</div>
            <div class="w">中途停顿没被误判：停顿 < stableMs。另外必须设 hardTimeoutMs，否则卡住时会无限等</div>`;
        }
      }, 60);
    };
    el.querySelectorAll('[data-sim]').forEach((b) => b.addEventListener('click', () => run(b.dataset.sim)));
  },
};

// ---------- 机密闸（接手 · MCP 章） ----------
export const gate = {
  t: '动手：机密闸 —— 写进代码，不只写在文档',
  html: () => `<p style="font-size:14px">这些都是站外服务。正文含 密码 / token / 密钥 / 身份证 / 银行卡 / 手机号 ⇒ 调用前就拒发（<code>--force</code> 也不放行）。试试：</p>
  <div class="form"><input id="gate-in" value="帮我总结一下场景记忆的开头交接该写什么" aria-label="要发给网页版 AI 的内容"></div>
  <div class="lint" id="gate-out"></div>`,
  init(el) {
    const gin = $('#gate-in', el), gout = $('#gate-out', el);
    const run = () => {
      const hit = MCP.secrets.filter(([, re]) => re.test(gin.value)).map(([k]) => k);
      gout.innerHTML = hit.length
        ? `<div class="e">拒发：命中「${hit.join('、')}」—— 站外服务一律不发</div>`
        : '<div class="g">放行：未命中机密关键词（IPv4 / 邮箱 / 账号只警告；客户名单、他人隐私仍要自己判断）</div>';
    };
    gin.addEventListener('input', run); run();
  },
};

// ---------- 派单状态机（派单与回执章） ----------
const FSM_POS = { s1: [20, 20], s2: [220, 20], s3: [420, 20], s4: [420, 140], s5: [220, 140], s6: [420, 250] };
export const fsm = {
  t: '动手：派单状态机 —— 点按钮模拟一条活（背景圆环同步点亮）',
  html: () => {
    const node = (s) => { const [x, y] = FSM_POS[s.id]; return `<g class="node ${s.id === 's5' ? 'bad' : ''}" id="fsm-${s.id}">
      <rect x="${x}" y="${y}" width="170" height="62" rx="2"/>
      <text x="${x + 12}" y="${y + 26}">${s.t}</text><text class="sub" x="${x + 12}" y="${y + 46}">${s.d.slice(0, 15)}</text></g>`; };
    const E = [['e12', 'M190 51 H220'], ['e23', 'M390 51 H420'], ['e34', 'M505 82 V140'], ['e35', 'M470 82 L340 140', 'bad'], ['e46', 'M505 202 V250']];
    return `<svg class="fsm" viewBox="0 0 600 320" role="img" aria-label="派单状态机">
      ${E.map(([id, d, c]) => `<path id="fsm-${id}" class="edge ${c || ''}" d="${d}"/>`).join('')}
      ${DISPATCH.states.map(node).join('')}
      <circle class="pkt" id="fsm-pkt" r="6" cx="105" cy="51" opacity="0"/>
    </svg>
    <div class="row"><button class="btn sm" type="button" data-run="ok">▶ 对方带证据回执</button><button class="btn sm" type="button" data-run="timeout">▶ 超时没回</button></div>
    <div class="fsm-log" id="fsm-log">› 等待派单…</div>`;
  },
  init(el, scene) {
    const log = $('#fsm-log', el), pkt = $('#fsm-pkt', el), svgEl = $('.fsm', el);
    let busy = false;
    const center = (id) => { const [x, y] = FSM_POS[id]; return [x + 85, y + 31]; };
    const mark = (id) => svgEl.querySelector('#fsm-' + id)?.classList.add('on');
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    async function run(kind) {
      if (busy) return; busy = true;
      svgEl.querySelectorAll('.on').forEach((n) => n.classList.remove('on'));
      const path = kind === 'ok'
        ? [['s1', '想出派单：要对方动手 → 派单'], ['e12'], ['s2', '投递：真唤醒，写清四件套'], ['e23'], ['s3', '已投递：等回执…'], ['e34'], ['s4', '回执：结论 + 证据 + 落盘路径'], ['e46'], ['s6', '收尾知悉 1 条 →【结束】，销账']]
        : [['s1', '想出派单：要对方动手 → 派单'], ['e12'], ['s2', '投递：真唤醒'], ['e23'], ['s3', '已投递：等回执…'], ['e35'], ['s5', '⛔ 超时未回执 → 进「我发出没回」清单，该催了']];
      pkt.setAttribute('opacity', '1');
      for (const [id, msg] of path) {
        mark(id);
        if (id.startsWith('s')) {
          const [cx, cy] = center(id); pkt.setAttribute('cx', cx); pkt.setAttribute('cy', cy);
          log.textContent = '› ' + msg; scene.highlight(Number(id.slice(1)) - 1);
        }
        await wait(id.startsWith('e') ? 260 : 700);
      }
      pkt.setAttribute('opacity', '0'); scene.highlight(-1); busy = false;
    }
    el.querySelectorAll('[data-run]').forEach((b) => b.addEventListener('click', () => run(b.dataset.run)));
  },
};
