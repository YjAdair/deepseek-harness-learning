// 交互：上手清单 · 事故时间线 · 踩坑总表（筛选 + 搜索）· 测验 · 页脚
import { META, BUILD_STEPS, BUILD_WARN, QUIZ, MY_TAKEAWAYS, CASES, CHAPTERS } from './content.js';
import { PITFALL_ROWS } from './data/p4-hands.js';
import { $, esc, store } from './tools.js';
import { md } from './cards.js';

const KEY_PROGRESS = 'dsh.progress.v1';

// ---------- 六步上手 · 验收清单（从零到能跑章） ----------
export const checklist = {
  t: '动手：六步上手 · 验收清单（展开一步，背景螺旋对应那一圈会亮；进度存在你的浏览器里）',
  html: () => {
    const prog = store.get(KEY_PROGRESS, {});
    return `<div class="prog"><span id="pg-txt">0%</span><i><b id="pg-bar"></b></i></div>
    <div id="bsteps">${BUILD_STEPS.map((s, i) => `
      <details class="bstep" data-g="${i}" ${i === 0 ? 'open' : ''}>
        <summary><span class="no">0${i + 1}</span>${s.t}<span class="cnt"></span></summary>
        <div class="body">${s.checks.map((c, j) => `<label class="chk"><input type="checkbox" data-id="${i}-${j}" ${prog[`${i}-${j}`] ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}</div>
      </details>`).join('')}</div>
    <p class="judge">${BUILD_WARN}</p>`;
  },
  init(el, scene) {
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
  },
};

// ---------- 事故时间线（自检与踩坑章） ----------
export const timeline = {
  t: '事故时间线 · 规矩是被事故一条条逼出来的',
  html: () => {
    const list = CASES.filter((c) => c.date).sort((a, b) => a.date.localeCompare(b.date));
    return `<ol class="tl">${list.map((c) => { const ch = CHAPTERS.find((x) => x.id === c.ch);
      return `<li><span class="tl-d">${c.date}</span><div><b>${esc(c.title)}</b><div class="tl-so">→ ${esc(c.so)}</div>${ch && ch.id !== 'pitfalls' ? `<a href="#${ch.id}">在 ${ch.code}「${esc(ch.name)}」细看 ▸</a>` : ''}</div></li>`; }).join('')}</ol>`;
  },
  init() {},
};

// ---------- 踩坑总表 26 条（自检与踩坑章）：按类筛选 + 关键词搜索 ----------
export const pitfallTable = {
  t: '踩坑总表 26 条 · 按症状定位 → 看判据确认 → 照抓手修',
  html: () => {
    const cats = ['全部', ...new Set(PITFALL_ROWS.map((r) => r.cat))];
    return `<div class="pt-bar">
      <div class="filters">${cats.map((c, i) => `<button type="button" class="${i ? '' : 'on'}" data-c="${c}">${c}</button>`).join('')}</div>
      <div class="form"><input id="pt-q" placeholder="搜症状，如：白、乱码、404、413、已发送" aria-label="按症状关键词搜索"></div>
    </div>
    <div class="tbl-wrap"><table class="tbl kc-tbl pt"><thead><tr><th>#</th><th>症状</th><th>真因</th><th>判据</th><th>抓手</th></tr></thead>
      <tbody>${PITFALL_ROWS.map((r) => `<tr data-c="${r.cat}"><td class="mono">${r.n}</td><td><span class="pt-cat">${r.cat}</span>${md(r.sym)}</td><td>${md(r.why)}</td><td>${md(r.judge)}</td><td>${md(r.fix)}</td></tr>`).join('')}</tbody></table></div>
    <p class="pt-count mono" id="pt-count"></p>`;
  },
  init(el) {
    let cat = '全部';
    const q = $('#pt-q', el), rows = [...el.querySelectorAll('table.pt tbody tr')];
    const apply = () => {
      const k = q.value.trim().toLowerCase();
      let n = 0;
      rows.forEach((r) => {
        const show = (cat === '全部' || r.dataset.c === cat) && (!k || r.textContent.toLowerCase().includes(k));
        r.hidden = !show; if (show) n++;
      });
      $('#pt-count', el).textContent = `显示 ${n} / ${rows.length} 条`;
    };
    el.querySelectorAll('.pt-bar .filters button').forEach((b) => b.addEventListener('click', () => {
      el.querySelectorAll('.pt-bar .filters button').forEach((x) => x.classList.toggle('on', x === b));
      cat = b.dataset.c; apply();
    }));
    q.addEventListener('input', apply); apply();
  },
};

// ---------- 自检测验 ----------
export const quiz = {
  t: '情境测验',
  html: () => `<div id="qz"></div>
    <div class="panel" style="margin-top:16px"><div class="panel-tag">本站提炼 · 四句带走</div>
      <div class="grid g2">${MY_TAKEAWAYS.map((t) => `<div class="cell"><div class="k">${t.t}</div><div class="s">${t.d}</div></div>`).join('')}</div>
      <p class="judge mine">以上四句是本站对仓库内容的归纳，不是原作者原话。</p>
    </div>`,
  init(el) {
    const box = $('#qz', el);
    let i = 0, score = 0;
    const show = () => {
      if (i >= QUIZ.length) {
        const pct = Math.round((score / QUIZ.length) * 100);
        box.innerHTML = `<div class="panel-tag">结果</div><div class="qz-score">${score}/${QUIZ.length}</div>
          <p style="margin-top:10px">${pct === 100 ? '身份认领完成：你已经能用判据说话了。' : pct >= 60 ? '大部分判据到位，答错的题都标了对应章节。' : '建议从「记忆」「协作」「派单与回执」三章重读。'}</p>
          <button class="btn sm" type="button" id="qz-re">重来</button>`;
        $('#qz-re', box).addEventListener('click', () => { i = 0; score = 0; show(); });
        return;
      }
      const q = QUIZ[i];
      const ch = CHAPTERS.find((c) => c.id === q.ch);
      box.innerHTML = `<div class="panel-tag">Q.${String(i + 1).padStart(2, '0')} / ${QUIZ.length} · 得分 ${score}${ch ? ` · 出自 ${ch.code}「${ch.name}」` : ''}</div>
        <div class="qz-q">${q.q}</div>
        ${q.opts.map((o, j) => `<button class="qz-opt" type="button" data-j="${j}">${String.fromCharCode(65 + j)}. ${o}</button>`).join('')}
        <div class="qz-why" id="qz-why"></div>`;
      box.querySelectorAll('.qz-opt').forEach((b) => b.addEventListener('click', () => {
        const j = Number(b.dataset.j);
        box.querySelectorAll('.qz-opt').forEach((x, k) => { x.disabled = true; if (k === q.a) x.classList.add('right'); });
        if (j === q.a) score++; else b.classList.add('wrong');
        $('#qz-why', box).innerHTML = '判据 ▸ ' + esc(q.why) + (ch && j !== q.a ? ` <a href="#${ch.id}">回看 ${ch.code}「${esc(ch.name)}」▸</a>` : '');
        box.insertAdjacentHTML('beforeend', `<button class="btn sm solid" type="button" id="qz-next">${i + 1 < QUIZ.length ? '下一题 ▸' : '看结果'}</button>`);
        $('#qz-next', box).addEventListener('click', () => { i++; show(); });
      }));
    };
    show();
  },
};

export function renderFoot(el) {
  el.innerHTML = `
    <h4>SOURCES</h4>
    <p>内容整理自 <a href="${META.repo}" target="_blank" rel="noopener">mashanglinyu/luanyujia-workbench</a>（MIT，按模块逐篇整理，每张知识卡标出处）与 B 站视频 <a href="${META.video}" target="_blank" rel="noopener">《DSH搭AI工作台，养成赛博“自己”！》</a>。
    视频无公开字幕，本站本地转写后对照画面字幕校正；视频画面版权归原作者。标注「本站提炼」的部分为归纳，非原文。</p>
    <p>作者：${META.author} · 个人站 <a href="${META.site}" target="_blank" rel="noopener">linyujia.me</a> · DSH 改造集市 <a href="${META.market}" target="_blank" rel="noopener">mydsh.xyz</a></p>
    <p class="mono" style="font-size:12px">⚠ 原仓库提醒：这不是「装完就能用」的软件。路径与会话 id 全是占位符，照抄一定失败。</p>`;
}
