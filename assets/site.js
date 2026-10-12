/* Eugene Eo — v2 shared script */
(function () {
    'use strict';

    /* ---------- Language (KOR / ENG) ---------- */
    var root = document.documentElement;
    function getLang() {
        try { return localStorage.getItem('ee-lang-v2') || 'en'; } catch (e) { return 'en'; }
    }
    function setLang(l) {
        root.setAttribute('data-lang', l);
        root.setAttribute('lang', l === 'ko' ? 'ko' : 'en');
        try { localStorage.setItem('ee-lang-v2', l); } catch (e) {}
        document.querySelectorAll('.lang button').forEach(function (b) {
            b.classList.toggle('active', b.dataset.l === l);
        });
    }
    setLang(getLang());
    document.querySelectorAll('.lang button').forEach(function (b) {
        b.addEventListener('click', function () { setLang(b.dataset.l); });
    });

    /* ---------- Night sky (carried over from v1 hero) ---------- */
    var canvas = document.getElementById('sky');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (canvas && canvas.getContext) {
        var ctx = canvas.getContext('2d');
        var W = 0, H = 0, DPR = 1;
        function resize() {
            DPR = Math.min(window.devicePixelRatio || 1, 2);
            W = window.innerWidth; H = window.innerHeight;
            canvas.width = Math.round(W * DPR);
            canvas.height = Math.round(H * DPR);
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }
        resize();

        var sprite = (function () {
            var s = 64, c = document.createElement('canvas');
            c.width = c.height = s;
            var g = c.getContext('2d');
            var gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
            gr.addColorStop(0, 'rgba(255,255,255,0.95)');
            gr.addColorStop(0.22, 'rgba(190,220,150,0.45)');
            gr.addColorStop(0.5, 'rgba(120,165,75,0.18)');
            gr.addColorStop(1, 'rgba(80,125,42,0)');
            g.fillStyle = gr; g.fillRect(0, 0, s, s);
            return c;
        })();

        var CONNECT = 150, MOUSE = 200;
        var near = [], far = [], mouse = { x: -9999, y: -9999 }, meteor = null;

        function Near() {
            this.x = Math.random() * W; this.y = Math.random() * H;
            this.vx = (Math.random() - 0.5) * 0.16; this.vy = (Math.random() - 0.5) * 0.16;
            this.bright = Math.random() < 0.12;
            this.r = (Math.random() * 1.1 + 0.7) + (this.bright ? 1.3 : 0);
            this.tw = Math.random() * Math.PI * 2;
            this.ts = 0.006 + Math.random() * 0.012;
        }
        Near.prototype.step = function () {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > W) this.vx *= -1;
            if (this.y < 0 || this.y > H) this.vy *= -1;
            this.x = Math.max(0, Math.min(W, this.x));
            this.y = Math.max(0, Math.min(H, this.y));
            this.tw += this.ts;
            var f = 0.72 + Math.sin(this.tw) * 0.28;
            var gr = (this.bright ? 9 : 5.5) * this.r;
            ctx.globalAlpha = (this.bright ? 0.95 : 0.7) * f;
            ctx.drawImage(sprite, this.x - gr, this.y - gr, gr * 2, gr * 2);
            ctx.globalAlpha = 1;
        };
        function Far() {
            this.x = Math.random() * W; this.y = Math.random() * H;
            this.r = Math.random() * 0.9 + 0.3;
            this.a = Math.random() * 0.45 + 0.2;
            this.tw = Math.random() * Math.PI * 2;
            this.ts = 0.004 + Math.random() * 0.01;
            this.d = (Math.random() - 0.5) * 0.025;
        }
        Far.prototype.step = function () {
            this.tw += this.ts; this.x += this.d;
            if (this.x < 0) this.x = W; if (this.x > W) this.x = 0;
            ctx.fillStyle = 'rgba(205,222,185,' + (this.a * (0.45 + Math.sin(this.tw) * 0.55)) + ')';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
        };
        function init() {
            var nc = Math.max(50, Math.min(110, Math.round((W * H) / 17000)));
            var fc = Math.max(120, Math.min(300, Math.round((W * H) / 7000)));
            near = []; far = [];
            for (var i = 0; i < nc; i++) near.push(new Near());
            for (var j = 0; j < fc; j++) far.push(new Far());
        }
        init();

        document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });

        function lines() {
            var i, j, dx, dy, d;
            ctx.lineWidth = 0.6;
            for (i = 0; i < near.length; i++) {
                for (j = i + 1; j < near.length; j++) {
                    dx = near[i].x - near[j].x; dy = near[i].y - near[j].y;
                    d = Math.sqrt(dx * dx + dy * dy);
                    if (d < CONNECT) {
                        ctx.strokeStyle = 'rgba(120,165,75,' + (0.2 * (1 - d / CONNECT)) + ')';
                        ctx.beginPath(); ctx.moveTo(near[i].x, near[i].y); ctx.lineTo(near[j].x, near[j].y); ctx.stroke();
                    }
                }
            }
            ctx.lineWidth = 0.8;
            for (i = 0; i < near.length; i++) {
                dx = near[i].x - mouse.x; dy = near[i].y - mouse.y;
                d = Math.sqrt(dx * dx + dy * dy);
                if (d < MOUSE) {
                    ctx.strokeStyle = 'rgba(180,215,120,' + (0.45 * (1 - d / MOUSE)) + ')';
                    ctx.beginPath(); ctx.moveTo(near[i].x, near[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
                }
            }
        }
        function drawMeteor() {
            if (!meteor) {
                if (Math.random() < 0.0035) {
                    meteor = { x: Math.random() * W * 0.7, y: Math.random() * H * 0.35,
                        vx: 4 + Math.random() * 3, vy: 1.6 + Math.random() * 1.6, life: 1 };
                }
                return;
            }
            meteor.x += meteor.vx; meteor.y += meteor.vy; meteor.life -= 0.012;
            if (meteor.life <= 0 || meteor.x > W + 50 || meteor.y > H + 50) { meteor = null; return; }
            var tx = meteor.x - meteor.vx * 7, ty = meteor.y - meteor.vy * 7;
            var g = ctx.createLinearGradient(tx, ty, meteor.x, meteor.y);
            g.addColorStop(0, 'rgba(210,228,190,0)');
            g.addColorStop(1, 'rgba(225,238,205,' + (0.7 * meteor.life) + ')');
            ctx.strokeStyle = g; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(meteor.x, meteor.y); ctx.stroke();
        }
        // only draw while the canvas is on screen
        var onScreen = true;
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; })
                .observe(canvas.parentElement === document.body ? canvas : canvas.parentElement);
        }
        function frame() {
            if (!onScreen && !reduce) { requestAnimationFrame(frame); return; }
            ctx.clearRect(0, 0, W, H);
            for (var i = 0; i < far.length; i++) far[i].step();
            lines();
            ctx.globalCompositeOperation = 'lighter';
            for (var j = 0; j < near.length; j++) near[j].step();
            drawMeteor();
            ctx.globalCompositeOperation = 'source-over';
            if (!reduce) requestAnimationFrame(frame);
        }
        frame();
        var rt;
        window.addEventListener('resize', function () {
            clearTimeout(rt);
            rt = setTimeout(function () { resize(); init(); if (reduce) frame(); }, 120);
        });
    }

    /* ---------- Hover thumbnails on index lists ---------- */
    var peek = document.querySelector('.peek');
    if (peek && window.matchMedia('(hover: hover)').matches) {
        var pimg = peek.querySelector('img');
        document.querySelectorAll('[data-peek]').forEach(function (a) {
            a.addEventListener('mouseenter', function () {
                pimg.src = a.getAttribute('data-peek');
                peek.classList.add('on');
            });
            a.addEventListener('mouseleave', function () { peek.classList.remove('on'); });
            a.addEventListener('mousemove', function (e) {
                var x = e.clientX, w = 200;
                if (x + w + 30 > window.innerWidth) x = x - w - 36;
                peek.style.left = x + 'px';
                peek.style.top = e.clientY + 'px';
            });
        });
    }

    /* ---------- Lightbox ---------- */
    var lb = document.querySelector('.lb');
    if (lb) {
        var lbImg = lb.querySelector('img'), lbN = lb.querySelector('.n');
        var set = [], idx = 0;
        function show(i) {
            idx = (i + set.length) % set.length;
            lbImg.style.opacity = 0;
            setTimeout(function () { lbImg.src = set[idx]; lbImg.style.opacity = 1; }, 120);
            lbN.textContent = (idx + 1) + ' / ' + set.length;
            lb.querySelector('.prev').style.display = set.length > 1 ? '' : 'none';
            lb.querySelector('.next').style.display = set.length > 1 ? '' : 'none';
        }
        document.querySelectorAll('.grid').forEach(function (grid) {
            var figs = grid.querySelectorAll('figure');
            figs.forEach(function (f, i) {
                f.addEventListener('click', function () {
                    set = Array.prototype.map.call(figs, function (x) { return x.querySelector('img').getAttribute('src'); });
                    show(i);
                    lb.classList.add('on');
                });
            });
        });
        function close() { lb.classList.remove('on'); }
        lb.querySelector('.x').addEventListener('click', close);
        lb.querySelector('.prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
        lb.querySelector('.next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
        lbImg.addEventListener('click', function (e) { e.stopPropagation(); if (set.length > 1) show(idx + 1); });
        lb.addEventListener('click', close);
        document.addEventListener('keydown', function (e) {
            if (!lb.classList.contains('on')) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') show(idx - 1);
            if (e.key === 'ArrowRight') show(idx + 1);
        });
    }

    /* ---------- Statement anchor opens <details> ---------- */
    document.querySelectorAll('[data-open]').forEach(function (b) {
        b.addEventListener('click', function () {
            var d = document.getElementById(b.getAttribute('data-open'));
            if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });

    /* ---------- Gentle entrance ---------- */
    var items = document.querySelectorAll('.fade');
    items.forEach(function (el, i) {
        setTimeout(function () { el.classList.add('in'); }, 60 + i * 35);
    });
})();
