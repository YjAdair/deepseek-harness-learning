// 章节模板 chapter() + 「看懂 / 机制」两部分的渲染与交互
import {
  CHAPTERS, PARTS, HEADS, MCP, META, BOOT_LINES, WALLS, PILLARS, LAYERS, CORE, IDENTITY_STEPS, BIND_FIELDS,
  IDENTITY_LAWS, DISPATCH, TOPICS, ARCH, PLAIN, CASES, GLOSSARY, STORY,
} from './content.js';
import { $, esc, builderHTML, handoffHTML, initSceneBuilder, initHandoff } from './tools.js';

export { $, esc };
const chOf = (id) => CHAPTERS.find((c) => c.id === id);
const partOf = (id) => PARTS.find((p) => p.id === chOf(id)?.part);

// ---------- 小工具 ----------
export const mmss = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
export const vlink = (t) => `${META.video}?t=${Math.floor(t)}`;
const srcHTML = (src) => src.map((x) => x.video != null
  ? `<a href="${vlink(x.video)}" target="_blank" rel="noopener">▶ 视频 ${mmss(x.video)}</a>`
  : `<a href="${x.href}" target="_blank" rel="noopener">⌥ ${esc(x.label)}</a>`).join(' · ');
const zoomImg = (src, alt, cls = '') => `<button class="fig-btn ${cls}" type="button" data-zoom="${src}" aria-label="放大查看"><img src="${src}" alt="${esc(alt)}" loading="lazy" /></button>`;
const panel = (tag, html, attrs = '') => `<div class="panel"${attrs}><div class="panel-tag">${tag}</div>${html}</div>`;
// 原作者配图（MIT）
export function figHTML(id) {
  const f = PLAIN[id]?.fig;
  if (!f) return '';
  return `<figure class="fig">${zoomImg(f.src, f.cap)}
    <figcaption>${esc(f.cap)} <a href="${META.repo}" target="_blank" rel="noopener">出处 · MIT</a></figcaption></figure>`;
}

// 作者的视频经历：问题 → 做法 → 结果 + 画面
function storyBody(x) {
  return `<div class="story-body">
      <ol class="story-steps">
        <li><b>遇到的问题</b><p>${esc(x.problem)}</p></li>
        <li><b>作者怎么做</b><p>${esc(x.did)}</p></li>
        <li><b>结果 / 定下的规矩</b><p>${esc(x.result)}</p>${x.q ? `<q>${esc(x.q)}</q>` : ''}</li>
      </ol>
      <div class="story-media">${x.imgs.map((src, i) => zoomImg(src, `${x.title}（视频画面）`, i ? 'sub' : 'main')).join('')}
        <span class="story-cap">画面取自原视频 · 版权归原作者 · ${x.t.map((t) => `<a href="${vlink(t)}" target="_blank" rel="noopener">▶ ${mmss(t)}</a>`).join(' ')}</span></div>
    </div>`;
}
function caseBody(c) {
  return `<dl class="case-dl">
      <dt>出了什么事</dt><dd>${esc(c.what)}${c.q ? `<q>${esc(c.q)}</q>` : ''}</dd>
      <dt>后果</dt><dd>${esc(c.cost)}</dd>
      <dt class="so">所以这样设计</dt><dd class="so">${esc(c.so)}</dd>
    </dl><div class="case-src">出处：${srcHTML(c.src)}</div>`;
}

