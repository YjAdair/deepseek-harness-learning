// 理念部分（00–06 章）的 DOM 渲染与交互
import {
  CHAPTERS, MCP, META, BOOT_LINES, WALLS, PILLARS, LAYERS, CORE, IDENTITY_STEPS, BIND_FIELDS,
  IDENTITY_LAWS, DISPATCH, TOPICS,
} from './content.js';

export const $ = (s, r = document) => r.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function head(id, title, lede) {
  const code = CHAPTERS.find((c) => c.id === id)?.code ?? '--';
  return `<div class="ch-head reveal">
    <div class="ch-code">CH.${code}</div>
    <h2 class="ch-title glitch">${title}</h2>
    ${lede ? `<p class="ch-lede">${lede}</p>` : ''}
  </div>`;
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

// ---------- 00 开机 ----------
function renderBoot(el) {
  el.innerHTML = `
    <div class="boot-log" id="bootlog" aria-label="开机日志"></div>
    <h1 class="hero-title"><small>DEEPSEEK HARNESS · WORKBENCH</small>养成赛博<span class="q">「自己」</span></h1>
    <p class="ch-lede" style="font-size:17px">把「一个聊天窗口」变成「一间按场景分工的工作室」。<br>
    这是一份从<b>理念</b>到<b>实战</b>的学习路线：六层结构、三套机制、派单闭环，以及亲手搭一间的清单。</p>
    <div class="row" style="margin-top:26px">
      <a class="btn solid" href="#why">开始认领 ▸</a>
      <a class="btn" href="#build">直接实战</a>
    </div>
    <div class="hero-meta">
      <a href="${META.video}" target="_blank" rel="noopener">▶ B站原视频</a>
      <a href="${META.repo}" target="_blank" rel="noopener">⌥ GitHub 仓库</a>
      <span>作者：${META.author}</span>
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
}

// ---------- 01 本质 ----------
function renderWhy(el, scene) {
  el.innerHTML = head('why', '一个窗口，会撞上<em>三堵墙</em>', '为什么不能一个聊天框干到底？不是 AI 不够强，是结构撑不住。') + `
    <div class="grid g3 reveal" style="margin-bottom:20px">
      ${WALLS.map((w, i) => `<div class="cell" tabindex="0" data-g="${i}">
        <span class="n">WALL.${i + 1}</span><div class="k">${w.title}</div>
        <div class="s">${w.sym}</div><div class="s" style="margin-top:6px;color:var(--amber)">↳ ${w.cause}</div></div>`).join('')}
    </div>
    <div class="panel reveal">
      <div class="panel-tag">核心只有一句</div>
      <p class="quote-big">记忆在<b>文件</b>里，不在<b>会话</b>里。</p>
      <p>所以会话可以无限换，场景不会失忆。一条会话的价值 = 它<b>产出的文件</b>，不是它聊了多少。「换会话」不是灾难，<b>没写交接就换</b>才是。</p>
    </div>
    <div class="panel reveal">
      <div class="panel-tag">五块零件，各自可替换</div>
      <div class="grid g3">${PILLARS.map((p) => `<div class="cell"><span class="n">${p.n}</span><div class="k">${p.k}</div><div class="s">${p.d}</div></div>`).join('')}</div>
      <p class="judge" style="margin-top:14px">先有壳，才谈得上绑会话；壳 + 魂跑通再接手。「规矩」不是搭出来的，是事故逼出来的。</p>
    </div>`;
  bindHighlight(el, '[data-g]', scene);
}

// ---------- 02 六层 ----------
function renderLayers(el, scene) {
  el.innerHTML = head('layers', '六层：东西<em>归谁</em>、谁能写', '同一台机器上常驻多个 AI 场景，像一群同事：共用规则与台账，各自有独立记忆。悬停任一层，右侧对应的环会亮起。') + `
    <div class="reveal">${LAYERS.map((l, i) => `
      <div class="layer" tabindex="0" data-g="${i}" style="--lc:${l.color}">
        <div class="id">${l.id}</div>
        <div><div class="nm">${l.name}</div><div class="wh">${l.what}</div><div class="who">✎ ${l.who}</div></div>
      </div>`).join('')}
    </div>
    <p class="judge reveal">每个东西只属于一层，只在一个地方是「真源」；其他地方只放指针。</p>`;
  bindHighlight(el, '[data-g]', scene);
}

// ---------- 03 三机制 ----------
function collabHTML(c) {
  return `
    <div class="grid g2">
      <div><div class="panel-tag ok">✓ 算依据</div><ul class="clean yes">${c.source.ok.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      <div><div class="panel-tag warn">⛔ 不算依据</div><ul class="clean no">${c.source.no.map((x) => `<li>${x}</li>`).join('')}</ul></div>
    </div>
    <p class="judge">${c.source.rule}</p>
    <h3 style="margin-top:22px">修改权分五档</h3>
    ${c.perms.map((p) => `<div class="perm"><div class="lv" style="color:${p.bad ? 'var(--red)' : 'var(--green)'}">${p.lv}</div>
      <div><b>${p.name}</b> <span class="mono" style="color:var(--dim)">· ${p.scope}</span><br><span style="font-size:14px">${p.who}</span></div></div>`).join('')}
    <p class="judge">${c.judge}</p>
    <h3 style="margin-top:22px">唯一对口</h3>
    <ul class="clean">${c.owners.map((x) => `<li>${x}</li>`).join('')}</ul>`;
}
function memoryHTML(m) {
  return `
    ${m.tiers.map((t) => `<div class="tier"><div><b>${t.name}</b> · ${t.what}<div style="font-size:13px;color:var(--dim)">${t.who}</div></div><div class="lim">${t.limit}</div></div>`).join('')}
    <p style="font-size:14px;color:var(--dim);margin-top:10px">💸 ${m.cost}</p>
    <h3 style="margin-top:18px">§〇 当前交接 · 固定五小节</h3>
    <pre class="term"><span class="k">## §〇 当前交接（≤ 4 KB）</span>
<span class="s">### 1) 上次交接</span>    <span class="c">做了什么 / 结果 / 证据</span>
<span class="s">### 2) 当前项目</span>    <span class="c">项目 | 记忆文件 | 状态 | 下一步</span>
<span class="s">### 3) 私有记忆变更</span> <span class="c">日期：改了什么 + 为什么</span>
<span class="s">### 4) 下一步 / 卡点</span> <span class="c">没有卡点就写「无」</span>
<span class="s">### 5) 全貌</span>        <span class="c">工具生成，别手改</span></pre>
    <ul class="clean" style="margin-top:12px">${m.rules.map((x) => `<li>${x}</li>`).join('')}</ul>
    <p class="judge">${m.judge}</p>`;
}
function sceneHTML(s) {
  return `
    <p style="margin-top:0">${s.one}</p>
    <div class="grid g3 kit">${s.kit.map((k) => `<div class="cell"><span class="n">${k.n}</span>
      <div class="k">${k.name} ${k.must ? '<span class="must">不可省</span>' : ''}</div>
      <div class="mono" style="font-size:12px;color:var(--cyan)">${esc(k.file)}</div>
      <div class="s" style="margin-top:4px">缺了：${k.miss}</div></div>`).join('')}</div>
    <p style="font-size:14px;margin-top:12px">判断一个场景成不成立，只看三件：<b>卡（职责）、记忆（进度）、索引（身份）</b>。</p>
    <p class="judge">${s.judge}</p>`;
}
function renderCore(el, scene) {
  const keys = ['collab', 'memory', 'scene'];
  el.innerHTML = head('core', '三套机制，决定<em>三个月后</em>还乱不乱', '界面和绑定是技术，抄一遍就能跑。真正难的是这三套机制：场景划分「地盘」，记忆记着「我干到哪」，协作规定「这件事该谁做」。') + `
    <div class="seg reveal" role="tablist">${keys.map((k, i) => `<button role="tab" data-k="${k}" data-g="${i}" class="${i ? '' : 'on'}">${CORE[k].title}</button>`).join('')}</div>
    <div class="panel reveal" id="core-body"></div>`;
  const body = $('#core-body', el);
  const show = (k) => {
    const c = CORE[k];
    body.innerHTML = `<div class="panel-tag">${c.title} · 不搞会怎样：<span class="warn">${c.fail}</span></div>
      <h3>${c.one}</h3>` + ({ collab: collabHTML, memory: memoryHTML, scene: sceneHTML }[k])(c);
  };
  el.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
    el.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('on', x === b));
    show(b.dataset.k); scene.highlight(Number(b.dataset.g));
  }));
  show('collab');
}

// ---------- 04 认领 ----------
function renderIdentity(el, scene) {
  el.innerHTML = head('identity', 'AI 怎么知道<em>「我是谁」</em>', '引擎本身不按场景注入任何东西 —— AI 开场时对自己的身份是空白的。工作台和「多标签浏览器」的根本区别就在这里。') + `
    <div class="panel reveal"><div class="panel-tag">身份认领 · 四步</div>
      <div class="steps">${IDENTITY_STEPS.map((s, i) => `<div class="step" tabindex="0" data-g="${i}"><div><b>${s.t}</b><span>${s.d}</span></div></div>`).join('')}</div>
    </div>
    <div class="panel reveal"><div class="panel-tag">跟着窗口走 · 会话绑定三字段</div>
<pre class="term">{
  <span class="k">"type"</span>: <span class="s">"harness"</span>,
  <span class="k">"sessionTitle"</span>: <span class="s">"自我复盘"</span>,      <span class="c">// 人读</span>
  <span class="k">"sessionId"</span>: <span class="s">"session-0000…"</span>,   <span class="c">// 精确 · 必须是你自己真实存在的 id</span>
  <span class="k">"pinTarget"</span>: <span class="s">"自我复盘"</span>          <span class="c">// 兜底</span>
}</pre>
      <div class="grid g3" style="margin-top:12px">${BIND_FIELDS.map((f) => `<div class="cell"><div class="k mono" style="color:var(--cyan)">${f.k}</div><div class="s"><b style="color:var(--text)">${f.role}</b> · ${f.d}</div></div>`).join('')}</div>
    </div>
    <div class="panel reveal"><div class="panel-tag">三条硬结论</div>
      <ul class="clean">${IDENTITY_LAWS.map((x) => `<li>${x}</li>`).join('')}</ul>
    </div>`;
  bindHighlight(el, '[data-g]', scene);
}

// ---------- 接手：MCP 接免费 AI ----------
function renderMcp(el, scene) {
  const M = MCP;
  el.innerHTML = head('mcp', '「手」：把网页版 AI<em>接成工具</em>', '不花 API token，让本地 AI 能问豆包 / 通义 / DeepSeek / 智谱。做法不是破解接口，而是复用一个已登录的浏览器：像人一样输入、等它说完、把话取回来。') + `
    <div class="panel reveal"><div class="panel-tag">四层 · 缺一不可（悬停看右侧对应节点）</div>
      <div class="pipe">${M.layers.map((l, i) => `<div class="pipe-n" tabindex="0" data-g="${i}"><b>${l.k}</b><span>${l.d}</span><em>${l.key}</em></div>`).join('<div class="pipe-a" aria-hidden="true">⇄</div>')}</div>
    </div>
    <div class="panel reveal"><div class="panel-tag">「零成本」的真实账单</div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>你花的是</th><th>不是</th></tr></thead><tbody>
        ${M.pay.map(([a, b]) => `<tr><td class="ok">${a}</td><td style="color:var(--dim)">${b}</td></tr>`).join('')}</tbody></table></div>
      <div class="grid g2" style="margin-top:12px">${M.cost.map(([a, b]) => `<div class="cell"><div class="k warn">${a}</div><div class="s">${b}</div></div>`).join('')}</div>
      <p class="judge">${M.judge}</p>
    </div>
    <div class="panel reveal"><div class="panel-tag">模拟器 · 等待要分两步：先等「出现」，再等「不再变」</div>
      <div class="sim">
        <div class="sim-page"><span class="sim-lbl">网页版 AI 正在输出</span><div id="sim-stream"></div></div>
        <div class="sim-cap"><span class="sim-lbl">工具取回的文本</span><div id="sim-got">—</div></div>
      </div>
      <div class="row" style="margin-top:10px">
        <button class="btn sm" data-sim="appear">▶ 只等「出现」</button>
        <button class="btn sm" data-sim="stable">▶ 等「稳定」stableMs=1200</button>
      </div>
      <div class="lint" id="sim-lint"></div>
    </div>
    <div class="panel reveal"><div class="panel-tag">四个设计决定（值得抄）</div>
      <div class="grid g2">${M.decisions.map((d, i) => `<div class="cell"><span class="n">0${i + 1}</span><div class="k">${d.t}</div><div class="s">${d.d}</div></div>`).join('')}</div>
<pre class="term" style="margin-top:12px"><span class="c">// 站点差异只在这一个对象里；流程代码所有站共用</span>
<span class="k">export const</span> site = {
  id: <span class="s">'my-site'</span>, url: <span class="s">'https://example.com/'</span>,
  loggedIn: <span class="k">async</span> (page) => !!(<span class="k">await</span> page.$(<span class="s">'textarea'</span>)), <span class="c">// 只有登录后才有</span>
  inputSel: <span class="s">'textarea'</span>, answerSel: <span class="s">'[data-answer]'</span>,
  send: <span class="k">async</span> (page) => page.keyboard.press(<span class="s">'Enter'</span>),
  wait: { firstTokenMs: 20000, stableMs: 1200, hardTimeoutMs: 180000 },
  profileDir: <span class="s">'&lt;你的 profile 目录&gt;'</span>,
};</pre>
    </div>
    <div class="panel reveal"><div class="panel-tag">加一个站 · 五步（十几分钟的活）</div>
      <div class="steps">${M.addSteps.map(([t, d]) => `<div class="step"><div><b>${t}</b><span>${esc(d)}</span></div></div>`).join('')}</div>
      <div class="grid g2" style="margin-top:8px">
        <div><b class="ok">便宜 · 加站不用碰</b><ul class="clean yes">${M.cheap.map((x) => `<li>${x}</li>`).join('')}</ul></div>
        <div><b class="warn">贵 · 每个站都得重做</b><ul class="clean no">${M.dear.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      </div>
      <p class="judge">加站的成本不在代码，在维护选择器与登录态。别一次加 10 个站，只加你每周真会用的 2~3 个。</p>
    </div>
    <div class="panel reveal"><div class="panel-tag">分工（作者本机实测偏好，不是绝对结论）</div>
      <div class="tbl-wrap"><table class="tbl"><tbody>${M.sites.map(([a, b]) => `<tr><td><b>${a}</b></td><td>${b}</td></tr>`).join('')}</tbody></table></div>
      <p style="font-size:14px;color:var(--dim);margin-top:8px">用法：同一个问题问 2 个站，比一比 —— 不花 token 的「第二意见」。</p>
    </div>
    <div class="panel reveal"><div class="panel-tag">机密闸 · 写进代码，不只写在文档</div>
      <p style="font-size:14px">这些都是站外服务。正文含 密码 / token / 密钥 / 身份证 / 银行卡 / 手机号 ⇒ 调用前就拒发。试试：</p>
      <div class="form"><input id="gate-in" value="帮我总结一下 §〇 交接该写什么" aria-label="要发给网页版 AI 的内容"></div>
      <div class="lint" id="gate-out"></div>
    </div>
    <div class="panel reveal"><div class="panel-tag">排障 · 大部分故障不报错，按症状查</div>
      <div class="grid g2">
        <div><b>排查顺序（别跳）</b><ul class="clean">${M.order.map((x, i) => `<li><span class="mono" style="color:var(--cyan)">${i + 1}</span> ${x}</li>`).join('')}</ul>
          <p style="font-size:13.5px;color:var(--amber)">① 或 ② 不成立，后面全是白调。</p></div>
        <div><b>两个「看起来正常」的陷阱</b>${M.traps.map(([a, b]) => `<div class="cell" style="margin-top:8px"><div class="k warn">${a}</div><div class="s">${b}</div></div>`).join('')}</div>
      </div>
    </div>`;
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
      // 模拟网页逐字输出，中途停顿一次（像模型在想）
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

// ---------- 派单 ----------
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
  const D = DISPATCH;
  el.innerHTML = head('dispatch', '派单 ≠ <em>公告</em>', '多 AI 系统里最贵的浪费是「双方都在等对方」—— 而且它没有任何报错。') + `
    <div class="panel reveal"><div class="panel-tag">状态机 · 点按钮模拟一条活</div>
      ${fsmSVG()}
      <div class="row"><button class="btn sm" data-run="ok">▶ 对方带证据回执</button><button class="btn sm" data-run="timeout">▶ 超时没回</button></div>
      <div class="fsm-log" id="fsm-log">› 等待派单…</div>
    </div>
    <div class="panel reveal"><div class="panel-tag">真实事故</div>
      <p>${D.incident}</p>
      <div class="meter"><b></b></div><div class="mono" style="font-size:12px;color:var(--dim)">送达 8 / 36 = 22%</div>
    </div>
    <div class="panel reveal"><div class="panel-tag">派单正文 · 四件套（缺一件对方就得追问）</div>
      <div class="grid g2">${D.kit.map((k, i) => `<div class="cell"><span class="n">0${i + 1}</span><div class="k">${k.k}</div><div class="s">${k.d}</div></div>`).join('')}</div>
      <div class="cmp" style="margin-top:12px"><div class="bad">❌ ${D.bad}</div><div class="good">✅ ${D.good}</div></div>
    </div>
    <div class="panel reveal"><div class="panel-tag">上限 · 规矩 10：禁止无限对话</div>
      <div class="tbl-wrap"><table class="tbl"><tbody>${D.limits.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table></div>
      <p class="judge">活干完了但对方还不知道 = 没干完。</p>
    </div>`;

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

// ---------- 06 专题 ----------
function renderTopics(el, scene) {
  const G = TOPICS.gpu, P = TOPICS.persona;
  el.innerHTML = head('topics', '两个专题：<em>算力</em>与<em>人格</em>', '一个管「活该在哪算」，一个管「在这个场景该怎么跟机主说话」。') + `
    <div class="panel reveal" data-g="0"><div class="panel-tag" style="color:var(--green)">专题 A · ${G.title}</div>
      <div class="grid g2">
        <div><b class="ok">✓ 只有三类活能上 GPU</b><ul class="clean yes">${G.ok.map(([a, b]) => `<li>${a} <span class="mono" style="color:var(--dim)">· ${b}</span></li>`).join('')}</ul></div>
        <div><b class="warn">⛔ 用不上</b><ul class="clean no">${G.no.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      </div>
      <div class="grid g3" style="margin-top:12px">
        <div class="cell"><div class="k">退 CPU 三约束</div>${G.cpu.map(([a, b]) => `<div class="s">${a}：<span class="mono">${b}</span></div>`).join('')}</div>
        <div class="cell"><div class="k">验收三条（缺一不算）</div>${G.accept.map((x) => `<div class="s">· ${x}</div>`).join('')}</div>
        <div class="cell"><div class="k">负载闸</div>${G.gate.map(([a, b]) => `<div class="s"><span class="mono" style="color:var(--amber)">${a}</span> ${b}</div>`).join('')}</div>
      </div>
      <p class="judge">${G.judge}</p>
    </div>
    <div class="panel reveal" data-g="1"><div class="panel-tag" style="color:var(--violet)">专题 B · ${P.title}</div>
      <h3>${P.one}</h3>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>字段</th><th>写什么</th></tr></thead><tbody>
        ${P.fields.map(([a, b]) => `<tr><td><b>${a}</b></td><td>${b}</td></tr>`).join('')}</tbody></table></div>
      <h3 style="margin-top:16px">四条硬边界</h3>
      <ul class="clean no">${P.bounds.map((x) => `<li>${x}</li>`).join('')}</ul>
      <p class="judge">开场先读自己那一行，决定三件事：回多长、先说啥、别踩什么。说对一次，比说错三次再道歉便宜。</p>
    </div>`;
  bindHighlight(el, '[data-g]', scene);
}

export function renderTheory(scene) {
  renderBoot($('#boot'));
  renderWhy($('#why'), scene);
  renderLayers($('#layers'), scene);
  renderCore($('#core'), scene);
  renderIdentity($('#identity'), scene);
  renderMcp($('#mcp'), scene);
  renderDispatch($('#dispatch'), scene);
  renderTopics($('#topics'), scene);
}
