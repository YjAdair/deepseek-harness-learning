// 启动入口：装配 3D 场景、渲染章节、滚动联动「场景标签栏」
import { CHAPTERS } from './content.js';
import { renderTheory, $ } from './ui.js';
import { renderPractice } from './ui-practice.js';

const KEY_SEEN = 'dsh.seen.v1';
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 忽略 */ } };

// 3D 失败（无 WebGL / CDN 不通）时页面照常可读
let scene = { setFormation() {}, highlight() {}, setScroll() {} };
try {
  const { createScene } = await import('./scene.js');
  scene = createScene($('#gl'));
} catch (err) {
  console.warn('[DSH] 3D 场景未启动，降级为纯文本：', err);
  document.body.classList.add('no-gl');
}

// 状态栏 §〇 计量跟随交接计量器
addEventListener('dsh:handoff', (e) => {
  const b = e.detail;
  $('#sb-kb').textContent = `${(b / 1024).toFixed(1)} / 4 KB`;
  const bar = $('#sb-bar');
  bar.style.width = Math.min(100, (b / 4096) * 100) + '%';
  bar.style.background = b > 4096 ? 'var(--red)' : 'var(--cyan)';
});

renderTheory(scene);
renderPractice(scene);

// 标签栏
const tabs = $('#tabs');
const seen = new Set(read(KEY_SEEN, []));
tabs.innerHTML = CHAPTERS.map((c) => `<button class="tab ${seen.has(c.id) ? 'seen' : ''}" data-id="${c.id}">
  <span class="ic">${c.icon}</span><span class="cd">${c.code}</span>${c.name}</button>`).join('');
tabs.addEventListener('click', (e) => {
  const b = e.target.closest('.tab'); if (!b) return;
  document.getElementById(b.dataset.id)?.scrollIntoView({ behavior: 'smooth' });
});

// 当前章节 = 视口中线所在的章节
const sections = [...document.querySelectorAll('.chapter')];
let current = '';
function activate(sec) {
  if (sec.id === current) return;
  current = sec.id;
  const ch = CHAPTERS.find((c) => c.id === sec.id);
  scene.setFormation(sec.dataset.formation);
  tabs.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.id === sec.id));
  tabs.querySelector('.tab.on')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  $('#pin-text').textContent = `✓ 已钉住 · CH.${ch.code}`;
  $('#sb-scene').textContent = `场景：${ch.name}`;
  seen.add(sec.id); write(KEY_SEEN, [...seen]);
  tabs.querySelector(`[data-id="${sec.id}"]`)?.classList.add('seen');
}
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); activate(e.target); } });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((s) => io.observe(s));
// 入场动画：靠近视口就显示
const ioReveal = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.05 });
sections.forEach((s) => ioReveal.observe(s));

addEventListener('scroll', () => {
  const p = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  scene.setScroll(p);
}, { passive: true });


// 内容是渲染后才有高度的：带锚点打开时补一次跳转
if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