// ---------- 章节模板：五段 ----------
// mech：直接展示的机制面板；deep：[{t, html}] 收进「深入」折叠
export function chapter(id, { mech = '', deep = [] } = {}) {
  const ch = chOf(id), part = partOf(id), h = HEADS[id] || {}, idx = CHAPTERS.indexOf(ch);
  const main = STORY.find((x) => x.ch === id && x.main);
  const more = [
    ...STORY.filter((x) => x.ch === id && !x.main).map((x) => ({ tag: '视频', title: x.title, body: storyBody(x) })),
    ...CASES.filter((c) => c.ch === id).map((c) => ({ tag: '仓库', title: c.title, date: c.date, body: caseBody(c) })),
  ];
  const prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
  const analogy = PLAIN[id]?.analogy;
  return `
  <header class="stage sec" data-toc="结论">
    <div class="stage-in reveal">
      <div class="ch-part" style="--pc:${part.color}"><span>${part.id === 'p1' ? '一' : part.id === 'p2' ? '二' : '三'} · ${part.name}</span>${ch.code} / ${String(CHAPTERS.length - 1).padStart(2, '0')}</div>
      <h2 class="ch-title glitch">${h.title}</h2>
      ${h.lede ? `<p class="ch-lede">${h.lede}</p>` : ''}
      ${analogy ? `<p class="ch-analogy"><span>类比</span>${esc(analogy)}<i class="tag-mine">本站提炼</i></p>` : ''}
      <div class="stage-hint" aria-hidden="true">↓ 往下读</div>
    </div>
  </header>
  <div class="read">
    ${main ? `<section class="sec story-main reveal" data-toc="作者踩过的坑">
      <h3 class="sec-h">作者踩过的坑</h3>
      <article class="story"><h4>${esc(main.title)}</h4>${storyBody(main)}</article>
    </section>` : ''}
    ${mech || deep.length ? `<section class="sec reveal" data-toc="机制">
      <h3 class="sec-h">机制</h3>
      ${mech}
      ${deep.map((d) => `<details class="deep"><summary><span>深入</span>${d.t}</summary><div class="deep-b">${d.html}</div></details>`).join('')}
    </section>` : ''}
    ${h.judge ? `<section class="sec judge-cards reveal" data-toc="判据">
      <div class="jc ok"><div class="jc-k">判据一句话</div><p>${esc(h.judge)}</p></div>
      <div class="jc bad"><div class="jc-k">不这样会怎样</div><p>${esc(h.fail)}</p></div>
    </section>` : ''}
    ${more.length ? `<section class="sec more reveal" data-toc="更多案例">
      <h3 class="sec-h sm">更多案例 <span>${more.length} 条 · 点开看完整经过</span></h3>
      <div class="more-list">${more.map((m) => `<details class="more-i"><summary><span class="src-tag ${m.tag === '视频' ? 'v' : ''}">${m.tag}</span><span class="more-t">${esc(m.title)}</span>${m.date ? `<span class="more-d">${m.date}</span>` : ''}</summary><div class="more-b">${m.body}</div></details>`).join('')}</div>
    </section>` : ''}
    <nav class="pager" aria-label="章节翻页">
      ${prev ? `<a href="#${prev.id}"><span>← 上一章</span><b>${prev.code} ${prev.name}</b></a>` : '<span></span>'}
      ${next ? `<a class="nx" href="#${next.id}"><span>下一章 →</span><b>${next.code} ${next.name}</b></a>` : '<span></span>'}
    </nav>
  </div>`;
}

// 图片放大：全站共用一个 <dialog>
function initZoom() {
  const dlg = document.createElement('dialog');
  dlg.className = 'zoom';
  dlg.innerHTML = '<img alt="" /><button class="btn zoom-x" type="button">关闭 ✕</button>';
  document.body.append(dlg);
  const img = dlg.querySelector('img');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-zoom]');
    if (b) { img.src = b.dataset.zoom; img.alt = b.querySelector('img')?.alt || ''; dlg.showModal(); return; }
    if (dlg.open && (e.target === dlg || e.target.closest('.zoom-x'))) dlg.close();
  });
}

// 悬停元素 → 粒子组高亮
export function bindHighlight(root, sel, scene) {
  root.querySelectorAll(sel).forEach((el) => {
    const g = Number(el.dataset.g);
    const on = () => scene.highlight(g), off = () => scene.highlight(-1);
    el.addEventListener('mouseenter', on); el.addEventListener('focus', on);
    el.addEventListener('mouseleave', off); el.addEventListener('blur', off);
  });
}

