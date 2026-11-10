// 实战部分（07–10 章 + 页脚）：机制化、上手清单、构建器、踩坑、测验
import {
  META, RULE2MECH, BUILD_STEPS, BUILD_WARN, QUICKSTART, PANEL_TYPES, NO_SURPRISE,
  INCIDENTS, INCIDENTS_COMMON, PITFALLS, QUIZ, MY_TAKEAWAYS, CASES, CHAPTERS,
} from './content.js';
import { $, esc, head, bindHighlight } from './ui.js';

// 事故时间线：所有带日期的案例按日期排
function timeline() {
  const list = CASES.filter((c) => c.date).sort((a, b) => a.date.localeCompare(b.date));
  if (!list.length) return '';
  return `<div class="panel reveal"><div class="panel-tag">事故时间线 · 规矩是被事故一条条逼出来的</div>
    <ol class="tl">${list.map((c) => { const ch = CHAPTERS.find((x) => x.id === c.ch);
      return `<li><span class="tl-d">${c.date}</span><div><b>${esc(c.title)}</b><div class="tl-so">→ ${esc(c.so)}</div>${ch && ch.id !== 'pitfalls' ? `<a href="#${ch.id}">在 CH.${ch.code}「${esc(ch.name)}」细看 ▸</a>` : ''}</div></li>`; }).join('')}</ol></div>`;
}

const KEY_PROGRESS = 'dsh.progress.v1';
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 无痕模式等，忽略 */ } },
};

