// three.js 背景场景：一团粒子构成的「赛博自己」，随章节变形。
// 新增形态只在 FORMATIONS 里加；章节用 data-formation 指定。
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const N = 9000;
const C = {
  cyan: new THREE.Color('#3df2ff'),
  amber: new THREE.Color('#ffb020'),
  red: new THREE.Color('#ff3b5c'),
  violet: new THREE.Color('#b26bff'),
  green: new THREE.Color('#4dff9c'),
  grey: new THREE.Color('#8a94a6'),
  white: new THREE.Color('#e8fbff'),
};
const LAYER_COLORS = [C.red, C.amber, C.cyan, C.violet, C.green, C.grey];

// ---------- 小工具 ----------
const rand = (a = -1, b = 1) => a + Math.random() * (b - a);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
function onSphere(r) {
  const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
  return [r * s * Math.cos(t), r * u, r * s * Math.sin(t)];
}
function inBall(r) {
  const p = onSphere(1), k = r * Math.cbrt(Math.random());
  return [p[0] * k, p[1] * k, p[2] * k];
}

// 每个形态返回 { pos, col, group, phase }
function build(fill) {
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const group = new Float32Array(N).fill(-1), phase = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = fill(i, i / N);
    pos.set(r.p, i * 3);
    col.set([r.c.r, r.c.g, r.c.b], i * 3);
    group[i] = r.g ?? -1;
    phase[i] = r.ph ?? Math.random();
  }
  return { pos, col, group, phase };
}