// ---------- 全景架构图 ----------
function archSvg() {
  const edge = (e) => {
    const d = e.pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
    let best = 0, mx = 0, my = 0;
    for (let i = 1; i < e.pts.length; i++) {
      const [a, b] = [e.pts[i - 1], e.pts[i]];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len > best) { best = len; mx = (a[0] + b[0]) / 2; my = (a[1] + b[1]) / 2; }
    }
    const vertical = e.pts.length === 2 && e.pts[0][0] === e.pts[1][0];
    return `<path class="arch-e ${e.k}" d="${d}" /><text class="arch-el" x="${vertical ? mx + 8 : mx}" y="${vertical ? my + 4 : my - 6}" text-anchor="${vertical ? 'start' : 'middle'}">${esc(e.t)}</text>`;
  };
  const node = (n) => {
    const ch = chOf(n.ch);
    const ty = n.box ? n.y + 24 : n.y + n.h / 2 - (n.h > 60 ? 6 : 3);
    const title = n.box
      ? `<text class="arch-t" x="${n.x + 14}" y="${ty}">${esc(n.label)}<tspan class="arch-s" dx="10">${esc(n.sub)}</tspan></text>`
      : `<text class="arch-t" x="${n.x + n.w / 2}" y="${ty}" text-anchor="middle">${esc(n.label)}</text>
      <text class="arch-s" x="${n.x + n.w / 2}" y="${ty + 18}" text-anchor="middle">${esc(n.sub)}</text>`;
    return `<g class="arch-n ${n.box ? 'box' : ''} ${n.dashed ? 'dashed' : ''}" style="--c:${n.c}" tabindex="0" role="button" data-id="${n.id}" aria-label="${esc(n.label)}：${esc(n.plain)}">
      <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${n.box ? 10 : 6}" />${title}
      ${ch ? `<text class="arch-c" x="${n.x + n.w - 8}" y="${n.y + 14}" text-anchor="end">→${ch.code}</text>` : ''}</g>`;
  };
  const boxes = ARCH.nodes.filter((n) => n.box), rest = ARCH.nodes.filter((n) => !n.box);
  return `<svg class="arch full" viewBox="0 0 1000 640" role="group" aria-label="DSH 工作台全景架构图">
    ${boxes.map(node).join('')}${ARCH.edges.map(edge).join('')}${rest.map(node).join('')}</svg>`;
}

// ---------- 00 序章：开机 + 全景 + 术语 ----------
function renderIntro(el, scene) {
  el.innerHTML = `
  <header class="stage hero sec" data-toc="开机">
    <div class="stage-in">
      <div class="boot-log" id="bootlog" aria-label="开机日志"></div>
      <h1 class="hero-title"><small>DEEPSEEK HARNESS · WORKBENCH</small>养成赛博<br><span class="q">「自己」</span></h1>
      <p class="ch-lede" style="font-size:17px">把「一个聊天窗口」变成「一间按场景分工的工作室」。<br>三部分读完：<b>看懂</b>为什么这样设计 → <b>机制</b>每块是什么 → <b>动手</b>搭一间自己的。</p>
      <div class="row" style="margin-top:26px">
        <a class="btn solid" href="#arch">先看全景图 ▸</a>
        <a class="btn" href="#build">直接实战</a>
      </div>
      <div class="hero-meta">
        <a href="${META.video}" target="_blank" rel="noopener">▶ B站原视频</a>
        <a href="${META.repo}" target="_blank" rel="noopener">⌥ GitHub 仓库</a>
        <span>作者：${META.author}</span>
      </div>
    </div>
  </header>
  <div class="read wide">
    <section class="sec reveal" id="arch" data-toc="全景图">
      <h3 class="sec-h">一张图装下整个工作台</h3>
      <p class="sec-lede">后面每一章，都是把这张图里的一块拆开讲。悬停任一方块，背景粒子会预演那一章的形态；点击看说明，右上角「→编号」就是对应章节。</p>
      <div class="panel arch-panel">
        <div class="arch-hint">← 左右滑动查看全图 →</div>
        <div class="arch-scroll">${archSvg()}</div>
        <div class="arch-info" id="arch-info" aria-live="polite"></div>
        <div class="arch-legend"><span class="lg main">主轴：规则自上而下</span><span class="lg loop">派单闭环</span><span class="lg soft">承载 / 认领 / 巡检 / 归档</span><span class="lg dash">虚线框：隔离或只读</span></div>
      </div>
      <details class="deep"><summary><span>深入</span>原作者的总纲全景图</summary><div class="deep-b">${figHTML('intro')}</div></details>
    </section>
    <section class="sec reveal" data-toc="术语">
      <h3 class="sec-h">先把这几个词说成人话</h3>
      <div class="panel gloss"><dl>${GLOSSARY.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>
      <p class="judge">每章都按同一个顺序讲：结论 → 作者踩过的坑（原视频片段）→ 机制 → 判据 → 更多案例。</p>
    </section>
    <nav class="pager" aria-label="章节翻页"><span></span><a class="nx" href="#why"><span>开始 →</span><b>01 本质</b></a></nav>
  </div>`;

  // 开机日志
  const log = $('#bootlog', el);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0;
  const tick = () => {
    if (i >= BOOT_LINES.length) { log.insertAdjacentHTML('beforeend', '<span class="cursor"></span>'); return; }
    const s = esc(BOOT_LINES[i++]).replace('[ OK ]', '<span class="ok">[ OK ]</span>').replace('[WARN]', '<span class="wn">[WARN]</span>');
    log.insertAdjacentHTML('beforeend', `<div class="l">${s}</div>`);
    setTimeout(tick, reduced ? 0 : 260);
  };
  tick();

  // 架构图：悬停 → 说明 + 背景预演该章形态；移开 → 回到序章形态
  const info = $('#arch-info', el);
  const show = (id, preview) => {
    const n = ARCH.nodes.find((x) => x.id === id); if (!n) return;
    const ch = chOf(n.ch);
    el.querySelectorAll('.arch-n').forEach((g) => g.classList.toggle('sel', g.dataset.id === id));
    info.innerHTML = `<div class="ai-k" style="color:${n.c}">${esc(n.label)}</div><div class="ai-s">${esc(n.sub)}</div>
      <p>${esc(n.plain)} <span class="tag-mine">本站提炼</span></p>
      ${ch ? `<a class="btn" href="#${ch.id}">去 ${ch.code}「${esc(ch.name)}」细看 ▸</a>` : ''}`;
    if (preview && ch) scene.setFormation(ch.formation);
  };
  const back = () => scene.setFormation(chOf('intro').formation);
  el.querySelectorAll('.arch [data-id]').forEach((g) => {
    g.addEventListener('mouseenter', () => show(g.dataset.id, true));
    g.addEventListener('focus', () => show(g.dataset.id, true));
    g.addEventListener('mouseleave', back); g.addEventListener('blur', back);
    g.addEventListener('click', () => show(g.dataset.id, false));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const ch = chOf(ARCH.nodes.find((x) => x.id === g.dataset.id)?.ch); if (ch) location.hash = ch.id; } });
  });
  show('host', false);
}

