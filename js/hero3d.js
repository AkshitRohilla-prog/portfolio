/* Subtle rotating network of connected nodes behind the hero photo.
   Plain Canvas 2D with a small 3D projection (no Three.js needed).
   Loaded by main.js only when the hero is visible, the viewport is at least
   768 px wide and reduced motion is off. Pauses when off-screen or the tab is hidden. */
(function () {
  'use strict';

  var COUNT = 42;
  var LINKS_PER_NODE = 3;
  var MAX_DPR = 1.5;

  function init(host, hero) {
    if (!host || host.querySelector('canvas')) return;
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Nodes on a jittered Fibonacci sphere
    var nodes = [];
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < COUNT; i++) {
      var y = 1 - (i / (COUNT - 1)) * 2;
      var r = Math.sqrt(1 - y * y);
      var th = golden * i;
      var j = 0.82 + Math.random() * 0.3;
      nodes.push({ x: Math.cos(th) * r * j, y: y * j * 0.9, z: Math.sin(th) * r * j });
    }
    // Edges: each node to its nearest neighbours (deduplicated)
    var edges = [];
    var seen = {};
    nodes.forEach(function (a, ai) {
      var d = nodes.map(function (b, bi) {
        var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
        return { i: bi, d: dx * dx + dy * dy + dz * dz };
      }).filter(function (o) { return o.i !== ai; }).sort(function (p, q) { return p.d - q.d; });
      for (var k = 0; k < LINKS_PER_NODE; k++) {
        var bi = d[k].i, key = ai < bi ? ai + '-' + bi : bi + '-' + ai;
        if (!seen[key]) { seen[key] = 1; edges.push([ai, bi]); }
      }
    });

    var w = 0, h = 0, dpr = 1;
    function resize() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var palette;
    function readPalette() {
      var light = document.documentElement.getAttribute('data-theme') === 'light';
      palette = light
        ? { line: '124, 92, 210', node: '0, 119, 138', lineA: 0.22, nodeA: 0.75 }
        : { line: '150, 80, 230', node: '0, 229, 255', lineA: 0.32, nodeA: 0.9 };
    }
    readPalette();
    document.addEventListener('themechange', readPalette);

    var proj = new Array(COUNT);
    var angle = 0, last = 0, visible = true, raf = 0;

    function frame(t) {
      raf = 0;
      var dt = last ? Math.min(t - last, 50) : 16;
      last = t;
      angle += dt * 0.00006;

      var cosA = Math.cos(angle), sinA = Math.sin(angle);
      var tilt = 0.35, cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      var scale = Math.min(w, h) * 0.42, cx = w / 2, cy = h * 0.46, f = 2.6;

      for (var i = 0; i < COUNT; i++) {
        var n = nodes[i];
        var x = n.x * cosA - n.z * sinA;
        var z = n.x * sinA + n.z * cosA;
        var y = n.y * cosT - z * sinT;
        z = n.y * sinT + z * cosT;
        var p = f / (f + z);
        proj[i] = { x: cx + x * scale * p, y: cy + y * scale * p, z: z, p: p };
      }

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (var e = 0; e < edges.length; e++) {
        var a = proj[edges[e][0]], b = proj[edges[e][1]];
        var depth = 1 - ((a.z + b.z) / 2 + 1) / 2; // 1 = front
        ctx.strokeStyle = 'rgba(' + palette.line + ',' + (palette.lineA * (0.25 + depth * 0.75)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (var k = 0; k < COUNT; k++) {
        var q = proj[k];
        var dk = 1 - (q.z + 1) / 2;
        ctx.fillStyle = 'rgba(' + palette.node + ',' + (palette.nodeA * (0.2 + dk * 0.8)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(q.x, q.y, 1.2 + dk * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      schedule();
    }
    function schedule() {
      if (!raf && visible && !document.hidden && wideEnough()) raf = requestAnimationFrame(frame);
    }
    function wideEnough() { return window.innerWidth >= 768; }

    resize();
    if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); }).observe(canvas);
    else window.addEventListener('resize', resize);

    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { last = 0; schedule(); }
    }).observe(hero);
    document.addEventListener('visibilitychange', function () { last = 0; schedule(); });
    window.addEventListener('resize', function () {
      canvas.classList.toggle('is-on', wideEnough());
      schedule();
    });

    canvas.classList.add('is-on');
    schedule();
  }

  window.HeroNet = { init: init };
})();
