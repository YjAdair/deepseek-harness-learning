// 启动入口：装配 3D 场景、渲染章节、三部分导航、本章目录、舞台 / 阅读切换
import { CHAPTERS, PARTS } from './content.js';
import { renderTheory, $ } from './ui.js';
import { renderPractice } from './ui-practice.js';

const KEY_SEEN = 'dsh.seen.v1';
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 忽略 */ } };

// 3D 失败（无 WebGL / CDN 不通）时页面照常可读
let scene = { setFormation() {}, highlight() {}, setScroll() {}, setFocus() {}, setFlow() {} };
try {
  const { createScene } = await import('./scene.js');
  scene = createScene($('#gl'));
} catch (err) {
  console.warn('[DSH] 3D 场景未启动，降级为纯文本：', err);
  document.body.classList.add('no-gl');
}

// 状态栏「开头交接」计量跟随记忆章的计量器
addEventListener('dsh:handoff', (e) => {
  const b = e.detail;
  $('#sb-kb').textContent = `${(b / 1024).toFixed(1)} / 4 KB`;
  const bar = $('#sb-bar');
  bar.style.width = Math.min(100, (b / 4096) * 100) + '%';
  bar.style.background = b > 4096 ? 'var(--red)' : 'var(--cyan)';
});

renderTheory(scene);
renderPractice(scene);

// ---------- 导航：三部分 + 本部分章节 ----------
const seen = new Set(read(KEY_SEEN, []).filter((id) => CHAPTERS.some((c) => c.id === id)));
const parts = $('#parts'), tabs = $('#tabs');
parts.innerHTML = PARTS.map((p, i) => `<a class="part" href="#${CHAPTERS.find((c) => c.part === p.id).id}" data-part="${p.id}" style="--pc:${p.color}">${'一二三'[i]} · ${p.name}<span>${p.sub}</span></a>`).join('');
tabs.innerHTML = CHAPTERS.map((c) => `<a class="tab ${seen.has(c.id) ? 'seen' : ''}" href="#${c.id}" data-id="${c.id}" data-part="${c.part}"><span class="cd">${c.code}</span>${c.name}</a>`).join('');
const progress = () => {
  $('#prog-txt').textContent = `已读 ${seen.size} / ${CHAPTERS.length}`;
  $('#prog-bar').style.width = (seen.size / CHAPTERS.length) * 100 + '%';
};
progress();

// ---------- 本章目录（桌面宽屏） ----------
const toc = $('#toc');
document.querySelectorAll('.chapter').forEach((sec) => sec.querySelectorAll('.sec').forEach((s, i) => { if (!s.id) s.id = `${sec.id}-s${i + 1}`; }));
function buildToc(sec) {
  const items = [...sec.querySelectorAll('.sec')];
  toc.innerHTML = `<div class="toc-h">本章</div>` + items.map((s) => `<a href="#${s.id}" data-sec="${s.id}">${s.dataset.toc}</a>`).join('');
}

// ---------- 当前章节 = 视口中线所在的章节 ----------
const sections = [...document.querySelectorAll('.chapter')];
let current = '';
function activate(sec) {
  if (sec.id === current) return;
  current = sec.id;
  const ch = CHAPTERS.find((c) => c.id === sec.id);
  scene.setFormation(ch.formation);
  scene.highlight(-1);
  parts.querySelectorAll('.part').forEach((p) => p.classList.toggle('on', p.dataset.part === ch.part));
  tabs.querySelectorAll('.tab').forEach((t) => { t.hidden = t.dataset.part !== ch.part; t.classList.toggle('on', t.dataset.id === sec.id); });
  $('#sb-scene').textContent = `场景：${ch.code} ${ch.name}`;
  buildToc(sec);
  if (!seen.has(sec.id)) { seen.add(sec.id); write(KEY_SEEN, [...seen]); progress(); }
  tabs.querySelector(`[data-id="${sec.id}"]`)?.classList.add('seen');
}
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); activate(e.target); } });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((s) => io.observe(s));
// 入场动画：靠近视口就显示
const ioReveal = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.02 });
sections.forEach((s) => ioReveal.observe(s));

// ---------- 3D：章头是舞台（亮），正文是阅读区（暗） ----------
const onStage = new Set();
const ioStage = new IntersectionObserver((entries) => {
  entries.forEach((e) => (e.isIntersecting ? onStage.add(e.target) : onStage.delete(e.target)));
  scene.setFocus(onStage.size ? 'stage' : 'read');
}, { rootMargin: '-25% 0px -45% 0px' });
document.querySelectorAll('.stage').forEach((s) => ioStage.observe(s));

// 「作者踩过的坑」进入视口：粒子流动，表示「事情在发生」
const inStory = new Set();
const ioStory = new IntersectionObserver((entries) => {
  entries.forEach((e) => (e.isIntersecting ? inStory.add(e.target) : inStory.delete(e.target)));
  scene.setFlow(inStory.size > 0);
}, { rootMargin: '-30% 0px -30% 0px' });
document.querySelectorAll('.story-main').forEach((s) => ioStory.observe(s));

// 目录高亮：视口中线所在的段
const ioToc = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    toc.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.sec === e.target.id));
  });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('.chapter .sec').forEach((s) => ioToc.observe(s));

addEventListener('scroll', () => {
  const p = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  scene.setScroll(p);
}, { passive: true });

// 内容是渲染后才有高度的：带锚点打开时补一次跳转
if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