// ---------- 01 本质 ----------
function renderWhy(el, scene) {
  el.innerHTML = chapter('why', {
    mech: panel('一个窗口的三堵墙（悬停看背景对应那堵墙）', `<div class="grid g3">
      ${WALLS.map((w, i) => `<div class="cell" tabindex="0" data-g="${i}">
        <span class="n">WALL.${i + 1}</span><div class="k">${w.title}</div>
        <div class="s">${w.sym}</div><div class="s" style="margin-top:6px;color:var(--amber)">↳ ${w.cause}</div></div>`).join('')}</div>`)
      + panel('出路：五块零件，各自可替换', `<div class="grid g3">${PILLARS.map((p) => `<div class="cell"><span class="n">${p.n}</span><div class="k">${p.k}</div><div class="s">${p.d}</div></div>`).join('')}</div>
      <p class="judge" style="margin-top:14px">先有壳，才谈得上绑会话；壳 + 魂跑通再接手。「规矩」不是搭出来的，是事故逼出来的。</p>`),
  });
  bindHighlight(el, '[data-g]', scene);
}

// ---------- 02 六层 ----------
function renderLayers(el, scene) {
  el.innerHTML = chapter('layers', {
    mech: `<div class="panel"><div class="panel-tag">六层 · 东西归谁、谁能写（悬停看背景对应那一环）</div>${LAYERS.map((l, i) => `
      <div class="layer" tabindex="0" data-g="${i}" style="--lc:${l.color}">
        <div class="id">${l.id}</div>
        <div><div class="nm">${l.name}</div><div class="wh">${l.what}</div><div class="who">✎ ${l.who}</div></div>
      </div>`).join('')}</div>`,
    deep: [{ t: '原作者的拓扑总纲图', html: figHTML('layers') }],
  });
  bindHighlight(el, '[data-g]', scene);
}

