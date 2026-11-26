// すうじであそぼ — 本体
(() => {
'use strict';

// ===== 設定（ここをいじれば遊び方が変わる） =====
const CFG = {
  bigEvery: 5,                              // 何問できたら花・星が散るか
  writeOrder: [1,2,3,4,5,6,7,8,9,10,0],     // 「かく」の順番
  writeCover: 0.8,                          // お手本の何割をなぞれたら合格か
  writeRadius: 32,                          // なぞれたとみなす距離（お手本の座標で）
  writeStray: 0.65,                         // 書いた線の何割がお手本の近くにあればよいか
  orderCount: 5,                            // 「じゅんばん」で並べる数
  maxNum: 10,
};

const $ = s => document.querySelector(s);
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const CARD_COLORS = [['#a77bff','#dccbff'], ['#4fa3f2','#c4e2ff'], ['#ff6fb8','#ffcde7'], ['#2fbf98','#c3f0e2'], ['#f39a2b','#ffe2b8']];
const paint = (el, i) => { const [c, c2] = CARD_COLORS[i % CARD_COLORS.length]; el.style.setProperty('--c', c); el.style.setProperty('--c2', c2); };

// ===== 音 =====
// iPhone/iPad はマナーモードだと Web Audio の音が消えるので「再生アプリ」扱いにする（iOS 17 以降）
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
let AC = null;
function ac() {
  if (!AC) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { AC = new C(); } catch (e) { return null; }
  }
  if (AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
  return AC;
}
// iOS は最初のタッチで音を「解錠」する必要がある
let unlocked = false;
function unlock() {
  const a = ac(); if (!a || unlocked) return;
  unlocked = true;
  try { const s = a.createBufferSource(); s.buffer = a.createBuffer(1, 1, 22050); s.connect(a.destination); s.start(0); } catch (e) {}
}
['pointerdown', 'touchend', 'keydown'].forEach(t => document.addEventListener(t, unlock, { capture: true }));

// 声（voices.js に mp3 を埋め込んである）を先に展開しておく。押した瞬間に鳴らすため。
const BUFS = {};
function trimSilence(a, buf) {
  // 録音の前後の無音を詰める（つなげて読んだときに間延びしないように）
  try {
    const d = buf.getChannelData(0), sr = buf.sampleRate, TH = 0.01;
    let s = 0, e = d.length - 1;
    while (s < d.length && Math.abs(d[s]) < TH) s++;
    while (e > s && Math.abs(d[e]) < TH) e--;
    if (e <= s) return buf;
    s = Math.max(0, s - Math.round(sr * 0.03));
    e = Math.min(d.length, e + Math.round(sr * 0.15));
    const out = a.createBuffer(buf.numberOfChannels, e - s, sr);
    for (let c = 0; c < buf.numberOfChannels; c++) out.copyToChannel(buf.getChannelData(c).subarray(s, e), c);
    return out;
  } catch (e) { return buf; }
}
function initVoices() {
  const a = ac(), V = window.VOICEDATA;
  if (!a || !V) return;
  Object.keys(V).forEach(k => {
    let bytes;
    try { const bin = atob(V[k]); bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); }
    catch (e) { return; }
    let done = false;
    const ok = b => { if (done || !b) return; done = true; BUFS[k] = trimSilence(a, b); };
    try { const p = a.decodeAudioData(bytes.buffer, ok, () => {}); if (p && p.then) p.then(ok).catch(() => {}); } catch (e) {}
  });
}
window.__voiceReady = () => Object.keys(BUFS).length;   // 動作確認用

let curSrc = null, speakToken = 0;
function stopSpeak() {
  speakToken++;
  if (curSrc) { try { curSrc.onended = null; curSrc.stop(0); } catch (e) {} curSrc = null; }
}
// ↑ stopSpeak 後は speakToken が変わるので、保険のタイマーが動いても step() はすぐ終わる
// 言葉を順番に鳴らす。opts: { delay, onStep(name,i), onDone() }
function speak(names, opts = {}) {
  if (typeof opts === 'number') opts = { delay: opts };
  const { delay = 0, onStep, onDone } = opts;
  stopSpeak();
  const my = speakToken;
  const list = names.filter(n => n !== null && n !== undefined && n !== '').map(String);
  let i = -1, wait = 0;
  const step = () => {
    if (my !== speakToken) return;
    if (!list.length) { curSrc = null; if (onDone) onDone(); return; }
    const n = list[0];
    const a = ac(), b = BUFS[n];
    if (!b && window.VOICEDATA && window.VOICEDATA[n] && wait < 12) { wait++; setTimeout(step, 150); return; } // まだ展開中
    list.shift(); i++; wait = 0;
    if (onStep) { try { onStep(n, i); } catch (e) {} }
    if (!a || !b) { setTimeout(step, 120); return; }
    const s = a.createBufferSource();
    s.buffer = b; s.connect(a.destination);
    // 音が止められている（マナーモード・解錠前など）と終わりの合図が来ないので、時間が来たら次へ進む保険
    let fin = false;
    const next = () => { if (fin) return; fin = true; clearTimeout(wd); if (curSrc === s) curSrc = null; step(); };
    const wd = setTimeout(next, b.duration * 1000 + 500);
    s.onended = next;
    curSrc = s;
    try { s.start(0); } catch (e) { next(); }
  };
  if (delay > 0) setTimeout(() => { if (my === speakToken) step(); }, delay);
  else step();
}

// 効果音（その場で合成）
function tone(freq, t0, dur, type = 'sine', vol = 0.14) {
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination);
  o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  pop()     { tone(880, 0, .12, 'sine', .12); tone(1320, .04, .1, 'sine', .06); },
  ok()      { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * .07, .35, 'triangle', .11)); },
  oops()    { tone(392, 0, .16, 'sine', .11); tone(311, .14, .26, 'sine', .11); },
  fanfare() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * .11, .42, 'triangle', .12)); },
  twinkle() { for (let i = 0; i < 5; i++) tone(1400 + rnd(1400), i * .05, .16, 'sine', .04); },
};

