/* =========================================================
   ANUSH BATHLA — CINEMATIC PORTFOLIO
   1. Gate (loader + "enter" click => music starts instantly)
   2. Intro timeline (photo reveal, text types step by step)
   3. Scroll-triggered motion (typing, curtains, counters, kinetic headings)
   ========================================================= */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer  = matchMedia('(hover:hover) and (pointer:fine)').matches;

let skipIntro = reduceMotion;
const sleep = ms => new Promise(r => setTimeout(r, skipIntro ? 0 : ms));

/* ---------- text splitting (keeps inner markup like <span>, <em>, <br>) ---------- */
function splitText(el, className) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const chars = [];
  nodes.forEach(node => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(tok => {
      if (!tok) return;
      if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
      const w = document.createElement('span');
      w.className = 'w';
      [...tok].forEach(ch => {
        const c = document.createElement('span');
        c.className = className;
        c.textContent = ch;
        w.appendChild(c);
        chars.push(c);
      });
      frag.appendChild(w);
    });
    node.replaceWith(frag);
  });
  el._chars = chars;
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  return chars;
}

/* ---------- typewriter: reveals characters one by one with a blinking caret ---------- */
function typeEl(el, msPerChar = 30) {
  return new Promise(resolve => {
    const chars = el._chars || splitText(el, 'ch');
    if (skipIntro || reduceMotion) {
      chars.forEach(c => { c.classList.add('on'); c.classList.remove('last'); });
      return resolve();
    }
    let shown = 0, prev = null;
    const t0 = performance.now();
    (function frame(now) {
      if (skipIntro) {
        chars.forEach(c => { c.classList.add('on'); c.classList.remove('last'); });
        return resolve();
      }
      const target = Math.min(chars.length, Math.floor((now - t0) / msPerChar) + 1);
      while (shown < target) {
        if (prev) prev.classList.remove('last');
        prev = chars[shown++];
        prev.classList.add('on', 'last');
      }
      if (shown >= chars.length) {
        setTimeout(() => prev && prev.classList.remove('last'), 700);
        return resolve();
      }
      requestAnimationFrame(frame);
    })(t0);
  });
}

/* prepare everything that types so there is no layout jump */
$$('[data-type],[data-intro-type]').forEach(el => splitText(el, 'ch'));
$$('[data-kinetic]').forEach(h => {
  const chars = splitText(h, 'k');
  chars.forEach((c, i) => c.style.transitionDelay = Math.min(i * 28, 900) + 'ms');
});
$$('.chips').forEach(group => $$('span', group).forEach((s, i) => s.style.setProperty('--c', i)));
$$('[data-count]').forEach(b => { b.textContent = fmtCount(0, b); });

/* ---------- music ---------- */
const audio       = $('#portfolio-audio');
const musicBtn    = $('#music-control');
const musicLabel  = $('.music-label', musicBtn);
const musicState  = $('.music-state', musicBtn);
let fadeTimer = null, wasPlayingBeforeHide = false;

function setMusicUI(playing) {
  musicBtn.classList.toggle('is-playing', playing);
  musicBtn.setAttribute('aria-pressed', String(playing));
  musicBtn.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
  musicLabel.textContent = playing ? 'NOW PLAYING' : 'PLAY MUSIC';
  musicState.textContent = playing ? 'Ⅱ' : '＋';
}
function fadeTo(target, step = .05) {
  clearInterval(fadeTimer);
  fadeTimer = setInterval(() => {
    const v = audio.volume, d = target - v;
    if (Math.abs(d) <= step) { audio.volume = target; clearInterval(fadeTimer); if (target === 0) audio.pause(); return; }
    audio.volume = Math.max(0, Math.min(1, v + Math.sign(d) * step));
  }, 90);
}
function playMusic() {
  audio.volume = 0;
  const p = audio.play();
  const ok = () => { setMusicUI(true); fadeTo(.85); };
  if (p && p.then) p.then(ok).catch(() => { setMusicUI(false); musicLabel.textContent = 'TAP FOR MUSIC'; });
  else ok();
}
function pauseMusic() { setMusicUI(false); fadeTo(0, .08); }
musicBtn.addEventListener('click', () => audio.paused ? playMusic() : pauseMusic());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { wasPlayingBeforeHide = !audio.paused; if (wasPlayingBeforeHide) audio.pause(); }
  else if (wasPlayingBeforeHide) { audio.play().catch(() => {}); }
});

/* ---------- 1. GATE ---------- */
const gate = $('#gate'), gateNum = $('#gate-num'), gateFill = $('#gate-fill');
const enterBtn = $('#gate-enter'), enterLabel = $('#gate-enter-label');

function whenLoaded() {
  const img = new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = 'assets/anush-profile.jpg'; });
  const aud = new Promise(r => {
    if (audio.readyState >= 3) return r();
    audio.addEventListener('canplaythrough', r, { once: true });
    audio.addEventListener('error', r, { once: true });
    audio.load();
  });
  const fonts = (document.fonts && document.fonts.ready) || Promise.resolve();
  const cap = new Promise(r => setTimeout(r, 4500));      // never trap the visitor
  return Promise.race([Promise.all([img, aud, fonts]), cap]);
}

(async function runLoader() {
  const t0 = performance.now(), minMs = reduceMotion ? 0 : 1800;
  let ready = false;
  whenLoaded().then(() => ready = true);
  await new Promise(done => {
    (function tick(now) {
      const t = Math.min(1, (now - t0) / minMs || 1);
      let pct = Math.round(t * (ready ? 100 : 92));
      gateNum.textContent = pct;
      gateFill.style.width = pct + '%';
      if (t >= 1 && ready) { gateNum.textContent = 100; gateFill.style.width = '100%'; return done(); }
      requestAnimationFrame(tick);
    })(t0);
  });
  enterBtn.disabled = false;
  enterLabel.textContent = 'CLICK TO ENTER — WITH SOUND';
  enterBtn.focus({ preventScroll: true });
})();