// ---------- 03 场景 ----------
function renderScene(el, scene) {
  const s = CORE.scene, P = TOPICS.persona;
  el.innerHTML = chapter('scene', {
    mech: panel('场景六件套 · 缺一件会怎样', `<div class="grid g3 kit">${s.kit.map((k) => `<div class="cell"><span class="n">${k.n}</span>
      <div class="k">${k.name} ${k.must ? '<span class="must">不可省</span>' : ''}</div>
      <div class="mono" style="font-size:12px;color:var(--cyan)">${esc(k.file)}</div>
      <div class="s" style="margin-top:4px">缺了：${k.miss}</div></div>`).join('')}</div>
      <p style="font-size:14px;margin-top:12px">判断一个场景成不成立，只看三件：<b>卡（职责）、记忆（进度）、索引（身份）</b>。</p>`),
    deep: [
      { t: `场景即人的一面：${P.title}`, html: `<p><b>${P.one}</b></p>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>字段</th><th>写什么</th></tr></thead><tbody>
        ${P.fields.map(([a, b]) => `<tr><td><b>${a}</b></td><td>${b}</td></tr>`).join('')}</tbody></table></div>
        <p style="margin-top:12px"><b>四条硬边界</b></p><ul class="clean no">${P.bounds.map((x) => `<li>${x}</li>`).join('')}</ul>
        <p class="judge">开场先读自己那一行，决定三件事：回多长、先说啥、别踩什么。</p>` },
      { t: '动手：场景 JSON 构建器（4 列网格）', html: builderHTML() },
      { t: '原作者的「单场景最小闭环」图', html: figHTML('scene') },
    ],
  });
  initSceneBuilder(el);
}

// ---------- 04 记忆 ----------
function renderMemory(el) {
  const m = CORE.memory;
  el.innerHTML = chapter('memory', {
    mech: panel('三层记忆 · 谁会读、多久读一次', `${m.tiers.map((t) => `<div class="tier"><div><b>${t.name}</b> · ${t.what}<div style="font-size:13px;color:var(--dim)">${t.who}</div></div><div class="lim">${t.limit}</div></div>`).join('')}
      <p style="font-size:14px;color:var(--dim);margin-top:10px">${m.cost}</p>`)
      + panel('场景记忆 · 开头交接（原文记作 §〇）', `<p style="font-size:14px">AI 开场「读场景记忆」，第一眼读的就是记忆文件开头这一节。原文给它编了节号 <code>§〇</code>（§ 是节号符，〇 是零：<b>第 0 节</b>）；同一文件后面还有只追加的 <code>§五 长期记忆</code>。</p>
      <div class="grid g2 handoff-vs"><div><div class="panel-tag ok">✓ 原文模板：固定五小节，覆盖写</div><pre class="term"><span class="k">## §〇 当前交接（≤ 4 KB）</span>
<span class="s">### 1) 上次交接</span>    <span class="c">做了什么 / 结果 / 证据</span>
<span class="s">### 2) 当前项目</span>    <span class="c">项目 | 记忆文件 | 状态 | 下一步</span>
<span class="s">### 3) 私有记忆变更</span> <span class="c">日期：改了什么 + 为什么</span>
<span class="s">### 4) 下一步 / 卡点</span> <span class="c">没有卡点就写「无」</span>
<span class="s">### 5) 全貌</span>        <span class="c">工具生成，别手改</span></pre></div>
      <div><div class="panel-tag warn">⛔ 原文点名的反例：写成周报</div><pre class="term bad"><span class="k">## 今日工作</span>
<span class="c">1. 改了首页……（三大段）
2. 排查了登录……（三大段）
3. 讨论了改版……（三大段）
4. ……</span></pre>
      <p style="font-size:13px;color:var(--dim)">结果：一是超出 4 KB，二是新会话读完仍不知道「下一步该干什么」。</p></div></div>
      <ul class="clean" style="margin-top:12px">${m.rules.map((x) => `<li>${x}</li>`).join('')}</ul>`),
    deep: [{ t: '动手：开头交接计量器（≤ 4 KB）', html: handoffHTML() }],
  });
  initHandoff(el);
}