const FORMATIONS = {
  // 赛博自己：外壳 + 内核 + 六个场景节点
  core: () => build((i, f) => {
    if (f < 0.58) return { p: onSphere(2.2 + gauss() * 0.05), c: C.cyan };
    if (f < 0.72) return { p: inBall(0.55), c: C.white };
    const k = i % 6, a = (k / 6) * Math.PI * 2, b = inBall(0.28);
    return { p: [Math.cos(a) * 3.7 + b[0], Math.sin(a * 2) * 0.6 + b[1], Math.sin(a) * 3.7 + b[2]], c: LAYER_COLORS[k], g: k };
  }),
  // 三堵墙
  walls: () => build((i) => {
    const k = i % 3;
    return { p: [(k - 1) * 2.6 + gauss() * 0.12, rand(-1.8, 1.8), rand(-1.1, 1.1)], c: [C.red, C.amber, C.violet][k], g: k };
  }),
  // 六层：L0 在上，L5 在下
  layers: () => build((i) => {
    const k = i % 6, a = Math.random() * Math.PI * 2, r = 1.2 + Math.sqrt(Math.random()) * (1.6 + k * 0.18);
    return { p: [Math.cos(a) * r, 2.6 - k * 1.05 + gauss() * 0.04, Math.sin(a) * r], c: LAYER_COLORS[k], g: k, ph: a / (Math.PI * 2) };
  }),
  // 三机制：协作（环）/ 记忆（三层壳）/ 场景（六件套）
  triad: () => build((i, f) => {
    const V = [[-2.6, 1.3, 0], [2.6, 1.3, 0], [0, -2.1, 0]];
    if (f > 0.9) { // 三者之间的数据流
      const a = Math.floor(rand(0, 3)), b = (a + 1) % 3, t = Math.random();
      return { p: V[a].map((v, j) => v + (V[b][j] - v) * t + gauss() * 0.06), c: C.white, ph: t };
    }
    const k = i % 3, [x, y, z] = V[k];
    if (k === 0) { const a = Math.random() * Math.PI * 2, r = 1.1 + gauss() * 0.08; return { p: [x + Math.cos(a) * r, y + Math.sin(a) * r, z + gauss() * 0.2], c: C.amber, g: 0 }; }
    if (k === 1) { const s = [0.35, 0.8, 1.25][Math.floor(Math.random() * 3)], p = onSphere(s); return { p: [x + p[0], y + p[1], z + p[2]], c: C.cyan, g: 1 }; }
    const m = Math.floor(Math.random() * 6), a = (m / 6) * Math.PI * 2, b = inBall(0.25);
    return { p: [x + Math.cos(a) * 1.05 + b[0], y + Math.sin(a) * 1.05 + b[1], z + b[2]], c: C.violet, g: 2 };
  }),
  // 身份认领：四条倾斜轨道围绕内核
  orbit: () => build((i, f) => {
    if (f < 0.12) return { p: inBall(0.5), c: C.white };
    const k = i % 4, a = Math.random() * Math.PI * 2, r = 1.3 + k * 0.75, tilt = k * 0.55 - 0.8;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    return { p: [x, z * Math.sin(tilt) + gauss() * 0.03, z * Math.cos(tilt)], c: [C.cyan, C.amber, C.green, C.violet][k], g: k, ph: a / (Math.PI * 2) };
  }),
  // 接手：四层管线 A 会话 → B 桥 → C MCP → D 网页版，请求与回答双向流动
  bridge: () => build((i, f) => {
    const X = [-3.6, -1.2, 1.2, 3.6], cols = [C.cyan, C.amber, C.green, C.violet];
    if (f < 0.55) {
      const k = i % 4, b = k === 3 ? [rand(-0.9, 0.9), rand(-1.2, 1.2), gauss() * 0.08] : inBall(0.55);
      return { p: [X[k] + b[0], b[1], b[2]], c: cols[k], g: k, ph: k / 4 };
    }
    const up = i % 2, t = Math.random(), a = t * Math.PI * 6;
    return { p: [X[0] + t * 7.2, (up ? 0.35 : -0.35) + Math.sin(a) * 0.12, Math.cos(a) * 0.12], c: up ? C.white : C.amber, ph: up ? t : 1 - t };
  }),
  // 派单状态环：六个状态节点 + 流动
  ring: () => build((i, f) => {
    const a = Math.random() * Math.PI * 2;
    if (f < 0.35) { const k = i % 6, aa = (k / 6) * Math.PI * 2, b = inBall(0.32); return { p: [Math.cos(aa) * 3 + b[0], Math.sin(aa) * 3 + b[1], b[2]], c: k === 4 ? C.red : C.amber, g: k, ph: k / 6 }; }
    const r = 3 + gauss() * 0.12;
    return { p: [Math.cos(a) * r, Math.sin(a) * r, gauss() * 0.15], c: C.cyan, ph: a / (Math.PI * 2) };
  }),
  // 专题：双臂星系
  scatter: () => build((i) => {
    const arm = i % 2, t = Math.random(), a = t * Math.PI * 3.2 + arm * Math.PI, r = 0.3 + t * 4;
    return { p: [Math.cos(a) * r + gauss() * 0.25 * t, gauss() * 0.25, Math.sin(a) * r + gauss() * 0.25 * t], c: arm ? C.violet : C.green, g: arm, ph: t };
  }),
  // 规矩 → 机制：晶格
  lattice: () => build((i, f) => {
    const S = 5, step = 1.15, o = (S - 1) / 2;
    const gx = Math.floor(rand(0, S)), gy = Math.floor(rand(0, S)), gz = Math.floor(rand(0, S));
    let p = [(gx - o) * step, (gy - o) * step, (gz - o) * step];
    if (f > 0.35) { const ax = Math.floor(rand(0, 3)), t = rand(0, step); p[ax] += t; if (p[ax] > o * step) p[ax] -= step; }
    else p = p.map((v) => v + gauss() * 0.04);
    return { p, c: gx === 4 ? C.green : C.cyan, g: gx, ph: (gx + 0.5) / S };
  }),
  // 实战：进化螺旋（六步）
  helix: () => build((i, f) => {
    const t = Math.random(), y = (t - 0.5) * 6.4, a = t * Math.PI * 5, k = Math.min(5, Math.floor(t * 6));
    if (f < 0.75) { const s = i % 2 ? Math.PI : 0, r = 1.4; return { p: [Math.cos(a + s) * r + gauss() * 0.05, y, Math.sin(a + s) * r + gauss() * 0.05], c: i % 2 ? C.cyan : C.green, g: 5 - k, ph: t }; }
    const u = rand(-1.4, 1.4);
    return { p: [Math.cos(a) * u, y, Math.sin(a) * u], c: C.white, g: 5 - k, ph: t };
  }),
  // 踩坑：碎片
  shards: () => {
    const centers = Array.from({ length: 28 }, () => onSphere(rand(2, 4.2)));
    return build((i) => {
      const c = centers[i % centers.length], b = [gauss() * 0.3, gauss() * 0.06, gauss() * 0.3];
      return { p: [c[0] + b[0], c[1] + b[1], c[2] + b[2]], c: i % 5 === 0 ? C.red : C.amber, g: i % 6 };
    });
  },
};