enterBtn.addEventListener('click', () => {
  if (enterBtn.disabled) return;
  playMusic();                       // user gesture => browser allows audio immediately
  gate.classList.add('open');
  setTimeout(() => { gate.style.display = 'none'; }, 1800);
  runIntro();
}, { once: true });

/* ---------- 2. INTRO TIMELINE ---------- */
const skipBtn = $('#skip-intro');
skipBtn.addEventListener('click', () => { skipIntro = true; });

const heroWords = ['WEB DEVELOPMENT', 'ARTIFICIAL INTELLIGENCE', 'SOFTWARE ENGINEERING', 'PROBLEM SOLVING'];
function startFocusLoop() {
  const out = $('#typing-text');
  let wi = 0, ci = 0, del = false;
  (function step() {
    const word = heroWords[wi];
    if (!del) { ci++; out.textContent = word.slice(0, ci);
      if (ci >= word.length) { del = true; return setTimeout(step, 1400); } }
    else { ci--; out.textContent = word.slice(0, ci);
      if (ci <= 0) { del = false; wi = (wi + 1) % heroWords.length; return setTimeout(step, 380); } }
    setTimeout(step, del ? 36 : 70);
  })();
}

async function runIntro() {
  skipBtn.hidden = reduceMotion;
  await sleep(500);
  document.body.classList.add('intro-go');           // photo curtain, giant title, scanline, top bar
  await sleep(1000);

  const fade = el => el && el.classList.add('in');
  fade($('.hero-topline'));
  await sleep(250);

  const typed = $$('[data-intro-type]');             // eyebrow -> name -> role -> paragraph
  const speedOf = el => Number(el.dataset.introType) || 28;
  await typeEl(typed[0], speedOf(typed[0])); await sleep(120);
  await typeEl(typed[1], speedOf(typed[1])); await sleep(150);
  await typeEl(typed[2], speedOf(typed[2]));
  fade($('.typing-line')); startFocusLoop();
  await sleep(350);
  await typeEl(typed[3], speedOf(typed[3]));

  for (const sel of ['.hero-actions', '.social-row', '.hero-tags', '.hero-bottom', '.ticker']) {
    fade($(sel)); await sleep(180);
  }
  finishIntro();
}

let introDone = false;
function finishIntro() {
  if (introDone) return; introDone = true;
  $$('.intro-fade').forEach(el => el.classList.add('in'));
  if (!$('#typing-text').textContent) startFocusLoop();
  document.body.classList.add('intro-go');
  document.body.classList.remove('locked');
  skipBtn.hidden = true;
}
// If the user hits SKIP while the timeline is awaiting, make sure we finish promptly.
skipBtn.addEventListener('click', () => setTimeout(finishIntro, 60));
if (reduceMotion) { /* nothing is gated by motion; gate still shown for music */ }

/* ---------- 3. SCROLL-TRIGGERED MOTION ---------- */
function fmtCount(v, el) {
  const dec = Number(el.dataset.dec || 0), pad = Number(el.dataset.pad || 0);
  let s = v.toFixed(dec);
  if (pad) s = s.padStart(pad + (dec ? dec + 1 : 0), '0');
  return s + (el.dataset.suffix || '');
}
function countUp(el) {
  const end = parseFloat(el.dataset.count), dur = reduceMotion ? 1 : 1700, t0 = performance.now();
  (function f(now) {
    const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 4);
    el.textContent = fmtCount(end * e, el);
    if (t < 1) requestAnimationFrame(f);
  })(t0);
}

const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    io.unobserve(el);
    if (el.matches('[data-anim],[data-kinetic]')) {
      el.classList.add('in');
      setTimeout(() => el.classList.add('done'), 2000);
    }
    if (el.matches('[data-type]')) typeEl(el, Number(el.dataset.type) || 25);
    if (el.matches('[data-count]')) countUp(el);
  });
}, { threshold: .18, rootMargin: '0px 0px -6% 0px' });

$$('[data-anim],[data-kinetic],[data-count]').forEach(el => io.observe(el));
$$('[data-type]').forEach(el => io.observe(el));

/* ---------- nav ---------- */
const toggle = $('.menu-toggle'), nav = $('.nav');
toggle.addEventListener('click', () => { const open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); });
$$('a', nav).forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }));

/* ---------- scroll progress + parallax ---------- */
const progress = $('.scroll-progress'), heroPhoto = $('.hero-photo'), bgText = $('.hero-bgtext');
let ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
    if (!reduceMotion && scrollY < innerHeight * 1.2) {
      heroPhoto.style.transform = `translateY(${scrollY * .12}px)`;
      bgText.style.transform = `translateX(${-scrollY * .12}px)`;
    }
    ticking = false;
  });
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------- cursor ---------- */
if (finePointer) {
  const glow = $('.cursor-glow'), dot = $('.cursor-dot');
  let mx = innerWidth / 2, my = innerHeight / 2, dx = mx, dy = my;
  document.body.classList.add('cursor-active');
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; glow.style.left = mx + 'px'; glow.style.top = my + 'px'; }, { passive: true });
  (function loop() { dx += (mx - dx) * .22; dy += (my - dy) * .22; dot.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
  document.addEventListener('pointerover', e => document.body.classList.toggle('cursor-hover', !!e.target.closest('a,button,.skill-card,.project,.interest-row')));

  /* gentle 3D tilt on skill cards */
  $$('.skill-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(850px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}
})();