// ---------- 05 协作 ----------
function renderCollab(el) {
  const c = CORE.collab;
  el.innerHTML = chapter('collab', {
    mech: panel('修改权分五档', `${c.perms.map((p) => `<div class="perm"><div class="lv" style="color:${p.bad ? 'var(--red)' : 'var(--green)'}">${p.lv}</div>
      <div><b>${p.name}</b> <span class="mono" style="color:var(--dim)">· ${p.scope}</span><br><span style="font-size:14px">${p.who}</span></div></div>`).join('')}`)
      + panel('什么算依据：规则只认机主', `<div class="grid g2">
      <div><div class="panel-tag ok">✓ 算依据</div><ul class="clean yes">${c.source.ok.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      <div><div class="panel-tag warn">⛔ 不算依据</div><ul class="clean no">${c.source.no.map((x) => `<li>${x}</li>`).join('')}</ul></div>
    </div><p class="judge">${c.source.rule}</p>`),
    deep: [{ t: '唯一对口：一类活只归一个场景', html: `<ul class="clean">${c.owners.map((x) => `<li>${x}</li>`).join('')}</ul>` }],
  });
}

// ---------- 06 认领 ----------
function renderIdentity(el, scene) {
  el.innerHTML = chapter('identity', {
    mech: panel('身份认领 · 四步（悬停看背景对应轨道）', `<div class="steps">${IDENTITY_STEPS.map((s, i) => `<div class="step" tabindex="0" data-g="${i}"><div><b>${s.t}</b><span>${s.d}</span></div></div>`).join('')}</div>`)
      + panel('跟着窗口走 · 会话绑定三字段', `<pre class="term">{
  <span class="k">"type"</span>: <span class="s">"harness"</span>,
  <span class="k">"sessionTitle"</span>: <span class="s">"自我复盘"</span>,      <span class="c">// 人读</span>
  <span class="k">"sessionId"</span>: <span class="s">"session-0000…"</span>,   <span class="c">// 精确 · 必须是你自己真实存在的 id</span>
  <span class="k">"pinTarget"</span>: <span class="s">"自我复盘"</span>          <span class="c">// 兜底</span>
}</pre>
      <div class="grid g3" style="margin-top:12px">${BIND_FIELDS.map((f) => `<div class="cell"><div class="k mono" style="color:var(--cyan)">${f.k}</div><div class="s"><b style="color:var(--text)">${f.role}</b> · ${f.d}</div></div>`).join('')}</div>`),
    deep: [
      { t: '三条硬结论', html: `<ul class="clean">${IDENTITY_LAWS.map((x) => `<li>${x}</li>`).join('')}</ul>` },
      { t: '原作者的真实界面截图', html: figHTML('identity') },
    ],
  });
  bindHighlight(el, '[data-g]', scene);
}

