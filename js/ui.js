// 章节模板 chapter() + 序章全景图 + 统一渲染循环
import {
  CHAPTERS, PARTS, HEADS, META, BOOT_LINES, ARCH, PLAIN, CASES, GLOSSARY, STORY, CARDS,
} from './content.js';
import { $, esc, builder, handoff, waitSim, gate, fsm } from './tools.js';
import { checklist, timeline, pitfallTable, quiz, renderFoot } from './ui-practice.js';
import { cards, bindCardIndex } from './cards.js';

export { $, esc };
const chOf = (id) => CHAPTERS.find((c) => c.id === id);
const partOf = (id) => PARTS.find((p) => p.id === chOf(id)?.part);
const PART_NO = { p1: '一', p2: '二', p3: '三', p4: '四', p5: '五', p6: '六' };

// 每章的交互工具（数据驱动的知识卡之外，需要代码的部分）
const TOOLS = {
  memory: [handoff], dispatch: [fsm], panels: [builder], mcp: [waitSim, gate],
  build: [checklist], pitfalls: [timeline, pitfallTable], quiz: [quiz],
};

// ---------- 小工具 ----------
export const mmss = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
export const vlink = (t) => `${META.video}?t=${Math.floor(t)}`;
const srcHTML = (src) => src.map((x) => x.video != null
  ? `<a href="${vlink(x.video)}" target="_blank" rel="noopener">▶ 视频 ${mmss(x.video)}</a>`
  : `<a href="${x.href}" target="_blank" rel="noopener">⌥ ${esc(x.label)}</a>`).join(' · ');
const zoomImg = (src, alt, cls = '') => `<button class="fig-btn ${cls}" type="button" data-zoom="${src}" aria-label="放大查看"><img src="${src}" alt="${esc(alt)}" loading="lazy" /></button>`;
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

// ---------- 章节模板：舞台 + 五段 ----------
export function chapter(id) {
  const ch = chOf(id), part = partOf(id), h = HEADS[id] || {}, idx = CHAPTERS.indexOf(ch);
  const main = STORY.find((x) => x.ch === id && x.main);
  const kc = CARDS[id] || [];
  const tools = TOOLS[id] || [];
  const more = [
    ...STORY.filter((x) => x.ch === id && !x.main).map((x) => ({ tag: '视频', title: x.title, body: storyBody(x) })),
    ...CASES.filter((c) => c.ch === id).map((c) => ({ tag: '仓库', title: c.title, date: c.date, body: caseBody(c) })),
  ];
  const prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
  const analogy = PLAIN[id]?.analogy;
  const last = String(CHAPTERS.length - 1).padStart(2, '0');
  return `
  <header class="stage sec" data-toc="结论">
    <div class="stage-in reveal">
      <div class="ch-part" style="--pc:${part.color}"><span>${PART_NO[part.id]} · ${part.name}</span>${ch.code} / ${last}</div>
      <h2 class="ch-title glitch">${h.title}</h2>
      ${h.lede ? `<p class="ch-lede">${h.lede}</p>` : ''}
      ${analogy ? `<p class="ch-analogy"><span>类比</span>${esc(analogy)}<i class="tag-mine">本站提炼</i></p>` : ''}
      ${kc.length ? `<div class="stage-meta mono">${kc.length} 张知识卡${tools.length ? ` · ${tools.length} 个交互` : ''}${main ? ' · 1 段视频经历' : ''}</div>` : ''}
      <div class="stage-hint" aria-hidden="true">↓ 往下读</div>
    </div>
  </header>
  <div class="read">
    ${main ? `<section class="sec story-main reveal" data-toc="作者踩过的坑">
      <h3 class="sec-h">作者踩过的坑</h3>
      <article class="story"><h4>${esc(main.title)}</h4>${storyBody(main)}</article>
    </section>` : ''}
    ${kc.length || tools.length ? `<section class="sec reveal" data-toc="${id === 'quiz' ? '测验' : '机制'}">
      ${id === 'quiz' ? '' : `<h3 class="sec-h">机制 <span>逐条对应仓库原文，点卡头展开</span></h3>`}
      ${cards(kc)}
      ${tools.map((t) => `<div class="panel tool"><div class="panel-tag">${t.t}</div>${t.html()}</div>`).join('')}
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

// ---------- 00 序章：开机 + 全景 + 新手必读 + 术语 + 路线 ----------
function renderIntro(el, scene) {
  const kc = CARDS.intro || [];
  el.innerHTML = `
  <header class="stage hero sec" data-toc="开机">
    <div class="stage-in">
      <div class="boot-log" id="bootlog" aria-label="开机日志"></div>
      <h1 class="hero-title"><small>DEEPSEEK HARNESS · WORKBENCH</small>养成赛博<br><span class="q">「自己」</span></h1>
      <p class="ch-lede" style="font-size:17px">把「一个聊天窗口」变成「一间按场景分工的工作室」。<br>按作者仓库的 13 个模块逐篇整理成六部分 21 章：<b>看懂 → 核心机制 → 构建 → 动手 → 规矩 → 视野</b>。</p>
      <div class="row" style="margin-top:26px">
        <a class="btn solid" href="#arch">先看全景图 ▸</a>
        <a class="btn" href="#build">直接上手</a>
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
    ${kc.length ? `<section class="sec reveal" data-toc="动手前先读">
      <h3 class="sec-h">动手前先读 <span>新手必读 · 仓库导航 · 阅读路线</span></h3>
      ${cards(kc, 1)}
    </section>` : ''}
    <section class="sec reveal" data-toc="术语">
      <h3 class="sec-h">先把这几个词说成人话</h3>
      <div class="panel gloss"><dl>${GLOSSARY.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>
      <p class="judge">每章都按同一个顺序讲：结论 → 作者踩过的坑（原视频片段）→ 机制（知识卡，逐条对应仓库原文）→ 判据 → 更多案例。</p>
    </section>
    <nav class="pager" aria-label="章节翻页"><span></span><a class="nx" href="#why"><span>开始 →</span><b>01 本质</b></a></nav>
  </div>`;

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
  bindCardIndex(el);
}

// ---------- 统一渲染循环 ----------
export function renderAll(scene) {
  initZoom();
  CHAPTERS.forEach((c) => {
    const el = document.getElementById(c.id);
    if (!el) return;
    if (c.id === 'intro') { renderIntro(el, scene); return; }
    el.innerHTML = chapter(c.id);
    (TOOLS[c.id] || []).forEach((t) => t.init(el, scene));
    bindCardIndex(el);
    bindHighlight(el, '[data-g]', scene);
  });
  renderFoot($('#foot'));
}
