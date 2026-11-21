/* Akshit Rohilla portfolio: progressive enhancements.
   Everything here is optional: the page is complete and readable without it. */

(function () {
  'use strict';

  var doc = document.documentElement;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var mqWide = window.matchMedia('(min-width: 768px)');

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage blocked: ignore */ }
  }

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.querySelector('.theme-toggle');
  function currentTheme() { return doc.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function syncThemeUI() {
    var t = currentTheme();
    if (themeBtn) themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    var color = t === 'light' ? '#F4F3F8' : '#050505';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', color); });
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'light' ? 'dark' : 'light';
      doc.setAttribute('data-theme', next);
      store('theme', next);
      syncThemeUI();
      document.dispatchEvent(new CustomEvent('themechange'));
    });
  }
  syncThemeUI();

  /* ---------- Top bar + mobile menu ---------- */
  var topbar = document.querySelector('.topbar');
  var navToggle = document.querySelector('.nav__toggle');
  var navList = document.getElementById('nav-list');

  function setMenu(open) {
    if (!navToggle || !navList) return;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    navList.classList.toggle('is-open', open);
  }
  if (navToggle && navList) {
    navToggle.addEventListener('click', function () {
      setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    navList.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        navToggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (navToggle.getAttribute('aria-expanded') === 'true' && !e.target.closest('.nav')) setMenu(false);
    });
    var mqDesktopNav = window.matchMedia('(min-width: 861px)');
    if (mqDesktopNav.addEventListener) {
      mqDesktopNav.addEventListener('change', function (e) { if (e.matches) setMenu(false); });
    }
  }

  function onScroll() {
    if (topbar) topbar.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active section in nav ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__list a[href^="#"]'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var setActive = function (id) {
      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { io.observe(s); });
    setActive('home');
  }

  /* ---------- Skill chips: hover / focus / tap reveals where it was used ---------- */
  document.querySelectorAll('.skill-group').forEach(function (group) {
    var note = group.querySelector('.skill-group__note');
    if (!note) return;
    var fallback = note.textContent;
    var chips = group.querySelectorAll('.chip');
    var pinned = null;

    function show(chip) {
      var text = chip && chip.getAttribute('data-note');
      note.textContent = text || fallback;
      note.classList.toggle('is-specific', !!text);
    }
    function restore() { show(pinned); }

    chips.forEach(function (chip) {
      chip.addEventListener('mouseenter', function () { show(chip); });
      chip.addEventListener('mouseleave', restore);
      chip.addEventListener('focus', function () { show(chip); });
      chip.addEventListener('blur', function () { setTimeout(restore, 0); });
      chip.addEventListener('click', function () {
        var on = pinned !== chip;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        pinned = on ? chip : null;
        if (on) chip.setAttribute('aria-pressed', 'true');
        show(pinned || (on ? chip : null));
      });
    });
  });

  /* ---------- Optional screenshots for cards without an image ----------
     A card with data-auto-shot="assets/screenshots/x.webp" stays compact until that file
     exists; then the image is shown automatically. Nothing is generated or faked. */
  function showAutoShot(card) {
    var src = card.getAttribute('data-auto-shot');
    var probe = new Image();
    probe.onload = function () {
      if (probe.naturalWidth < 200) return;
      var media = document.createElement('div');
      media.className = 'project__media';
      var img = document.createElement('img');
      img.src = src;
      img.alt = card.getAttribute('data-auto-alt') || '';
      img.width = probe.naturalWidth;
      img.height = probe.naturalHeight;
      img.decoding = 'async';
      media.appendChild(img);
      var icon = card.querySelector('.project__icon');
      if (icon) icon.remove();
      card.insertBefore(media, card.firstChild);
      card.classList.remove('project--compact');
      card.classList.add('project--wide');
    };
    probe.src = src;
  }
  var autoCards = document.querySelectorAll('[data-auto-shot]');
  if (autoCards.length) {
    if ('IntersectionObserver' in window) {
      var shotIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { shotIO.unobserve(en.target); showAutoShot(en.target); }
        });
      }, { rootMargin: '600px 0px' });
      autoCards.forEach(function (c) { shotIO.observe(c); });
    } else {
      autoCards.forEach(showAutoShot);
    }
  }

  /* ---------- Project card tilt (desktop, fine pointer only) ---------- */
  function cardTilt() {
    if (!mqFine.matches || mqReduce.matches) return;
    document.querySelectorAll('.project').forEach(function (card) {
      var raf = 0;
      card.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = card.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          card.style.setProperty('--tx', (x * 3).toFixed(2) + 'deg');
          card.style.setProperty('--ty', (-y * 3).toFixed(2) + 'deg');
        });
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--tx', '0deg');
        card.style.setProperty('--ty', '0deg');
      });
    });
  }
  cardTilt();

  /* ---------- Hero photo stage: cursor parallax, smoothed with rAF ---------- */
  var hero = document.querySelector('.hero');
  var stage = document.querySelector('.stage');
  if (hero && stage && mqFine.matches && !mqReduce.matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    var step = function () {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      stage.style.setProperty('--px', cx.toFixed(4));
      stage.style.setProperty('--py', cy.toFixed(4));
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        requestAnimationFrame(step);
      } else {
        running = false;
      }
    };
    var kick = function () { if (!running) { running = true; requestAnimationFrame(step); } };
    hero.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      var y = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      tx = Math.max(-1, Math.min(1, x));
      ty = Math.max(-1, Math.min(1, y));
      kick();
    });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; kick(); });
  }

  /* ---------- Hero network visual: lazy-loaded, wide screens only ---------- */
  var netHost = document.querySelector('.layer--net');
  if (netHost && hero && 'IntersectionObserver' in window && mqWide.matches && !mqReduce.matches) {
    var netIO = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      netIO.disconnect();
      var s = document.createElement('script');
      s.src = 'js/hero3d.js';
      s.async = true;
      s.onload = function () {
        if (window.HeroNet) window.HeroNet.init(netHost, hero);
      };
      document.body.appendChild(s);
    });
    netIO.observe(hero);
  }

  /* ---------- Scroll reveals with GSAP (only if it loaded) ---------- */
  function reveals() {
    if (!window.gsap || !window.ScrollTrigger || mqReduce.matches) return;
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    var vh = window.innerHeight;
    // Only hide what is still below the fold, so nothing visible ever blinks out.
    var pending = gsap.utils.toArray('.reveal').filter(function (el) {
      return el.getBoundingClientRect().top > vh * 0.92;
    });
    if (!pending.length) return;

    var small = !mqWide.matches;
    gsap.set(pending, { autoAlpha: 0, y: small ? 12 : 24 });
    window.ScrollTrigger.batch(pending, {
      start: 'top 92%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          autoAlpha: 1, y: 0,
          duration: small ? 0.45 : 0.6,
          ease: 'power2.out',
          stagger: small ? 0.04 : 0.08,
          overwrite: true,
          clearProps: 'transform,visibility'
        });
      }
    });
    // Safety net: if layout shifts confuse triggers, show everything after a while.
    window.addEventListener('load', function () { window.ScrollTrigger.refresh(); });
  }
  reveals();
})();