// ===== ごほうび（花・星が散る） =====
const FX = {
  parts: [], running: false,
  init() { this.cv = $('#fx'); this.ctx = this.cv.getContext('2d'); this.size(); addEventListener('resize', () => this.size()); },
  size() { this.d = Math.min(devicePixelRatio || 1, 2); this.cv.width = innerWidth * this.d; this.cv.height = innerHeight * this.d; },
  add(p) {
    this.parts.push(p);
    if (!this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame(t => this.loop(t)); }
  },
  loop(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
    const c = this.ctx;
    c.setTransform(this.d, 0, 0, this.d, 0, 0);
    c.clearRect(0, 0, innerWidth, innerHeight);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    this.parts = this.parts.filter(p => {
      p.life -= dt;
      if (p.life <= 0 || p.y > innerHeight + 80) return false;
      p.vy += p.g * dt; p.vx *= p.drag || 1;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.sway) { p.t = (p.t || 0) + dt; p.x += Math.sin(p.t * p.sway) * 0.8; }
      c.save();
      c.globalAlpha = Math.min(1, p.life / 0.5);
      c.translate(p.x, p.y); c.rotate(p.rot);
      c.font = `${p.size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      c.fillText(p.ch, 0, 0);
      c.restore();
      return true;
    });
    if (this.parts.length) requestAnimationFrame(tt => this.loop(tt));
    else { this.running = false; c.clearRect(0, 0, innerWidth, innerHeight); }
  },
};
function burst(x = innerWidth / 2, y = innerHeight / 2, n = 16) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 160 + Math.random() * 280;
    FX.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, g: 520, drag: .985, rot: 0, vr: (Math.random() - .5) * 6,
             life: .9 + Math.random() * .5, size: 22 + rnd(18), ch: pick(['✨', '⭐', '💖', '💜', '🌟']) });
  }
}
function celebrate() {
  sfx.fanfare();
  const chars = ['🌸', '⭐', '💖', '🌷', '✨', '💜', '🌟', '🦄', '🌈', '🎀', '💐', '🩷'];
  for (let i = 0; i < 90; i++) {
    FX.add({ x: Math.random() * innerWidth, y: -40 - Math.random() * innerHeight * .9,
             vx: (Math.random() - .5) * 60, vy: 110 + Math.random() * 170, g: 25,
             rot: Math.random() * 6, vr: (Math.random() - .5) * 3, sway: 2 + Math.random() * 3,
             life: 6, size: 28 + rnd(26), ch: pick(chars) });
  }
  // 左右の下からも、ぽーんと吹き上がる
  [0.08, 0.92].forEach(fx => {
    for (let i = 0; i < 22; i++) {
      const a = -Math.PI / 2 + (fx < .5 ? .35 : -.35) + (Math.random() - .5) * .7, s = 520 + Math.random() * 380;
      FX.add({ x: innerWidth * fx, y: innerHeight + 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 600, rot: 0,
               vr: (Math.random() - .5) * 8, life: 3, size: 26 + rnd(20), ch: pick(chars) });
    }
  });
  const ct = $('#cheerText');
  ct.textContent = pick(['🌸 はなまる 🌸', '⭐ すごーい ⭐', '💖 かんぺき 💖', '🦄 やったね 🦄']);
  const ch = $('#cheer'); ch.classList.remove('on'); void ch.offsetWidth; ch.classList.add('on');
  clearTimeout(celebrate.tm); celebrate.tm = setTimeout(() => ch.classList.remove('on'), 2700);
}

// ===== 星とハート =====
let stars = +(localStorage.getItem('suuji.stars') || 0), streak = 0, lastPraise = -1;
const PRAISE = ['yatta', 'yatta1', 'yatta2', 'yatta3', 'yatta5', 'yatta6'];
function praiseKey() { let i; do { i = rnd(PRAISE.length); } while (i === lastPraise); lastPraise = i; return PRAISE[i]; }
function hud() {
  $('#starNum').textContent = stars; $('#homeStarNum').textContent = stars;
  const k = streak % CFG.bigEvery, full = streak > 0 && k === 0;
  $('#hearts').innerHTML = Array.from({ length: CFG.bigEvery }, (_, i) =>
    `<span class="h ${(full || i < k) ? 'on' : ''}">💜</span>`).join('');
}
// せいかい。then は次の問題へ進む関数（画面が変わっていたら呼ばない）
function good(then, at) {
  const s = sess;
  const next = () => { if (s === sess && then) then(); };
  stars++; streak++;
  try { localStorage.setItem('suuji.stars', stars); } catch (e) {}
  hud(); sfx.ok();
  if (at) burst(at.x, at.y); else burst();
  if (streak % CFG.bigEvery === 0) {
    setTimeout(() => { if (s !== sess) return; celebrate(); speak(['yatta4', praiseKey()], { delay: 400, onDone: () => setTimeout(next, 900) }); }, 300);
    setTimeout(hud, 3200);
  } else {
    speak([praiseKey()], { delay: 280, onDone: () => setTimeout(next, 450) });
  }
}
function oops(el) {
  sfx.oops();
  if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  speak(['p_oshii'], 200);
}
const centerOf = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

// ===== 共通の部品 =====
function fitCanvas(cv) {
  const r = cv.parentElement.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
  cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
  return { w: r.width, h: r.height, dpr };
}
function bindPointer(cv, h) {
  let id = null;
  const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener('pointerdown', e => {
    if (id !== null) return;
    id = e.pointerId; try { cv.setPointerCapture(id); } catch (_) {}
    e.preventDefault(); h.down(pos(e));
  });
  cv.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    (list.length ? list : [e]).forEach(ev => h.move(pos(ev)));
  });
  const end = e => { if (e.pointerId !== id) return; id = null; h.up(); };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}
function samplePath(d, step = 6) {
  const p = $('#mpath'); p.setAttribute('d', d);
  const len = p.getTotalLength(), pts = [];
  for (let l = 0; l <= len; l += step) { const q = p.getPointAtLength(l); pts.push({ x: q.x, y: q.y }); }
  const q = p.getPointAtLength(len); pts.push({ x: q.x, y: q.y });
  return pts;
}
function numCard(v, i, cls = 'num') {
  const b = document.createElement('button');
  b.className = cls; b.textContent = v; b.dataset.v = v; paint(b, i);
  return b;
}
function newNum(last, min = 0, max = CFG.maxNum) {
  let n; do { n = min + rnd(max - min + 1); } while (n === last && max > min);
  return n;
}
function choicesFor(ans, count = 3, min = 0, max = CFG.maxNum) {
  const s = new Set([ans]);
  // 近い数をまぜると「よく見る」練習になる
  while (s.size < count) {
    const d = (rnd(3) + 1) * (Math.random() < .5 ? -1 : 1), v = ans + d;
    s.add(v >= min && v <= max ? v : min + rnd(max - min + 1));
  }
  return shuffle([...s]);
}

// ===== 1. かく =====
const WRITE = {
  i: 0,
  start() {
    $('#stage').innerHTML =
      `<div class="board"><canvas></canvas></div>
       <div class="nav"><button class="navb" data-a="prev">◀</button><button class="navb" data-a="again">↺</button><button class="navb" data-a="next">▶</button></div>`;
    this.cv = $('#stage canvas'); this.ctx = this.cv.getContext('2d');
    $('#stage .nav').onclick = e => {
      const a = e.target.closest('button'); if (!a) return;
      sfx.pop();
      if (a.dataset.a === 'prev') this.go(-1);
      else if (a.dataset.a === 'next') this.go(1);
      else { this.ink = []; this.done = false; this.demo(); this.say(); }
    };
    bindPointer(this.cv, {
      down: p => { if (this.done) return; this.demoT = null; this.cur = [this.toD(p)]; this.ink.push(this.cur); this.draw(); },
      move: p => {
        if (!this.cur) return;
        const q = this.toD(p), l = this.cur[this.cur.length - 1];
        if ((q.x - l.x) ** 2 + (q.y - l.y) ** 2 > 9) { this.cur.push(q); this.draw(); }
      },
      up: () => { if (!this.cur) return; this.cur = null; this.check(); },
    });
    this.load(true);
  },
  go(d) { const L = CFG.writeOrder.length; this.i = (this.i + d + L) % L; this.load(); },
  load(intro) {
    this.n = CFG.writeOrder[this.i];
    this.dg = window.DIGITS[String(this.n)];
    this.guides = this.dg.s.map(d => samplePath(d));
    this.ink = []; this.cur = null; this.done = false;
    $('#badge').textContent = this.n;
    this.resize(); this.demo(); this.say(intro);
  },
  say(intro) { speak([...(intro ? ['m_kaku'] : []), String(this.n), 'p_kaku']); },
  resize() {
    if (!this.cv) return;
    const { w, h, dpr } = fitCanvas(this.cv);
    const m = 30, sc = Math.min(w / (this.dg.w + m * 2), h / (this.dg.h + m * 2));
    this.view = { dpr, sc, ox: (w - this.dg.w * sc) / 2, oy: (h - this.dg.h * sc) / 2, w, h };
    this.draw();
  },
  toD(p) { const v = this.view; return { x: (p.x - v.ox) / v.sc, y: (p.y - v.oy) / v.sc }; },
  line(pts) { const c = this.ctx; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); if (pts.length === 1) c.lineTo(pts[0].x + .1, pts[0].y); c.stroke(); },
  // 書き順のお手本：ピンクの星が線の上を動く
  demo() {
    this.demoT = performance.now();
    const tick = () => { if (this.demoT == null || mode !== 'write') return; this.draw(); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  },
  draw() {
    const c = this.ctx, v = this.view; if (!c || !v) return;
    c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    c.clearRect(0, 0, v.w, v.h);
    c.save(); c.translate(v.ox, v.oy); c.scale(v.sc, v.sc);
    c.lineCap = 'round'; c.lineJoin = 'round';
    // お手本の太い帯
    c.strokeStyle = this.done ? '#ffe0f1' : '#efe7ff'; c.lineWidth = 54;
    this.guides.forEach(g => this.line(g));
    c.setLineDash([1, 14]); c.strokeStyle = '#c9b3f5'; c.lineWidth = 5;
    this.guides.forEach(g => this.line(g));
    c.setLineDash([]);
    // 書きはじめの印（1、2…）
    const marks = [];
    this.guides.forEach((g, k) => {
      let { x, y } = g[0];
      if (marks.some(m => (m.x - x) ** 2 + (m.y - y) ** 2 < 900)) { x -= 34; }
      marks.push({ x, y });
      c.fillStyle = '#ff8fcf'; c.beginPath(); c.arc(x, y, 17, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(k + 1), x, y + 1);
    });
    // 子どもが書いた線
    const grad = c.createLinearGradient(0, 0, this.dg.w, this.dg.h);
    grad.addColorStop(0, '#b07aff'); grad.addColorStop(1, '#ff7cc0');
    c.strokeStyle = this.done ? '#ff7cc0' : grad; c.lineWidth = 26;
    this.ink.forEach(s => this.line(s));
    // お手本の星
    if (this.demoT != null) {
      const per = 1100, t = performance.now() - this.demoT, k = Math.floor(t / per);
      if (k >= this.guides.length) this.demoT = null;
      else {
        const g = this.guides[k], f = (t % per) / per, p = g[Math.min(g.length - 1, Math.floor(f * g.length))];
        c.font = '40px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('⭐', p.x, p.y);
      }
    }
    c.restore();
  },
  check() {
    const all = this.ink.flat(); if (all.length < 4) return;
    const R2 = CFG.writeRadius ** 2, F2 = (CFG.writeRadius * 1.7) ** 2;
    let cov = 0, tot = 0;
    this.guides.forEach(g => g.forEach(p => { tot++; if (all.some(q => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < R2)) cov++; }));
    const gp = this.guides.flat();
    const near = all.filter(q => gp.some(p => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < F2)).length;
    if (cov / tot >= CFG.writeCover && near / all.length >= CFG.writeStray) {
      this.done = true; this.draw();
      const r = this.cv.getBoundingClientRect();
      good(() => this.go(1), { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    } else if (this.ink.length >= this.guides.length + 3) {
      // たくさん書いてもうまくいかないときは、消してもう一回
      oops();
      const s = sess;
      setTimeout(() => { if (s === sess && !this.done) { this.ink = []; this.draw(); } }, 700);
    }
  },
};

// ===== 2. えらぶ =====
const QUIZ = {
  start() { this.last = -1; this.q(true); },
  q(intro) {
    this.ans = newNum(this.last); this.last = this.ans; this.lock = false;
    $('#badge').textContent = '';
    $('#stage').innerHTML = `<div class="ask">🔊 <span class="big">？</span> は どれかな</div><div class="choices"></div>`;
    const box = $('#stage .choices');
    choicesFor(this.ans, 3).forEach((v, i) => box.appendChild(numCard(v, i)));
    box.onclick = e => {
      const b = e.target.closest('.num'); if (!b || this.lock) return;
      if (+b.dataset.v === this.ans) { this.lock = true; b.classList.add('right'); good(() => this.q(), centerOf(b)); }
      else oops(b);
    };
    this.say(intro);
  },
  say(intro) { speak([...(intro ? ['m_erabu'] : []), String(this.ans), 'p_dore']); },
};

// ===== 3. おみせ =====
const GOODS = [{ k: 'it_ringo', e: '🍎' }, { k: 'it_ichigo', e: '🍓' }, { k: 'it_mikan', e: '🍊' }, { k: 'it_cookie', e: '🍪' }];
const SHOP = {
  start() { this.last = 0; this.q(true); },
  q(intro) {
    this.g = pick(GOODS); this.want = newNum(this.last, 1, CFG.maxNum); this.last = this.want; this.got = 0; this.lock = false;
    $('#badge').textContent = this.want;
    $('#stage').innerHTML =
      `<div class="ask">${this.g.e} を <span class="big">${this.want}</span> こ</div>
       <div class="shop">
         <div class="shelf"><div class="label">おみせ</div></div>
         <div class="shopSide"><div class="count">0</div><button class="go">できた</button></div>
         <div class="basket"><div class="label">かご</div></div>
       </div>`;
    const shelf = $('#stage .shelf'), basket = $('#stage .basket');
    for (let i = 0; i < 10; i++) {
      const b = document.createElement('button'); b.className = 'item'; b.textContent = this.g.e; b.dataset.i = i;
      shelf.appendChild(b);
    }
    shelf.onclick = e => {
      const b = e.target.closest('.item'); if (!b || this.lock || b.classList.contains('gone')) return;
      b.classList.add('gone'); sfx.pop();
      const c = document.createElement('button'); c.className = 'item'; c.textContent = this.g.e; c.dataset.i = b.dataset.i;
      basket.appendChild(c);
      this.got++; this.showCount(); speak([String(this.got)]);
    };
    basket.onclick = e => {
      const c = e.target.closest('.item'); if (!c || this.lock) return;
      shelf.querySelector(`.item[data-i="${c.dataset.i}"]`).classList.remove('gone');
      c.remove(); sfx.pop(); this.got--; this.showCount();
    };
    $('#stage .go').onclick = () => {
      if (this.lock) return;
      if (this.got === this.want) { this.lock = true; good(() => this.q(), centerOf(basket)); }
      else { this.lock = true; sfx.oops(); const s = sess;
        speak([this.got > this.want ? 'g_ooi' : 'g_sukunai', 'g_chigau'], { delay: 150, onDone: () => { if (s === sess) this.lock = false; } }); }
    };
    this.say(intro);
  },
  showCount() { $('#stage .count').textContent = this.got; },
  say(intro) { speak([...(intro ? ['m_omise'] : []), this.g.k, 'ko' + this.want, 'g_kago']); },
};

// ===== 4. くらべる =====
const DOT_ICONS = ['⭐', '🌸', '💜', '🍓', '🦋', '🎀'];
const COMPARE = {
  start() { this.q(true); },
  q(intro) {
    const a = 1 + rnd(CFG.maxNum); let b; do { b = 1 + rnd(CFG.maxNum); } while (b === a);
    this.kind = Math.random() < .5 ? 'big' : 'small'; this.ans = this.kind === 'big' ? Math.max(a, b) : Math.min(a, b); this.lock = false;
    $('#badge').textContent = '';
    $('#stage').innerHTML = `<div class="ask">${this.kind === 'big' ? '🐘 おおきいのは どっち？' : '🐭 ちいさいのは どっち？'}</div><div class="cmp"></div>`;
    const box = $('#stage .cmp'), icon = pick(DOT_ICONS);
    [a, b].forEach((v, i) => {
      const c = document.createElement('button'); c.className = 'ccard'; c.dataset.v = v; paint(c, i ? 2 : 0);
      c.innerHTML = `<div class="n">${v}</div><div class="dots">${icon.repeat(v)}</div>`;
      box.appendChild(c);
    });
    box.onclick = e => {
      const c = e.target.closest('.ccard'); if (!c || this.lock) return;
      if (+c.dataset.v === this.ans) { this.lock = true; c.classList.add('right'); good(() => this.q(), centerOf(c)); }
      else oops(c);
    };
    this.say(intro);
  },
  say(intro) { speak([...(intro ? ['m_kurabu'] : []), this.kind === 'big' ? 'q_ookii' : 'q_chiisai']); },
};

// ===== 5. じゅんばん =====
const ORDER = {
  start() { this.q(true); },
  q(intro) {
    const pool = shuffle(Array.from({ length: CFG.maxNum + 1 }, (_, i) => i)).slice(0, CFG.orderCount);
    this.dir = Math.random() < .5 ? 'asc' : 'desc';
    this.seq = pool.slice().sort((x, y) => this.dir === 'asc' ? x - y : y - x);
    this.pos = 0; this.lock = false;
    $('#badge').textContent = '';
    $('#stage').innerHTML =
      `<div class="ask">${this.dir === 'asc' ? '🐭 ちいさい じゅんに タッチ' : '🐘 おおきい じゅんに タッチ'}</div>
       <div class="slots">${this.seq.map(() => '<div class="slot"></div>').join('')}</div>
       <div class="choices"></div>`;
    const box = $('#stage .choices');
    shuffle(pool).forEach((v, i) => box.appendChild(numCard(v, i, 'num small')));
    box.onclick = e => {
      const b = e.target.closest('.num'); if (!b || this.lock || b.classList.contains('done')) return;
      const v = +b.dataset.v;
      if (v === this.seq[this.pos]) {
        b.classList.add('done');
        const slot = $('#stage .slots').children[this.pos]; slot.textContent = v; slot.classList.add('fill');
        this.pos++; sfx.twinkle();
        if (this.pos === this.seq.length) {
          this.lock = true;
          const s = sess;
          speak([String(v)], { onDone: () => { if (s === sess) good(() => this.q(), centerOf($('#stage .slots'))); } });
        } else speak([String(v)]);
      } else oops(b);
    };
    this.say(intro);
  },
  say(intro) { speak([...(intro ? ['m_junban'] : []), this.dir === 'asc' ? 'q_chiisaijun' : 'q_ookiijun']); },
};

// ===== 6. なんこかな =====
const NK_ICONS = ['🦄', '🌈', '⭐', '🍭', '🎀', '🧁', '🌷', '🦋', '🐰', '🍓'];
const NANKO = {
  start() { this.last = 0; this.q(true); },
  q(intro) {
    this.n = newNum(this.last, 1, CFG.maxNum); this.last = this.n; this.counted = 0; this.lock = false;
    $('#badge').textContent = '';
    $('#stage').innerHTML = `<div class="field"></div><div class="choices row"></div>`;
    const f = $('#stage .field'), icon = pick(NK_ICONS);
    for (let i = 0; i < this.n; i++) {
      const b = document.createElement('button'); b.className = 'nk'; b.textContent = icon;
      b.style.transform = `rotate(${rnd(30) - 15}deg) translateY(${rnd(16) - 8}px)`;
      f.appendChild(b);
    }
    // 1つずつタッチして数えられる
    f.onclick = e => {
      const b = e.target.closest('.nk'); if (!b || b.classList.contains('counted')) return;
      this.counted++; b.dataset.n = this.counted; b.classList.add('counted'); sfx.pop();
      speak([String(this.counted)]);
    };
    const box = $('#stage .choices');
    choicesFor(this.n, 3, 1, CFG.maxNum).forEach((v, i) => box.appendChild(numCard(v, i, 'num small')));
    box.onclick = e => {
      const b = e.target.closest('.num'); if (!b || this.lock) return;
      if (+b.dataset.v === this.n) { this.lock = true; b.classList.add('right'); good(() => this.q(), centerOf(b)); }
      else oops(b);
    };
    this.say(intro);
  },
  say(intro) { speak([...(intro ? ['m_nanko'] : []), 'p_ikutsu']); },
};

// ===== 7. おえかき =====
const COLORS = [
  { k: 'c_aka', hex: '#ff6b81' }, { k: 'c_pink', hex: '#ff9fd2' }, { k: 'c_orange', hex: '#ffa94d' },
  { k: 'c_kiiro', hex: '#ffe066' }, { k: 'c_midori', hex: '#69db7c' }, { k: 'c_mizuiro', hex: '#74c0fc' },
  { k: 'c_murasaki', hex: '#b197fc' }, { k: 'c_chairo', hex: '#b08968' }, { k: 'c_kuro', hex: '#495057' },
];
const SIZES = [{ k: 'hosoi', w: 6, d: 8 }, { k: 'futsuu', w: 14, d: 14 }, { k: 'futoi', w: 28, d: 22 }];
const DRAW = {
  color: COLORS[6].hex, size: 1, eraser: false,
  start() { this.menu(true); },
  menu(intro) {
    this.sub = null; $('#badge').textContent = '';
    $('#stage').innerHTML =
      `<div class="dmenu">
         <button class="hcard" data-d="free" style="--c:#c9b4ff"><span class="hi">🖌️</span><span class="hl">じゆうに かく</span></button>
         <button class="hcard" data-d="nurie" style="--c:#a9d8ff"><span class="hi">🖍️</span><span class="hl">ぬりえ</span></button>
       </div>`;
    $('#stage .dmenu').onclick = e => {
      const b = e.target.closest('.hcard'); if (!b) return;
      sfx.pop();
      if (b.dataset.d === 'free') this.free(); else this.grid();
    };
    if (intro) speak(['m_oekaki']);
  },
  back() { // ↩ ボタン：ひとつ前の画面へ
    if (this.sub === 'pic') this.grid(true);
    else if (this.sub) this.menu();
    else return false;
    return true;
  },
  tools(withSize) {
    return `<div class="tools">
      ${COLORS.map((c, i) => `<button class="sw" data-c="${i}" style="--c:${c.hex}" aria-label="${c.k}"></button>`).join('')}
      <span class="sep"></span>
      ${withSize ? SIZES.map((s, i) => `<button class="tb sz" data-s="${i}"><i style="width:${s.d}px;height:${s.d}px"></i></button>`).join('') : ''}
      <button class="tb er" aria-label="けしごむ">🧽</button>
      ${withSize ? '<button class="tb clr" aria-label="ぜんぶけす">🗑️</button>' : ''}
      <button class="tb bk" aria-label="もどる">↩️</button>
    </div>`;
  },
  bindTools(onClear) {
    const t = $('#stage .tools');
    const sync = () => {
      t.querySelectorAll('.sw').forEach(b => b.classList.toggle('on', !this.eraser && COLORS[b.dataset.c].hex === this.color));
      t.querySelectorAll('.sz').forEach(b => b.classList.toggle('on', +b.dataset.s === this.size));
      t.querySelector('.er').classList.toggle('on', this.eraser);
    };
    t.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('sw')) { const c = COLORS[b.dataset.c]; this.color = c.hex; this.eraser = false; speak([c.k]); }
      else if (b.classList.contains('sz')) { this.size = +b.dataset.s; this.eraser = false; speak([SIZES[this.size].k]); }
      else if (b.classList.contains('er')) { this.eraser = true; speak(['keshigomu']); }
      else if (b.classList.contains('clr')) { sfx.twinkle(); onClear && onClear(); return; }
      else if (b.classList.contains('bk')) { sfx.pop(); this.back(); return; }
      sfx.pop(); sync();
    };
    sync();
  },
  // じゆうに かく
  free() {
    this.sub = 'free';
    $('#stage').innerHTML = `<div class="board"><canvas></canvas></div>${this.tools(true)}`;
    this.cv = $('#stage canvas'); this.ctx = this.cv.getContext('2d'); this.strokes = [];
    this.bindTools(() => { this.strokes = []; this.paintAll(); });
    bindPointer(this.cv, {
      down: p => { this.cur = { c: this.eraser ? '#ffffff' : this.color, w: this.eraser ? 40 : SIZES[this.size].w, pts: [p] }; this.strokes.push(this.cur); this.paintAll(); },
      move: p => { if (!this.cur) return; this.cur.pts.push(p); this.paintSeg(this.cur); },
      up: () => { this.cur = null; },
    });
    this.resize();
    speak(['m_jiyunikaku']);
  },
  paintSeg(s) {
    const c = this.ctx, n = s.pts.length; if (n < 2) return;
    c.strokeStyle = s.c; c.lineWidth = s.w; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(s.pts[n - 2].x, s.pts[n - 2].y); c.lineTo(s.pts[n - 1].x, s.pts[n - 1].y); c.stroke();
  },
  paintAll() {
    const c = this.ctx, v = this.view; if (!c || !v) return;
    c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    c.fillStyle = '#fff'; c.fillRect(0, 0, v.w, v.h);
    c.lineCap = 'round'; c.lineJoin = 'round';
    this.strokes.forEach(s => {
      c.strokeStyle = s.c; c.lineWidth = s.w; c.beginPath();
      s.pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
      if (s.pts.length === 1) c.lineTo(s.pts[0].x + .1, s.pts[0].y);
      c.stroke();
    });
  },
  // ぬりえ：絵をえらぶ
  grid(back) {
    this.sub = 'grid';
    $('#stage').innerHTML = `<div class="pgrid">${window.PICS.map((p, i) =>
      `<button class="pthumb" data-i="${i}"><svg class="pic" viewBox="0 0 200 200">${p.svg}</svg></button>`).join('')}</div>
      <div class="tools"><button class="tb bk" aria-label="もどる">↩️</button></div>`;
    $('#stage .pgrid').onclick = e => { const b = e.target.closest('.pthumb'); if (b) { sfx.pop(); this.pic(+b.dataset.i); } };
    $('#stage .bk').onclick = () => { sfx.pop(); this.menu(); };
    if (!back) speak(['m_nurie']);
  },
  // ぬりえ：色をぬる
  pic(i) {
    this.sub = 'pic';
    const p = window.PICS[i];
    $('#stage').innerHTML = `<div class="picwrap"><svg class="pic" viewBox="0 0 200 200">${p.svg}</svg></div>${this.tools(false)}`;
    this.bindTools();
    $('#stage .picwrap svg').addEventListener('click', e => {
      const r = e.target.closest('.r'); if (!r) return;
      r.style.fill = this.eraser ? '#fff' : this.color; sfx.pop();
    });
    speak([p.voice || p.k]);
  },
  resize() { if (this.sub === 'free' && this.cv) { this.view = fitCanvas(this.cv); this.paintAll(); } },
  say() { if (this.sub === 'free') speak(['m_jiyunikaku']); else if (this.sub) speak(['m_nurie']); else speak(['m_oekaki']); },
};

// ===== 画面の切り替え =====
const MODES = {
  write:   { t: 'かく',       i: '✏️', c: '#c9b4ff', m: WRITE },
  quiz:    { t: 'えらぶ',     i: '🔢', c: '#a9d8ff', m: QUIZ },
  shop:    { t: 'おみせ',     i: '🧺', c: '#ffb8dc', m: SHOP },
  compare: { t: 'くらべる',   i: '⚖️', c: '#ade9d6', m: COMPARE },
  order:   { t: 'じゅんばん', i: '🚃', c: '#ffe08a', m: ORDER },
  nanko:   { t: 'なんこかな', i: '🦄', c: '#d9b8ff', m: NANKO },
  draw:    { t: 'おえかき',   i: '🎨', c: '#9fdcf0', m: DRAW },
};
let mode = null, sess = 0;
function go(m) {
  stopSpeak(); sess++;
  mode = m || null;
  document.body.dataset.mode = mode || 'home';
  $('#stage').innerHTML = ''; $('#badge').textContent = '';
  hud();
  if (!mode) { speak(['g_nanishite']); return; }
  $('#modeIcon').textContent = MODES[mode].i; $('#modeTitle').textContent = MODES[mode].t;
  MODES[mode].m.start();
}

function buildHome() {
  $('#cards').innerHTML = Object.entries(MODES).map(([k, v], i) =>
    `<button class="hcard" data-mode="${k}" style="--c:${v.c};animation-delay:${i * 0.06}s"><span class="hi">${v.i}</span><span class="hl">${v.t}</span></button>`).join('');
  $('#cards').onclick = e => { const b = e.target.closest('.hcard'); if (b) { sfx.pop(); go(b.dataset.mode); } };
  $('#homeSpeak').onclick = () => speak(['g_nanishite']);
  $('#homeBtn').onclick = () => {
    sfx.pop();
    if (mode === 'draw' && DRAW.back()) return;   // おえかきの中では、ひとつ前へ
    go(null);
  };
  $('#sayBtn').onclick = () => { if (mode) MODES[mode].m.say(); };
}

let rt = 0;
addEventListener('resize', () => {
  clearTimeout(rt);
  rt = setTimeout(() => { if (mode === 'write') WRITE.resize(); else if (mode === 'draw') DRAW.resize(); }, 120);
});
// 画面に戻ってきたら音を復帰（iOS はバックグラウンドで止まるため）
document.addEventListener('visibilitychange', () => { if (!document.hidden && AC && AC.state !== 'running') { try { AC.resume(); } catch (e) {} } });

// 一度ひらけば、ネットが無くても動くようにする（sw.js がファイルを保存しておく）
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

FX.init();
buildHome();
initVoices();
hud();
window.__app = { go, get mode() { return mode; }, WRITE, QUIZ, SHOP, COMPARE, ORDER, NANKO, DRAW, celebrate, good };   // 動作確認用
})();
