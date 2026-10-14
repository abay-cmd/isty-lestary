/* =========================================================
   Isty Lestary — Portfolio
   GSAP + ScrollTrigger + Lenis. Everything degrades gracefully:
   if a library fails to load, content simply stays visible.
   ========================================================= */
(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const body = document.body;
  const pre = $('#preloader');
  let lenis = null;

  /* ---------- Always-on: mobile menu + lightbox (no GSAP needed) ---------- */
  const nav = $('#nav'), burger = $('#burger');
  const setMenu = open => {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    if (nav.classList.contains('open')) setMenu(false);
    if (lenis) lenis.scrollTo(id === '#top' ? 0 : target, { offset: id === '#top' ? 0 : -8, duration: 1.7 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  // Lightbox
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbTitle = $('#lbTitle'), lbSub = $('#lbSub'), lbCount = $('#lbCount');
  const items = $$('a.cert');
  let cur = 0, lastFocus = null;
  const hasG = () => !!window.gsap && !reduce;
  const paint = (i, dir = 0) => {
    cur = (i + items.length) % items.length;
    const a = items[cur];
    const show = () => {
      lbImg.src = a.getAttribute('href');
      lbImg.alt = a.querySelector('img')?.alt || '';
      lbTitle.textContent = a.dataset.title || '';
      lbSub.textContent = a.dataset.sub || '';
      lbCount.textContent = `${String(cur + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
      if (hasG()) gsap.fromTo(lbImg, { x: dir * 60, opacity: 0, scale: .96 }, { x: 0, opacity: 1, scale: 1, duration: .7, ease: 'expo.out' });
    };
    if (hasG() && dir) gsap.to(lbImg, { x: -dir * 60, opacity: 0, duration: .2, ease: 'power2.in', onComplete: show }); else show();
  };
  const openLb = i => {
    lastFocus = document.activeElement;
    lb.hidden = false;
    paint(i);
    if (lenis) lenis.stop(); else body.style.overflow = 'hidden';
    if (hasG()) {
      gsap.fromTo('.lb-bg', { opacity: 0 }, { opacity: 1, duration: .5 });
      gsap.fromTo('.lb-fig figcaption', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .8, delay: .2, ease: 'expo.out' });
      gsap.fromTo('.lb-close,.lb-nav', { scale: 0 }, { scale: 1, duration: .6, stagger: .06, ease: 'back.out(2)', delay: .15 });
    }
    $('.lb-close').focus({ preventScroll: true });
  };
  const closeLb = () => {
    const done = () => {
      lb.hidden = true; lbImg.removeAttribute('src');
      if (lenis) lenis.start(); else body.style.overflow = '';
      lastFocus && lastFocus.focus({ preventScroll: true });
    };
    if (hasG()) gsap.to(lb, { opacity: 0, duration: .35, onComplete: () => { done(); gsap.set(lb, { opacity: 1 }); } }); else done();
  };
  items.forEach((a, i) => a.addEventListener('click', e => { e.preventDefault(); openLb(i); }));
  $('.lb-close').addEventListener('click', closeLb);
  $('.lb-prev').addEventListener('click', () => paint(cur - 1, -1));
  $('.lb-next').addEventListener('click', () => paint(cur + 1, 1));
  $('.lb-bg').addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-fig')) closeLb(); });
  addEventListener('keydown', e => {
    if (lb.hidden) { if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false); return; }
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') paint(cur - 1, -1);
    if (e.key === 'ArrowRight') paint(cur + 1, 1);
  });
  let tx = 0;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) paint(cur + (d < 0 ? 1 : -1), d < 0 ? 1 : -1); });

  /* ---------- Helpers that don't need GSAP ---------- */
  const finalState = () => {
    $$('[data-count]').forEach(el => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
    $$('[data-bar]').forEach(el => { el.style.width = el.dataset.bar + '%'; });
    const ring = $('#ringFg'); if (ring) ring.style.strokeDashoffset = (326.7 * (1 - 41 / 90)).toFixed(1);
  };
  const dropPreloader = () => { pre && pre.remove(); body.classList.remove('is-loading'); };

  const hasLibs = window.gsap && window.ScrollTrigger;
  if (!hasLibs || reduce) { finalState(); dropPreloader(); return; }

  /* =========================================================
     GSAP world
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);
  const root = document.documentElement;
  const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  if (weak) root.classList.add('lite');
  const isLite = () => root.classList.contains('lite');
  // run an infinite tween only while its section is on screen
  const whileVisible = (trigger, ...tweens) => {
    tweens.forEach(t => t.pause());
    ScrollTrigger.create({ trigger, start: 'top bottom', end: 'bottom top', onToggle: self => tweens.forEach(t => self.isActive ? t.resume() : t.pause()) });
  };
  // pause CSS animations in panels that are off-screen
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting)), { rootMargin: '80px' });
    $$('.panel').forEach(p => io.observe(p));
  }
  body.classList.add('is-loading');
  setTimeout(() => { if ($('#preloader')) { dropPreloader(); lenis && lenis.start(); } }, 9000); // failsafe

  // Smooth scroll
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ---------- Decorative wavy contour lines ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  $$('.waves').forEach((svg, k) => {
    const flip = k % 2 ? -1 : 1;
    for (let i = 0; i < 16; i++) {
      const y = 20 + i * 15 * flip;
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', `M-60 ${y + 170} C 90 ${y - 60}, 210 ${y + 250}, 350 ${y + 90} S 560 ${y - 50}, 700 ${y + 120}`);
      p.style.strokeOpacity = (1 - i / 22).toFixed(2);
      svg.appendChild(p);
    }
    svg.style.overflow = 'visible';
  });

  /* ---------- Text splitting ---------- */
  const splitText = el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(/\s+/).forEach((w, wi, arr) => {
      const word = document.createElement('span');
      word.className = 'word'; word.setAttribute('aria-hidden', 'true');
      Array.from(w).forEach(ch => { const c = document.createElement('span'); c.className = 'char'; c.textContent = ch; word.appendChild(c); });
      el.appendChild(word);
      if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return $$('.char', el);
  };
  const splits = $$('[data-split]').map(el => ({ el, chars: splitText(el), hero: !!el.closest('.hero') }));
  splits.forEach(s => gsap.set(s.chars, { yPercent: 118 }));

  // hero title: "P" + "or" + script "t" (in FRONT of the photo) + "folio"
  const serif = $('#heroSerif');
  serif.textContent = '';
  Array.from('ortfolio').forEach((ch, i) => {
    const s = document.createElement('span'); s.className = 'char' + (i === 2 ? ' t-s' : ''); s.textContent = ch; serif.appendChild(s);
  });
  const titleBack = $('.hero-title');
  const titleFront = titleBack.cloneNode(true);
  titleFront.removeAttribute('aria-label'); titleFront.setAttribute('aria-hidden', 'true');
  titleFront.classList.add('front'); $('#heroSerif', titleFront).removeAttribute('id');
  $$('.t-script', titleFront).forEach(e => e.style.visibility = 'hidden');
  $$('.char:not(.t-s)', titleFront).forEach(e => e.style.visibility = 'hidden');
  titleBack.after(titleFront);
  const serifChars = $$('.t-serif .char');

  // initial hidden states (JS only → no-JS users see everything)
  gsap.set('.hero-brand span', { opacity: 0 });
  gsap.set('.hero-brand .line', { scaleX: 0 });
  gsap.set(serifChars, { opacity: 0 });
  gsap.set('.t-script', { opacity: 0 });
  gsap.set('.hero-photo img', { opacity: 0 });
  gsap.set('.hero .spark', { scale: 0 });
  gsap.set('#heroScript span', { clipPath: 'inset(-30% 100% -30% 0)' });
  gsap.set(['.hero-contact', '.hero-scroll'], { opacity: 0 });
  gsap.set('.hero .waves path', { opacity: 0 });
  gsap.set('[data-wipe]', { clipPath: 'inset(-30% 100% -30% 0)' });

  /* ---------- Preloader → hero intro ---------- */
  const num = $('#preNum');
  const counter = { v: 0 };
  const fontsReady = (document.fonts && document.fonts.ready) || Promise.resolve();
  const loaded = new Promise(res => { if (document.readyState === 'complete') res(); else addEventListener('load', res, { once: true }); });

  const heroLoops = () => {
    const loops = [
      gsap.to('.hero .spark', { rotation: '+=360', duration: 9, repeat: -1, ease: 'none', stagger: .7 }),
      gsap.to('.hero .s1,.hero .s2', { scale: 1.25, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: .5 }),
      gsap.to('.hero-script', { y: -10, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    ];
    whileVisible('#hero', ...loops);
    ScrollTrigger.refresh();

    if (finePointer && !isLite()) {
      const hero = $('#hero');
      const depthEls = $$('[data-depth]', hero);
      const setters = depthEls.map(el => {
        const d = parseFloat(el.dataset.depth);
        const isTitle = el.classList.contains('hero-title');
        const target = el.classList.contains('hero-photo') ? $('img', el) : el;
        return { d, qx: gsap.quickTo(target, 'x', { duration: 1.1, ease: 'power3' }), qy: isTitle ? null : gsap.quickTo(target, 'y', { duration: 1.1, ease: 'power3' }) };
      });
      hero.addEventListener('pointermove', e => {
        if (isLite()) return;
        const r = hero.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        setters.forEach(s => { s.qx(px * s.d * 2); s.qy && s.qy(py * s.d * 1.4); });
      });
      hero.addEventListener('pointerleave', () => setters.forEach(s => { s.qx(0); s.qy && s.qy(0); }));
    }
    // if this machine struggles, switch to lite mode automatically
    if (!isLite()) {
      let n = 0, last = performance.now(), acc = 0;
      const sample = () => {
        const now = performance.now(); acc += now - last; last = now;
        if (++n >= 90) { gsap.ticker.remove(sample); if (acc / n > 30) root.classList.add('lite'); }
      };
      gsap.ticker.add(sample);
    }
  };

  const heroIntro = () => {
    const heroChars = splits.filter(s => s.hero).flatMap(s => s.chars);
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: heroLoops });
    tl.to('.hero-brand span', { opacity: 1, duration: 1 }, 0)
      .to('.hero-brand .line', { scaleX: 1, duration: 1.6 }, .1)
      .to(heroChars, { yPercent: 0, stagger: .012, duration: 1.2 }, .2)
      .fromTo('.t-script', { scale: .5, rotation: -14, opacity: 0, transformOrigin: '50% 80%' }, { scale: 1, rotation: 0, opacity: 1, duration: 1.5, ease: 'back.out(1.5)' }, .15)
      .fromTo(serifChars, { y: '40%', opacity: 0, rotation: 8 }, { y: '0%', opacity: 1, rotation: 0, stagger: .06, duration: 1.3 }, .3)
      .fromTo('.hero-photo img', { y: 200, opacity: 0, scale: 1.1 }, { y: 0, opacity: 1, scale: 1, duration: 1.8 }, .35)
      .to('.hero .spark', { scale: 1, rotation: 0, duration: 1.3, stagger: .12, ease: 'back.out(2)' }, .95)
      .to('#heroScript span', { clipPath: 'inset(-30% -6% -30% 0)', duration: 1.7, ease: 'power2.inOut' }, 1.0)
      .fromTo('.hero-contact', { y: 30 }, { y: 0, opacity: 1, duration: 1.1 }, 1.15)
      .fromTo('.hero-scroll', { scale: .4 }, { scale: 1, opacity: 1, duration: 1.1, ease: 'back.out(2)' }, 1.25)
      .to('.hero .waves path', { opacity: 1, duration: 1.5, stagger: .05, ease: 'power2.out' }, .4);
    // draw-on for waves
    $$('.hero .waves path').forEach((p, i) => {
      const L = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 2.6, delay: .3 + i * .05, ease: 'power2.out', onComplete: () => p.style.strokeDasharray = 'none' });
    });
  };

  const intro = () => {
    const tl = gsap.timeline();
    tl.to('.pre-inner', { yPercent: -20, opacity: 0, duration: .35, ease: 'power3.in' })
      .to('.pre-curtain', { scaleY: 1, duration: .45, ease: 'expo.inOut' }, '-=.1')
      .set('.pre-bg', { opacity: 0 })
      .to('.pre-curtain.c1', { yPercent: -101, duration: .8, ease: 'expo.inOut' })
      .to('.pre-curtain.c2', { yPercent: 101, duration: .8, ease: 'expo.inOut' }, '<')
      .add(() => { body.classList.remove('is-loading'); lenis && lenis.start(); heroIntro(); }, '-=.45')
      .add(() => { pre.remove(); ScrollTrigger.refresh(); });
  };

  gsap.to(counter, {
    v: 100, duration: 1.1, ease: 'power2.inOut',
    onUpdate: () => { num.textContent = Math.round(counter.v); },
    onComplete: () => Promise.race([Promise.all([loaded, fontsReady]), new Promise(r => setTimeout(r, 2500))]).then(intro)
  });

  /* ---------- Scroll-driven things ---------- */
  // progress bar
  gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .2 } });

  // active nav
  const links = $$('.nav-links a');
  $$('main section[id]').forEach(sec => {
    const match = links.find(a => a.getAttribute('href') === '#' + sec.id);
    if (!match) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: self => match.classList.toggle('active', self.isActive) });
  });

  // hero parallax
  gsap.to('.hero-title', { y: -90, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-photo', { y: 110, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-script', { x: 60, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

  // panels "open up" once as they enter (one-shot = much cheaper than scrubbing)
  const mobile = matchMedia('(max-width:600px)').matches;
  $$('.panel:not(.hero)').forEach(p => {
    gsap.fromTo(p,
      { clipPath: `inset(${mobile ? 4 : 6}% ${mobile ? 3 : 4}% 0% ${mobile ? 3 : 4}% round 48px)` },
      { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.1, ease: 'expo.out', clearProps: 'clipPath', scrollTrigger: { trigger: p, start: 'top 94%', once: true } });
  });
  gsap.from('.band', { scaleX: .94, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.band', start: 'top 95%' } });

  // generic split headings
  splits.filter(s => !s.hero).forEach(s => {
    gsap.to(s.chars, { yPercent: 0, duration: 1.2, stagger: .028, ease: 'expo.out', scrollTrigger: { trigger: s.el, start: 'top 90%', once: true } });
  });

  // fade-up blocks
  $$('[data-reveal]').forEach(el => {
    gsap.from(el, { y: 44, opacity: 0, duration: 1.1, ease: 'expo.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  // staggered groups
  $$('[data-stagger]').forEach(g => {
    gsap.from(g.children, { y: 36, opacity: 0, scale: .94, duration: 1, stagger: .07, ease: 'expo.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: g, start: 'top 90%', once: true } });
  });
  // handwriting wipes
  $$('[data-wipe]').forEach(el => {
    gsap.to(el, { clipPath: 'inset(-30% -8% -30% 0)', duration: 1.8, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // counters
  $$('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count), suf = el.dataset.suffix || '', o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v) + suf; } }) });
  });
  // bars
  $$('[data-bar]').forEach(el => {
    gsap.fromTo(el, { width: '0%' }, { width: el.dataset.bar + '%', duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true } });
  });
  // ring
  gsap.to('#ringFg', { strokeDashoffset: 326.7 * (1 - 41 / 90), duration: 2.4, ease: 'expo.out', scrollTrigger: { trigger: '#ringFg', start: 'top 90%', once: true } });

  // about photo parallax + reveal
  $$('.ph-frame img').forEach(img => gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  $$('.about-photo, .skills-photo').forEach(f => {
    gsap.from(f, { clipPath: 'inset(100% 0% 0% 0% round 34px)', duration: 1.6, ease: 'expo.out', clearProps: 'clipPath', scrollTrigger: { trigger: f, start: 'top 88%', once: true } });
  });
  gsap.from('.skills-photo img', { scale: 1.35, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: '.skills-photo', start: 'top 88%', once: true } });
  gsap.utils.toArray('.about-photo .spark').forEach((s, i) => whileVisible('.about', gsap.to(s, { rotation: i ? -360 : 360, duration: 8, repeat: -1, ease: 'none' })));

  // experience
  gsap.from('.exp-card', { y: 90, opacity: 0, rotationX: 12, duration: 1.4, ease: 'expo.out', clearProps: 'opacity', scrollTrigger: { trigger: '.exp-card', start: 'top 88%', once: true } });

  // training bento
  gsap.from('.bento .tile', { y: 80, opacity: 0, scale: .92, duration: 1.2, stagger: .1, ease: 'expo.out', clearProps: 'opacity', scrollTrigger: { trigger: '.bento', start: 'top 85%', once: true } });
  gsap.from('.stick', { scale: 0, duration: 1.2, stagger: .15, ease: 'back.out(2)', scrollTrigger: { trigger: '.t-sticker', start: 'top 85%', once: true } });
  whileVisible('.train', gsap.to('.s-a', { y: -12, rotation: '-=5', duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }), gsap.to('.s-b', { y: 14, rotation: '+=6', duration: 3.1, yoyo: true, repeat: -1, ease: 'sine.inOut' }));

  // certificates reveal + drift
  $$('.cert').forEach((c, i) => {
    gsap.fromTo(c, { clipPath: 'inset(100% 0% 0% 0% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%', once: true } });
    gsap.from($('img', c), { scale: 1.4, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%', once: true } });
  });
  if (!matchMedia('(max-width:900px)').matches) {
    gsap.to('.c-a', { y: 40, ease: 'none', scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.c-c', { y: -30, ease: 'none', scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.c-e', { y: -40, ease: 'none', scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  gsap.from('.pte-doc', { y: 100, rotation: 6, opacity: 0, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.pte-doc', start: 'top 90%', once: true } });

  // book
  gsap.fromTo('.book', { rotationY: -50, y: 80, opacity: 0 }, { rotationY: 8, y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.book-wrap', start: 'top 95%', end: 'center 55%', scrub: true } });
  whileVisible('.pub', gsap.to('.book', { y: '-=12', duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1 }));

  // contact
  gsap.from('.qr', { y: 90, opacity: 0, rotationX: 14, duration: 1.3, stagger: .14, ease: 'expo.out', clearProps: 'opacity', scrollTrigger: { trigger: '.qrs', start: 'top 88%', once: true } });
  gsap.from('.rl', { scale: 0, rotation: -120, duration: 1, stagger: .12, ease: 'back.out(2.2)', clearProps: 'transform', scrollTrigger: { trigger: '.round-links', start: 'top 92%', once: true } });
  gsap.from('.link-line span', { y: 20, opacity: 0, stagger: .1, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '.link-line', start: 'top 96%', once: true } });

  /* ---------- Marquees reacting to scroll speed ---------- */
  $$('.marquee').forEach(m => {
    const track = $('.m-track', m);
    const tween = gsap.to(track, { xPercent: -50, duration: parseFloat(m.dataset.speed) || 24, ease: 'none', repeat: -1 });
    let target = 1;
    ScrollTrigger.create({ onUpdate: self => { target = 1 + Math.min(Math.abs(self.getVelocity()) / 220, 8); } });
    gsap.ticker.add(() => { target += (1 - target) * .06; const ts = tween.timeScale(); tween.timeScale(ts + (target - ts) * .15); });
    whileVisible('.band', tween);
  });

  /* ---------- Pointer-driven effects ---------- */
  if (finePointer) {
    // cursor
    const cur = $('#cursor'), dot = $('.c-dot'), ring = $('.c-ring');
    body.classList.add('has-cursor');
    gsap.set([dot, ring], { x: innerWidth / 2, y: innerHeight / 2, opacity: 0 });
    const dx = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3' }), dy = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3' });
    let shown = false;
    addEventListener('pointermove', e => {
      if (!shown) { shown = true; gsap.to([dot, ring], { opacity: 1, duration: .3 }); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    });
    document.addEventListener('pointerleave', () => gsap.to([dot, ring], { opacity: 0, duration: .2 }));
    document.addEventListener('pointerenter', () => shown && gsap.to([dot, ring], { opacity: 1, duration: .2 }));
    const hov = 'a,button,[data-cursor]';
    document.addEventListener('pointerover', e => {
      const t = e.target.closest(hov);
      cur.classList.toggle('is-hover', !!t);
      cur.classList.toggle('is-view', !!(t && t.matches('a.cert')));
      gsap.to(ring, { scale: t ? (t.matches('a.cert') ? 1.9 : 1.5) : 1, duration: .4, ease: 'expo.out' });
    });

    // 3D tilt
    $$('[data-tilt]').forEach(el => {
      gsap.set(el, { transformPerspective: 900 });
      const rX = gsap.quickTo(el, 'rotationX', { duration: .7, ease: 'power3' });
      const rY = gsap.quickTo(el, 'rotationY', { duration: .7, ease: 'power3' });
      el.addEventListener('pointermove', e => {
        if (isLite()) return;
        const r = el.getBoundingClientRect();
        rY(((e.clientX - r.left) / r.width - .5) * 12);
        rX(-((e.clientY - r.top) / r.height - .5) * 12);
      });
      el.addEventListener('pointerleave', () => { rX(0); rY(0); });
    });

    // magnetic
    $$('.magnetic').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: .8, ease: 'elastic.out(1,.5)' });
      const my = gsap.quickTo(el, 'y', { duration: .8, ease: 'elastic.out(1,.5)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * .4);
        my((e.clientY - (r.top + r.height / 2)) * .4);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
  addEventListener('resize', () => ScrollTrigger.refresh());
})();