// ---------- 着色器 ----------
const vert = /* glsl */ `
  attribute vec3 aColor; attribute float aGroup; attribute float aPhase; attribute float aSeed;
  uniform float uTime, uHighlight, uFlow, uPixel, uSize;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float tw = 0.65 + 0.35 * sin(uTime * 2.0 + aSeed * 40.0);
    float hl = (uHighlight >= 0.0) ? (abs(aGroup - uHighlight) < 0.5 ? 1.9 : 0.35) : 1.0;
    float flow = 1.0 + uFlow * 2.2 * pow(max(0.0, sin((aPhase - uTime * 0.18) * 6.2831)), 18.0);
    vColor = aColor * hl * flow;
    vAlpha = tw * min(1.0, hl);
    gl_PointSize = uSize * uPixel * (0.6 + aSeed * 0.8) * (flow > 1.5 ? 1.6 : 1.0) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const frag = /* glsl */ `
  uniform float uDim;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * uDim, a * a * vAlpha * uDim);
  }`;

export function createScene(canvas) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  const dpr = Math.min(devicePixelRatio, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x04060a, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04060a, 0.045);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0.4, 10);

  const rig = new THREE.Group(); // 整体偏移，给左侧正文让位
  scene.add(rig);

  // 粒子
  const geo = new THREE.BufferGeometry();
  const start = FORMATIONS.core();
  const cur = { pos: start.pos.slice(), col: start.col.slice() };
  let target = start;
  const seed = new Float32Array(N).map(() => Math.random());
  const delay = new Float32Array(N).map(() => 0.02 + Math.random() * 0.06);
  geo.setAttribute('position', new THREE.BufferAttribute(cur.pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aColor', new THREE.BufferAttribute(cur.col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aGroup', new THREE.BufferAttribute(start.group.slice(), 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(start.phase.slice(), 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const uniforms = {
    uTime: { value: 0 }, uHighlight: { value: -1 }, uFlow: { value: 0 },
    uPixel: { value: dpr }, uSize: { value: 42 }, uDim: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, uniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  rig.add(points);

  // 内核线框（只在 core / orbit 显示）
  const coreMesh = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.15, 1)),
    new THREE.LineBasicMaterial({ color: 0x3df2ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })
  );
  rig.add(coreMesh);

  // 地平线网格
  const grid = new THREE.GridHelper(80, 80, 0x0e3a44, 0x0a2028);
  grid.position.y = -4.6;
  grid.material.transparent = true; grid.material.opacity = 0.5;
  scene.add(grid);

  // 后期辉光
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.55, 0.12);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // 状态
  let formation = 'core', coreVis = 1, coreTarget = 1, offsetX = 0, mouse = { x: 0, y: 0 }, scrollSpin = 0;
  // 舞台 / 阅读：章头亮，正文压暗；baseBloom 随屏宽，dim 平滑过渡
  let dim = 1, dimTarget = 1, baseBloom = 0.9, flowBase = 0, flowBoost = 0;

  function setFormation(name) {
    if (!FORMATIONS[name] || name === formation) return;
    formation = name;
    target = FORMATIONS[name]();
    geo.attributes.aGroup.array.set(target.group); geo.attributes.aGroup.needsUpdate = true;
    geo.attributes.aPhase.array.set(target.phase); geo.attributes.aPhase.needsUpdate = true;
    flowBase = ['ring', 'helix', 'triad', 'lattice', 'layers', 'bridge'].includes(name) ? 1 : 0;
    uniforms.uFlow.value = Math.max(flowBase, flowBoost);
    uniforms.uHighlight.value = -1;
    coreTarget = name === 'core' || name === 'orbit' ? 1 : 0;
  }
  const highlight = (g) => { uniforms.uHighlight.value = g ?? -1; };
  const setFocus = (mode) => { dimTarget = mode === 'read' ? 0.28 : 1; };
  const setFlow = (on) => { flowBoost = on ? 1 : 0; uniforms.uFlow.value = Math.max(flowBase, flowBoost); };

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    bloom.resolution.set(w, h);
    camera.aspect = w / h;
    camera.position.z = w < 760 ? 13.5 : 10;
    camera.updateProjectionMatrix();
    offsetX = w >= 1100 ? 3.2 : w >= 760 ? 2.2 : 0;
    baseBloom = w < 760 ? 0.5 : 0.9; // 窄屏粒子在正文背后，降低辉光保可读性
  }
  addEventListener('resize', resize); resize();
  addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });

  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) loop(); });

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    uniforms.uTime.value = t;
    // 逐点插值变形
    const P = cur.pos, Q = target.pos, A = cur.col, B = target.col;
    for (let i = 0; i < N; i++) {
      const k = delay[i] * dt * 60, j = i * 3;
      P[j] += (Q[j] - P[j]) * k; P[j + 1] += (Q[j + 1] - P[j + 1]) * k; P[j + 2] += (Q[j + 2] - P[j + 2]) * k;
      A[j] += (B[j] - A[j]) * k; A[j + 1] += (B[j + 1] - A[j + 1]) * k; A[j + 2] += (B[j + 2] - A[j + 2]) * k;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.aColor.needsUpdate = true;

    const spin = reduced ? 0.02 : 0.08;
    points.rotation.y += dt * spin * (formation === 'ring' ? 0 : 1);
    points.rotation.z = formation === 'ring' ? points.rotation.z + dt * 0.05 : points.rotation.z * 0.95;
    coreVis += (coreTarget - coreVis) * 0.05;
    dim += (dimTarget - dim) * 0.06;
    uniforms.uDim.value = dim;
    bloom.strength = baseBloom * (0.3 + 0.7 * dim);
    grid.material.opacity = 0.5 * (0.35 + 0.65 * dim);
    coreMesh.material.opacity = 0.55 * coreVis * dim;
    coreMesh.scale.setScalar(0.6 + 0.4 * coreVis + Math.sin(t * 2) * 0.02);
    coreMesh.rotation.x += dt * 0.3; coreMesh.rotation.y += dt * 0.45;

    rig.position.x += (offsetX - rig.position.x) * 0.05;
    rig.rotation.x += (mouse.y * 0.35 + scrollSpin - rig.rotation.x) * 0.04;
    rig.rotation.y += (mouse.x * 0.6 - rig.rotation.y) * 0.04;
    grid.position.z = (t * 0.6) % 1;
    composer.render();
  }
  loop();

  return { setFormation, highlight, setFocus, setFlow, setScroll: (p) => { scrollSpin = (p - 0.5) * 0.25; } };
}