// ---------- 07 规矩 → 机制 ----------
function renderRule2Mech(el, scene) {
  const R = RULE2MECH;
  el.innerHTML = head('rule2mech', '把规矩变成<em>机制</em>', '规矩写在文档里，靠自觉；机制跑在代码里，靠机器。一份只有规矩的系统，三个月后一定退化成「看心情」。') + `
    <div class="panel reveal"><p class="quote-big" style="margin:0">${R.quote.replace('会失败的检查', '<b>会失败的检查</b>')}</p></div>
    <div class="panel reveal"><div class="panel-tag">五步法 · 悬停看晶格逐层点亮</div>
      <div class="steps">${R.steps.map((s, i) => `<div class="step" tabindex="0" data-g="${i}"><div><b>${s.t}</b><span>${esc(s.d)}</span></div></div>`).join('')}</div>
    </div>
    <div class="panel reveal"><div class="panel-tag">规矩 → 机制 对照</div>
      ${R.pairs.map(([a, b]) => `<div class="flip"><span class="from">「${a}」</span><span class="arr">⇒</span><span class="to">${esc(b).replace(/`([^`]+)`/g, '<code>$1</code>')}</span></div>`).join('')}
      <p class="judge">如果一个检查永远通过，它就不是检查，是装饰。</p>
    </div>`;
  bindHighlight(el, '[data-g]', scene);
}

// ---------- 08 实战 ----------
function renderBuild(el, scene) {
  const prog = store.get(KEY_PROGRESS, {});
  el.innerHTML = head('build', '实战：从零<em>到能跑</em>', '每步都写清「看到什么才算过」—— 没验收标准的步骤，等于没做。勾选进度会存在你的浏览器里。') + `
    <div class="panel reveal"><div class="panel-tag">最短路径 · 先看到界面（公开版工作台）</div>
      <pre class="term">${QUICKSTART.map((q, i) => `<span class="c">${i + 1}.</span> ${esc(q)}`).join('\n')}</pre>
      <p style="font-size:13.5px;color:var(--dim);margin-top:10px">只想看外观：仓库里 <code>11-最小可运行壳/index.html</code> 单文件零依赖，双击就能跑。</p>
    </div>
    <div class="panel reveal"><div class="panel-tag">六步上手 · 验收清单</div>
      <div class="prog"><span id="pg-txt">0%</span><i><b id="pg-bar"></b></i></div>
      <div id="bsteps">${BUILD_STEPS.map((s, i) => `
        <details class="bstep" data-g="${i}" ${i === 0 ? 'open' : ''}>
          <summary><span class="no">0${i + 1}</span>${s.t}<span class="cnt"></span></summary>
          <div class="body">${s.checks.map((c, j) => `<label class="chk"><input type="checkbox" data-id="${i}-${j}" ${prog[`${i}-${j}`] ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}</div>
        </details>`).join('')}</div>
      <p class="judge">${BUILD_WARN}</p>
    </div>
    <div class="panel reveal"><div class="panel-tag">工具 1 · 场景 JSON 构建器（4 列网格）</div>
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
      </div>
    </div>
    <div class="panel reveal"><div class="panel-tag">工具 2 · 开头交接计量器（≤ 4 KB，原文记作 §〇）</div>
      <div class="form"><textarea id="ho" spellcheck="false"></textarea></div>
      <div class="kb"><span id="ho-kb">0 B</span><i><b id="ho-bar" style="width:0"></b></i><span>4096 B</span></div>
      <div class="lint" id="ho-lint"></div>
    </div>
    <div class="panel reveal"><div class="panel-tag">「我改了但没变化」九成是这三条</div>
      <ul class="clean">${NO_SURPRISE.map((x) => `<li>${x}</li>`).join('')}</ul>
    </div>`;

  // 清单进度
  const boxes = [...el.querySelectorAll('.chk input')];
  const sync = () => {
    const done = boxes.filter((b) => b.checked).length, pct = Math.round((done / boxes.length) * 100);
    $('#pg-txt', el).textContent = `${pct}% · ${done}/${boxes.length}`;
    $('#pg-bar', el).style.width = pct + '%';
    el.querySelectorAll('.bstep').forEach((d) => {
      const bs = [...d.querySelectorAll('input')], n = bs.filter((b) => b.checked).length;
      d.querySelector('.cnt').textContent = `${n}/${bs.length}`;
      d.classList.toggle('done', n === bs.length);
    });
  };
  boxes.forEach((b) => b.addEventListener('change', () => {
    const p = store.get(KEY_PROGRESS, {}); p[b.dataset.id] = b.checked; store.set(KEY_PROGRESS, p); sync();
  }));
  el.querySelectorAll('.bstep').forEach((d) => d.addEventListener('toggle', () => d.open && scene.highlight(Number(d.dataset.g))));
  sync();

  initSceneBuilder(el);
  initHandoff(el);
}

function initSceneBuilder(el) {
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

function initHandoff(el) {
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

// ---------- 09 踩坑 ----------
function renderPitfalls(el) {
  const cats = ['全部', ...new Set(PITFALLS.map((p) => p.cat))];
  el.innerHTML = head('pitfalls', '看起来成功，<em>其实没生效</em>', '这套工作台不是设计出来的，是用出来的 —— 每条结论背后都有一次真实事故。') + `
    <div class="reveal">${INCIDENTS.map((x, i) => `<div class="panel inc"><div class="panel-tag">INCIDENT.0${i + 1}</div><h3>${x.t}</h3>
      <dl><dt>真因</dt><dd>${esc(x.why)}</dd><dt>抓手</dt><dd>${esc(x.grip)}</dd></dl></div>`).join('')}</div>
    <p class="judge reveal">${INCIDENTS_COMMON}</p>
    ${timeline()}
    <div class="panel reveal" style="margin-top:18px"><div class="panel-tag">踩坑卡 · 点卡片翻面看真因</div>
      <div class="filters">${cats.map((c, i) => `<button class="${i ? '' : 'on'}" data-c="${c}">${c}</button>`).join('')}</div>
      <div class="grid g2" id="pits">${PITFALLS.map((p) => `<div class="pit" data-c="${p.cat}" tabindex="0" role="button" aria-label="${esc(p.sym)}，翻面">
        <div class="pit-in"><div class="pit-f"><span class="cat">#${p.cat}</span><span class="sym">${esc(p.sym)}</span><span class="hint">点击翻面 ↻</span></div>
        <div class="pit-b"><span class="lbl">真因</span><span>${esc(p.cause)}</span><span class="lbl">抓手</span><span class="ok">${esc(p.grip)}</span></div></div></div>`).join('')}</div>
    </div>`;
  el.querySelectorAll('.pit').forEach((p) => {
    const f = () => p.classList.toggle('flipped');
    p.addEventListener('click', f); p.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), f()));
  });
  el.querySelectorAll('.filters button').forEach((b) => b.addEventListener('click', () => {
    el.querySelectorAll('.filters button').forEach((x) => x.classList.toggle('on', x === b));
    el.querySelectorAll('.pit').forEach((p) => { p.style.display = b.dataset.c === '全部' || p.dataset.c === b.dataset.c ? '' : 'none'; });
  }));
}

