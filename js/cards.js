// 知识卡渲染器：把 js/data/ 里的纯数据块渲染成 HTML。
// 一张卡 = 仓库一个小节：{ t: 标题, sum: 一句要点, src: 仓库相对路径, blocks: [...] }
// 块类型：
//   'string'                          段落
//   { table: { head, rows, g } }      表格（g: 每行带 data-g 联动粒子高亮）
//   { list: [...], kind }             列表（kind: 'ok' | 'no' | 'num'）
//   { steps: [[标题, 说明], ...], g } 步骤
//   { code: '...', cap }              代码 / 终端 / 目录
//   { cmp: { no: [...], yes: [...], noT, yesT } }  ✗ / ✓ 对照
//   { note: '...', kind }             提示（kind: 'judge' 判据 | 'warn' 警示 | 'mine' 本站提炼）
//   { quote: '...', by }              原话
//   { img: { src, cap } }             原作者配图（MIT）
// 行内写法：**加粗**、`代码`；其余文本一律转义。
import { esc } from './tools.js';

const REPO = 'https://github.com/mashanglinyu/luanyujia-workbench/blob/main/';

// 行内：先转义，再把 **x** 与 `x` 换成标签
export function md(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
}

function block(b) {
  if (typeof b === 'string') return `<p>${md(b)}</p>`;
  if (b.table) {
    const { head, rows, g } = b.table;
    return `<div class="tbl-wrap"><table class="tbl kc-tbl">${head ? `<thead><tr>${head.map((h) => `<th>${md(h)}</th>`).join('')}</tr></thead>` : ''}
      <tbody>${rows.map((r, i) => `<tr${g ? ` tabindex="0" data-g="${i}"` : ''}>${r.map((c) => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  if (b.list) {
    const cls = b.kind === 'ok' ? 'clean yes' : b.kind === 'no' ? 'clean no' : b.kind === 'num' ? 'kc-num' : 'clean';
    return b.kind === 'num'
      ? `<ol class="${cls}">${b.list.map((x) => `<li>${md(x)}</li>`).join('')}</ol>`
      : `<ul class="${cls}">${b.list.map((x) => `<li>${md(x)}</li>`).join('')}</ul>`;
  }
  if (b.steps) {
    return `<div class="steps">${b.steps.map(([t, d], i) => `<div class="step"${b.g ? ` tabindex="0" data-g="${i}"` : ''}><div><b>${md(t)}</b>${d ? `<span>${md(d)}</span>` : ''}</div></div>`).join('')}</div>`;
  }
  if (b.code != null) return `${b.cap ? `<div class="kc-cap">${md(b.cap)}</div>` : ''}<pre class="term">${esc(b.code)}</pre>`;
  if (b.cmp) {
    const { no = [], yes = [], noT = '⛔ 别这样', yesT = '✓ 这样做' } = b.cmp;
    return `<div class="grid g2 kc-cmp"><div><div class="panel-tag warn">${md(noT)}</div><ul class="clean no">${no.map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>
      <div><div class="panel-tag ok">${md(yesT)}</div><ul class="clean yes">${yes.map((x) => `<li>${md(x)}</li>`).join('')}</ul></div></div>`;
  }
  if (b.note) return `<p class="kc-note ${b.kind || 'judge'}">${md(b.note)}</p>`;
  if (b.quote) return `<blockquote class="kc-quote">${md(b.quote)}${b.by ? `<cite>—— ${md(b.by)}</cite>` : ''}</blockquote>`;
  if (b.img) return `<figure class="fig"><button class="fig-btn" type="button" data-zoom="${b.img.src}" aria-label="放大查看"><img src="${b.img.src}" alt="${esc(b.img.cap)}" loading="lazy" /></button>
    <figcaption>${md(b.img.cap)} <a href="${REPO.replace('/blob/main/', '')}" target="_blank" rel="noopener">出处 · MIT</a></figcaption></figure>`;
  return '';
}

// 一章的全部知识卡：卡片目录 + 前 open 张展开、其余折叠
export function cards(list = [], open = 2) {
  if (!list.length) return '';
  return `<nav class="kc-index" aria-label="本章知识卡">${list.map((c, i) => `<a href="#" data-kc="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${md(c.t)}</a>`).join('')}</nav>
  ${list.map((c, i) => `<details class="kc" data-kc="${i}" ${i < open ? 'open' : ''}>
    <summary><span class="kc-n">${String(i + 1).padStart(2, '0')}</span><span class="kc-t">${md(c.t)}${c.sum ? `<em>${md(c.sum)}</em>` : ''}</span></summary>
    <div class="kc-b">${(c.blocks || []).map(block).join('')}
      ${c.src ? `<div class="kc-src">出处：${[].concat(c.src).map((p) => `<a href="${REPO}${encodeURI(p)}" target="_blank" rel="noopener">⌥ ${esc(p)}</a>`).join(' · ')}</div>` : ''}</div>
  </details>`).join('')}`;
}

// 卡片目录点击：展开并滚到那张卡
export function bindCardIndex(root) {
  root.querySelectorAll('.kc-index a').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const d = root.querySelector(`details.kc[data-kc="${a.dataset.kc}"]`);
    if (!d) return;
    d.open = true;
    d.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}