// ---------- 07 派单 ----------
const FSM_POS = { s1: [20, 20], s2: [220, 20], s3: [420, 20], s4: [420, 140], s5: [220, 140], s6: [420, 250] };
function fsmSVG() {
  const node = (s) => { const [x, y] = FSM_POS[s.id]; return `<g class="node ${s.id === 's5' ? 'bad' : ''}" id="fsm-${s.id}">
    <rect x="${x}" y="${y}" width="170" height="62" rx="2"/>
    <text x="${x + 12}" y="${y + 26}">${s.t}</text><text class="sub" x="${x + 12}" y="${y + 46}">${s.d.slice(0, 15)}</text></g>`; };
  const E = [['e12', 'M190 51 H220'], ['e23', 'M390 51 H420'], ['e34', 'M505 82 V140'], ['e35', 'M470 82 L340 140', 'bad'], ['e46', 'M505 202 V250']];
  return `<svg class="fsm" viewBox="0 0 600 320" role="img" aria-label="派单状态机">
    ${E.map(([id, d, c]) => `<path id="fsm-${id}" class="edge ${c || ''}" d="${d}"/>`).join('')}
    ${DISPATCH.states.map(node).join('')}
    <circle class="pkt" id="fsm-pkt" r="6" cx="105" cy="51" opacity="0"/>
  </svg>`;
}
function renderDispatch(el, scene) {
  const D = DISPATCH, G = TOPICS.gpu;
  el.innerHTML = chapter('dispatch', {
    mech: panel('状态机 · 点按钮模拟一条活（背景圆环同步点亮）', `${fsmSVG()}
      <div class="row"><button class="btn sm" data-run="ok">▶ 对方带证据回执</button><button class="btn sm" data-run="timeout">▶ 超时没回</button></div>
      <div class="fsm-log" id="fsm-log">› 等待派单…</div>`)
      + panel('派单正文四件套 · 上限', `<div class="grid g2">${D.kit.map((k, i) => `<div class="cell"><span class="n">0${i + 1}</span><div class="k">${k.k}</div><div class="s">${k.d}</div></div>`).join('')}</div>
      <div class="cmp" style="margin-top:12px"><div class="bad">❌ ${D.bad}</div><div class="good">✅ ${D.good}</div></div>
      <div class="tbl-wrap" style="margin-top:14px"><table class="tbl"><tbody>${D.limits.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table></div>
      <p class="judge">活干完了但对方还不知道 = 没干完。</p>`),
    deep: [
      { t: `派活前先看负载：${G.title}`, html: `<div class="grid g2">
        <div><b class="ok">✓ 只有三类活能上 GPU</b><ul class="clean yes">${G.ok.map(([a, b]) => `<li>${a} <span class="mono" style="color:var(--dim)">· ${b}</span></li>`).join('')}</ul></div>
        <div><b class="warn">⛔ 用不上</b><ul class="clean no">${G.no.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      </div>
      <div class="grid g3" style="margin-top:12px">
        <div class="cell"><div class="k">退 CPU 三约束</div>${G.cpu.map(([a, b]) => `<div class="s">${a}：<span class="mono">${b}</span></div>`).join('')}</div>
        <div class="cell"><div class="k">验收三条（缺一不算）</div>${G.accept.map((x) => `<div class="s">· ${x}</div>`).join('')}</div>
        <div class="cell"><div class="k">负载闸</div>${G.gate.map(([a, b]) => `<div class="s"><span class="mono" style="color:var(--amber)">${a}</span> ${b}</div>`).join('')}</div>
      </div><p class="judge">${G.judge}</p>` },
      { t: '原作者的「决策 — 执行 — 验收 — 档案」图', html: figHTML('dispatch') },
    ],
  });

  const log = $('#fsm-log', el), pkt = $('#fsm-pkt', el);
  const svgEl = $('.fsm', el);
  let busy = false;
  const center = (id) => { const [x, y] = FSM_POS[id]; return [x + 85, y + 31]; };
  const mark = (id, on = true) => svgEl.querySelector('#fsm-' + id)?.classList.toggle('on', on);
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
}