// ---------- 10 判据测验 ----------
function renderQuiz(el) {
  el.innerHTML = head('quiz', '判据<em>自检</em>', '十一道情境题。这套东西学没学会，看你能不能在具体情境里说出「判据」。') + `
    <div class="panel reveal" id="qz"></div>
    <div class="panel reveal"><div class="panel-tag">本站提炼 · 四句带走</div>
      <div class="grid g2">${MY_TAKEAWAYS.map((t) => `<div class="cell"><div class="k">${t.t}</div><div class="s">${t.d}</div></div>`).join('')}</div>
      <p class="judge mine">以上四句是本站对仓库内容的归纳，不是原作者原话。</p>
    </div>`;
  const box = $('#qz', el);
  let i = 0, score = 0;
  const show = () => {
    if (i >= QUIZ.length) {
      const pct = Math.round((score / QUIZ.length) * 100);
      box.innerHTML = `<div class="panel-tag">结果</div><div class="qz-score">${score}/${QUIZ.length}</div>
        <p style="margin-top:10px">${pct === 100 ? '身份认领完成：你已经能用判据说话了。' : pct >= 60 ? '大部分判据到位，回看答错题对应的章节。' : '建议从「三机制」与「派单」两章重读。'}</p>
        <button class="btn sm" id="qz-re">重来</button>`;
      $('#qz-re', box).addEventListener('click', () => { i = 0; score = 0; show(); });
      return;
    }
    const q = QUIZ[i];
    box.innerHTML = `<div class="panel-tag">Q.${String(i + 1).padStart(2, '0')} / ${QUIZ.length} · 得分 ${score}</div>
      <div class="qz-q">${q.q}</div>
      ${q.opts.map((o, j) => `<button class="qz-opt" data-j="${j}">${String.fromCharCode(65 + j)}. ${o}</button>`).join('')}
      <div class="qz-why" id="qz-why"></div>`;
    box.querySelectorAll('.qz-opt').forEach((b) => b.addEventListener('click', () => {
      const j = Number(b.dataset.j);
      box.querySelectorAll('.qz-opt').forEach((x, k) => { x.disabled = true; if (k === q.a) x.classList.add('right'); });
      if (j === q.a) score++; else b.classList.add('wrong');
      $('#qz-why', box).textContent = '判据 ▸ ' + q.why;
      box.insertAdjacentHTML('beforeend', `<button class="btn sm solid" id="qz-next">${i + 1 < QUIZ.length ? '下一题 ▸' : '看结果'}</button>`);
      $('#qz-next', box).addEventListener('click', () => { i++; show(); });
    }));
  };
  show();
}

function renderFoot(el) {
  el.innerHTML = `
    <h4>SOURCES</h4>
    <p>内容整理自 <a href="${META.repo}" target="_blank" rel="noopener">mashanglinyu/luanyujia-workbench</a>（MIT）与 B 站视频 <a href="${META.video}" target="_blank" rel="noopener">《DSH搭AI工作台，养成赛博“自己”！》</a>。
    视频无公开字幕，本站以仓库文档为准；标注「本站提炼」的部分为归纳，非原文。</p>
    <p>作者：${META.author} · 个人站 <a href="${META.site}" target="_blank" rel="noopener">linyujia.me</a> · DSH 改造集市 <a href="${META.market}" target="_blank" rel="noopener">mydsh.xyz</a></p>
    <p class="mono" style="font-size:12px">⚠ 原仓库提醒：这不是「装完就能用」的软件。路径与会话 id 全是占位符，照抄一定失败。</p>`;
}

export function renderPractice(scene) {
  renderRule2Mech($('#rule2mech'), scene);
  renderBuild($('#build'), scene);
  renderPitfalls($('#pitfalls'));
  renderQuiz($('#quiz'));
  renderFoot($('#foot'));
}
