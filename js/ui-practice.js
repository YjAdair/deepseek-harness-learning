// 「动手」部分：机制化、实战、踩坑、自检 + 页脚
import {
  META, RULE2MECH, BUILD_STEPS, BUILD_WARN, QUICKSTART, NO_SURPRISE,
  INCIDENTS, PITFALLS, QUIZ, MY_TAKEAWAYS, CASES, CHAPTERS,
} from './content.js';
import { $, esc, chapter, bindHighlight, figHTML } from './ui.js';
import { store } from './tools.js';

const KEY_PROGRESS = 'dsh.progress.v1';
const panel = (tag, html) => `<div class="panel"><div class="panel-tag">${tag}</div>${html}</div>`;

// ---------- 09 机制化 ----------
function renderRule2Mech(el, scene) {
  const R = RULE2MECH;
  el.innerHTML = chapter('rule2mech', {
    mech: panel('五步法（悬停看背景晶格逐层点亮）', `<p class="quote-big" style="margin:0 0 14px">${R.quote.replace('会失败的检查', '<b>会失败的检查</b>')}</p>
      <div class="steps">${R.steps.map((s, i) => `<div class="step" tabindex="0" data-g="${i}"><div><b>${s.t}</b><span>${esc(s.d)}</span></div></div>`).join('')}</div>`)
      + panel('规矩 → 机制 对照', R.pairs.map(([a, b]) => `<div class="flip"><span class="from">「${a}」</span><span class="arr">⇒</span><span class="to">${esc(b).replace(/`([^`]+)`/g, '<code>$1</code>')}</span></div>`).join('')),
  });
  bindHighlight(el, '[data-g]', scene);
}

// ---------- 10 实战 ----------
function renderBuild(el, scene) {
  const prog = store.get(KEY_PROGRESS, {});
  el.innerHTML = chapter('build', {
    mech: panel('最短路径 · 先看到界面（公开版工作台）', `<pre class="term">${QUICKSTART.map((q, i) => `<span class="c">${i + 1}.</span> ${esc(q)}`).join('\n')}</pre>
      <p style="font-size:13.5px;color:var(--dim);margin-top:10px">只想看外观：仓库里 <code>11-最小可运行壳/index.html</code> 单文件零依赖，双击就能跑。</p>`)
      + panel('六步上手 · 验收清单（展开一步，背景螺旋对应那一圈会亮）', `<div class="prog"><span id="pg-txt">0%</span><i><b id="pg-bar"></b></i></div>
      <div id="bsteps">${BUILD_STEPS.map((s, i) => `
        <details class="bstep" data-g="${i}" ${i === 0 ? 'open' : ''}>
          <summary><span class="no">0${i + 1}</span>${s.t}<span class="cnt"></span></summary>
          <div class="body">${s.checks.map((c, j) => `<label class="chk"><input type="checkbox" data-id="${i}-${j}" ${prog[`${i}-${j}`] ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}</div>
        </details>`).join('')}</div>
      <p class="judge">${BUILD_WARN}</p>`),
    deep: [
      { t: '「我改了但没变化」九成是这三条', html: `<ul class="clean">${NO_SURPRISE.map((x) => `<li>${x}</li>`).join('')}</ul>` },
      { t: '原作者的启动链路图', html: figHTML('build') },
    ],
  });
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
}

// ---------- 11 踩坑 ----------
function timeline() {
  const list = CASES.filter((c) => c.date).sort((a, b) => a.date.localeCompare(b.date));
  return `<ol class="tl">${list.map((c) => { const ch = CHAPTERS.find((x) => x.id === c.ch);
    return `<li><span class="tl-d">${c.date}</span><div><b>${esc(c.title)}</b><div class="tl-so">→ ${esc(c.so)}</div>${ch && ch.id !== 'pitfalls' ? `<a href="#${ch.id}">在 ${ch.code}「${esc(ch.name)}」细看 ▸</a>` : ''}</div></li>`; }).join('')}</ol>`;
}
function renderPitfalls(el) {
  const cats = ['全部', ...new Set(PITFALLS.map((p) => p.cat))];
  el.innerHTML = chapter('pitfalls', {
    mech: panel('事故时间线 · 规矩是被事故一条条逼出来的', timeline())
      + panel('三起事故 · 都不报错', `${INCIDENTS.map((x, i) => `<div class="inc"><div class="inc-n">0${i + 1}</div><div><h4>${x.t}</h4>
        <dl><dt>真因</dt><dd>${esc(x.why)}</dd><dt>抓手</dt><dd>${esc(x.grip)}</dd></dl></div></div>`).join('')}`),
    deep: [{ t: '踩坑卡 · 点卡片翻面看真因', html: `<div class="filters">${cats.map((c, i) => `<button class="${i ? '' : 'on'}" data-c="${c}">${c}</button>`).join('')}</div>
      <div class="grid g2" id="pits">${PITFALLS.map((p) => `<div class="pit" data-c="${p.cat}" tabindex="0" role="button" aria-label="${esc(p.sym)}，翻面">
        <div class="pit-in"><div class="pit-f"><span class="cat">#${p.cat}</span><span class="sym">${esc(p.sym)}</span><span class="hint">点击翻面 ↻</span></div>
        <div class="pit-b"><span class="lbl">真因</span><span>${esc(p.cause)}</span><span class="lbl">抓手</span><span class="ok">${esc(p.grip)}</span></div></div></div>`).join('')}</div>` }],
  });
  el.querySelectorAll('.pit').forEach((p) => {
    const f = () => p.classList.toggle('flipped');
    p.addEventListener('click', f); p.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), f()));
  });
  el.querySelectorAll('.filters button').forEach((b) => b.addEventListener('click', () => {
    el.querySelectorAll('.filters button').forEach((x) => x.classList.toggle('on', x === b));
    el.querySelectorAll('.pit').forEach((p) => { p.style.display = b.dataset.c === '全部' || p.dataset.c === b.dataset.c ? '' : 'none'; });
  }));
}

// ---------- 12 自检 ----------
function renderQuiz(el) {
  el.innerHTML = chapter('quiz', {
    mech: `<div class="panel" id="qz"></div>
    <div class="panel"><div class="panel-tag">本站提炼 · 四句带走</div>
      <div class="grid g2">${MY_TAKEAWAYS.map((t) => `<div class="cell"><div class="k">${t.t}</div><div class="s">${t.d}</div></div>`).join('')}</div>
      <p class="judge mine">以上四句是本站对仓库内容的归纳，不是原作者原话。</p>
    </div>`,
  });
  const box = $('#qz', el);
  let i = 0, score = 0;
  const show = () => {
    if (i >= QUIZ.length) {
      const pct = Math.round((score / QUIZ.length) * 100);
      box.innerHTML = `<div class="panel-tag">结果</div><div class="qz-score">${score}/${QUIZ.length}</div>
        <p style="margin-top:10px">${pct === 100 ? '身份认领完成：你已经能用判据说话了。' : pct >= 60 ? '大部分判据到位，回看答错题对应的章节。' : '建议从「记忆」「协作」与「派单」三章重读。'}</p>
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
    视频无公开字幕，本站本地转写后对照画面字幕校正；视频画面版权归原作者。标注「本站提炼」的部分为归纳，非原文。</p>
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