// ---------- 08 接手：MCP 接免费 AI ----------
function renderMcp(el, scene) {
  const M = MCP;
  el.innerHTML = chapter('mcp', {
    mech: panel('四层 · 缺一不可（悬停看背景对应节点）', `<div class="pipe">${M.layers.map((l, i) => `<div class="pipe-n" tabindex="0" data-g="${i}"><b>${l.k}</b><span>${l.d}</span><em>${l.key}</em></div>`).join('<div class="pipe-a" aria-hidden="true">⇄</div>')}</div>`)
      + panel('「零成本」的真实账单', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>你花的是</th><th>不是</th></tr></thead><tbody>
        ${M.pay.map(([a, b]) => `<tr><td class="ok">${a}</td><td style="color:var(--dim)">${b}</td></tr>`).join('')}</tbody></table></div>
      <div class="grid g2" style="margin-top:12px">${M.cost.map(([a, b]) => `<div class="cell"><div class="k warn">${a}</div><div class="s">${b}</div></div>`).join('')}</div>`),
    deep: [
      { t: '模拟器：等待要分两步 —— 先等「出现」，再等「不再变」', html: `<div class="sim">
        <div class="sim-page"><span class="sim-lbl">网页版 AI 正在输出</span><div id="sim-stream"></div></div>
        <div class="sim-cap"><span class="sim-lbl">工具取回的文本</span><div id="sim-got">—</div></div>
      </div>
      <div class="row" style="margin-top:10px">
        <button class="btn sm" data-sim="appear">▶ 只等「出现」</button>
        <button class="btn sm" data-sim="stable">▶ 等「稳定」stableMs=1200</button>
      </div>
      <div class="lint" id="sim-lint"></div>` },
      { t: '机密闸：写进代码，不只写在文档', html: `<p style="font-size:14px">这些都是站外服务。正文含 密码 / token / 密钥 / 身份证 / 银行卡 / 手机号 ⇒ 调用前就拒发。试试：</p>
      <div class="form"><input id="gate-in" value="帮我总结一下场景记忆的开头交接该写什么" aria-label="要发给网页版 AI 的内容"></div>
      <div class="lint" id="gate-out"></div>` },
      { t: '四个设计决定（值得抄）', html: `<div class="grid g2">${M.decisions.map((d, i) => `<div class="cell"><span class="n">0${i + 1}</span><div class="k">${d.t}</div><div class="s">${d.d}</div></div>`).join('')}</div>
<pre class="term" style="margin-top:12px"><span class="c">// 站点差异只在这一个对象里；流程代码所有站共用</span>
<span class="k">export const</span> site = {
  id: <span class="s">'my-site'</span>, url: <span class="s">'https://example.com/'</span>,
  loggedIn: <span class="k">async</span> (page) => !!(<span class="k">await</span> page.$(<span class="s">'textarea'</span>)), <span class="c">// 只有登录后才有</span>
  inputSel: <span class="s">'textarea'</span>, answerSel: <span class="s">'[data-answer]'</span>,
  send: <span class="k">async</span> (page) => page.keyboard.press(<span class="s">'Enter'</span>),
  wait: { firstTokenMs: 20000, stableMs: 1200, hardTimeoutMs: 180000 },
  profileDir: <span class="s">'&lt;你的 profile 目录&gt;'</span>,
};</pre>` },
      { t: '加一个站 · 五步（十几分钟的活）', html: `<div class="steps">${M.addSteps.map(([t, d]) => `<div class="step"><div><b>${t}</b><span>${esc(d)}</span></div></div>`).join('')}</div>
      <div class="grid g2" style="margin-top:8px">
        <div><b class="ok">便宜 · 加站不用碰</b><ul class="clean yes">${M.cheap.map((x) => `<li>${x}</li>`).join('')}</ul></div>
        <div><b class="warn">贵 · 每个站都得重做</b><ul class="clean no">${M.dear.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      </div>
      <p class="judge">加站的成本不在代码，在维护选择器与登录态。别一次加 10 个站，只加你每周真会用的 2~3 个。</p>` },
      { t: '站点分工（作者本机实测偏好，不是绝对结论）', html: `<div class="tbl-wrap"><table class="tbl"><tbody>${M.sites.map(([a, b]) => `<tr><td><b>${a}</b></td><td>${b}</td></tr>`).join('')}</tbody></table></div>
      <p style="font-size:14px;color:var(--dim);margin-top:8px">用法：同一个问题问 2 个站，比一比 —— 不花 token 的「第二意见」。</p>` },
      { t: '排障：大部分故障不报错，按症状查', html: `<div class="grid g2">
        <div><b>排查顺序（别跳）</b><ul class="clean">${M.order.map((x, i) => `<li><span class="mono" style="color:var(--cyan)">${i + 1}</span> ${x}</li>`).join('')}</ul>
          <p style="font-size:13.5px;color:var(--amber)">① 或 ② 不成立，后面全是白调。</p></div>
        <div><b>两个「看起来正常」的陷阱</b>${M.traps.map(([a, b]) => `<div class="cell" style="margin-top:8px"><div class="k warn">${a}</div><div class="s">${b}</div></div>`).join('')}</div>
      </div>` },
      { t: '原作者的四层架构图', html: figHTML('mcp') },
    ],
  });
  bindHighlight(el, '[data-g]', scene);

  // 等待两步模拟器：只等出现 → 半句；等稳定 → 完整
  const stream = $('#sim-stream', el), got = $('#sim-got', el), lint = $('#sim-lint', el);
  const full = M.answer;
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

  // 机密闸
  const gin = $('#gate-in', el), gout = $('#gate-out', el);
  const gate = () => {
    const hit = M.secrets.filter(([, re]) => re.test(gin.value)).map(([k]) => k);
    gout.innerHTML = hit.length
      ? `<div class="e">拒发：命中「${hit.join('、')}」—— 站外服务一律不发</div>`
      : '<div class="g">放行：未命中机密关键词（仍要自己判断客户名单、他人隐私等）</div>';
  };
  gin.addEventListener('input', gate); gate();
}

export function renderTheory(scene) {
  initZoom();
  renderIntro($('#intro'), scene);
  renderWhy($('#why'), scene);
  renderLayers($('#layers'), scene);
  renderScene($('#scene'), scene);
  renderMemory($('#memory'));
  renderCollab($('#collab'));
  renderIdentity($('#identity'), scene);
  renderDispatch($('#dispatch'), scene);
  renderMcp($('#mcp'), scene);
}
