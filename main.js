/* Jhapendra Kandel — site interactions.
   Vanilla, zero dependencies. Ports the "Fableweb" motion language:
   theme wipe, mouse-follower glow, custom cursor, magnetic elements,
   ripple-grid hero, tilt cards, scroll reveal. */
(function () {
    "use strict";

    var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var mqFine = window.matchMedia("(pointer: fine)");
    var reduce = mqReduce.matches;
    var pointerFx = mqFine.matches && !reduce;

    /* ---------- Year ---------- */
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();

    /* ---------- Theme toggle (with circular View-Transition wipe) ---------- */
    var root = document.documentElement;
    var toggle = document.getElementById("theme-toggle");
    if (toggle) {
        var setIcon = function () {
            var span = toggle.querySelector(".theme-icon");
            span.textContent = root.classList.contains("dark") ? "☾" : "☀";
            span.style.animation = "none";
            void span.offsetWidth;
            span.style.animation = "";
        };
        setIcon();
        toggle.addEventListener("click", function () {
            var apply = function () {
                root.classList.toggle("dark");
                try { localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light"); } catch (e) { }
                var mc = document.querySelector('meta[name="theme-color"]');
                if (mc) mc.setAttribute("content", root.classList.contains("dark") ? "#0f172a" : "#f1f5f9");
                setIcon();
            };
            if (reduce || !document.startViewTransition) { apply(); return; }
            var r = toggle.getBoundingClientRect();
            root.style.setProperty("--wipe-x", (r.left + r.width / 2) + "px");
            root.style.setProperty("--wipe-y", (r.top + r.height / 2) + "px");
            document.startViewTransition(apply);
        });
    }

    /* ---------- Mobile nav ---------- */
    var navToggle = document.getElementById("nav-toggle");
    var navLinks = document.getElementById("nav-links");
    if (navToggle && navLinks) {
        navToggle.addEventListener("click", function () {
            var open = navLinks.classList.toggle("open");
            navToggle.setAttribute("aria-expanded", String(open));
        });
        navLinks.addEventListener("click", function (e) {
            if (e.target.tagName === "A") {
                navLinks.classList.remove("open");
                navToggle.setAttribute("aria-expanded", "false");
            }
        });
    }

    /* ---------- Typing effect ---------- */
    var typed = document.getElementById("typed");
    if (typed) {
        var phrases = [
            "Full-stack developer",
            "Web designer",
            "Front-end + back-end engineer",
            "Building products from Nepal"
        ];
        if (reduce) {
            typed.textContent = phrases[0];
        } else {
            var pi = 0, ci = 0, del = false;
            var tick = function () {
                var w = phrases[pi];
                ci += del ? -1 : 1;
                typed.textContent = w.slice(0, ci);
                var d = del ? 45 : 85;
                if (!del && ci === w.length) { d = 1600; del = true; }
                else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; d = 350; }
                setTimeout(tick, d);
            };
            tick();
        }
    }

    /* ---------- Scroll progress bar ---------- */
    var progress = document.getElementById("scroll-progress");
    if (progress) {
        var updateProgress = function () {
            var h = document.documentElement;
            var max = h.scrollHeight - h.clientHeight;
            progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
        };
        updateProgress();
        window.addEventListener("scroll", updateProgress, { passive: true });
        window.addEventListener("resize", updateProgress);
    }

    /* ---------- Header active-link scroll spy ---------- */
    var spyIds = ["home", "about", "skills", "projects", "journey", "credentials", "contact"];
    var links = Array.prototype.slice.call(document.querySelectorAll('#nav-links a[href^="#"]'));
    var sections = spyIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (sections.length && "IntersectionObserver" in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                links.forEach(function (a) {
                    a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id);
                });
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        sections.forEach(function (s) { spy.observe(s); });
    }

    /* ---------- Scroll reveal + skill bars ---------- */
    var revealEls = document.querySelectorAll(".reveal, .skills");
    if ("IntersectionObserver" in window && !reduce) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add("in-view"); io.unobserve(en.target); }
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
        revealEls.forEach(function (el) { io.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add("in-view"); });
    }

    /* ---------- Contact submit state ---------- */
    var form = document.getElementById("contact-form");
    if (form) {
        form.addEventListener("submit", function () {
            var b = document.getElementById("submit");
            if (b) { b.disabled = true; b.textContent = "Sending…"; }
        });
    }

    /* ---------- Back to top ---------- */
    var bt = document.getElementById("back-top");
    if (bt) bt.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });

    /* ================= Pointer-driven effects ================= */
    if (pointerFx) {
        document.body.classList.add("cursor-on");

        /* Mouse-follower glow */
        var glow = document.getElementById("mouse-glow");
        var cursorLayer = document.getElementById("cursor-layer");
        var dot = document.getElementById("cursor-dot");
        var ring = document.getElementById("cursor-ring");
        if (glow) glow.style.display = "block";
        if (cursorLayer) cursorLayer.style.display = "block";

        var gT = { x: innerWidth / 2, y: innerHeight / 2 };
        var gP = { x: gT.x, y: gT.y };
        var rP = { x: gT.x, y: gT.y };

        window.addEventListener("pointermove", function (e) {
            gT.x = e.clientX; gT.y = e.clientY;
            if (dot) dot.style.transform = "translate(" + (e.clientX - 4) + "px," + (e.clientY - 4) + "px)";
            if (ring) {
                var over = e.target.closest && e.target.closest('a, button, [role="button"], .tilt');
                ring.style.width = ring.style.height = over ? "56px" : "36px";
                ring.style.borderColor = over ? "rgba(212,175,55,0.9)" : "rgba(212,175,55,0.5)";
            }
        }, { passive: true });

        var raf = function () {
            gP.x += (gT.x - gP.x) * 0.06;
            gP.y += (gT.y - gP.y) * 0.06;
            if (glow) glow.style.transform = "translate(" + (gP.x - 240) + "px," + (gP.y - 240) + "px) translate(-50%,-50%)";
            rP.x += (gT.x - rP.x) * 0.16;
            rP.y += (gT.y - rP.y) * 0.16;
            if (ring) {
                var h = ring.offsetWidth / 2;
                ring.style.transform = "translate(" + (rP.x - h) + "px," + (rP.y - h) + "px)";
            }
            requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);

        /* Magnetic elements */
        document.querySelectorAll("[data-magnetic]").forEach(function (el) {
            var s = 0.25;
            el.addEventListener("pointermove", function (e) {
                var r = el.getBoundingClientRect();
                el.style.transform = "translate(" +
                    ((e.clientX - (r.left + r.width / 2)) * s) + "px," +
                    ((e.clientY - (r.top + r.height / 2)) * s) + "px)";
            });
            el.addEventListener("pointerleave", function () { el.style.transform = ""; });
        });

        /* Tilt cards */
        document.querySelectorAll(".tilt").forEach(function (el) {
            var max = 9;
            el.addEventListener("pointermove", function (e) {
                var r = el.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width;
                var py = (e.clientY - r.top) / r.height;
                el.style.transform = "perspective(900px) rotateX(" + ((0.5 - py) * 2 * max).toFixed(2) +
                    "deg) rotateY(" + ((px - 0.5) * 2 * max).toFixed(2) + "deg) scale(1.02)";
            });
            el.addEventListener("pointerleave", function () { el.style.transform = ""; });
        });
    }

    /* ================= Hero ripple grid (canvas 2D) ================= */
    var canvas = document.getElementById("ripple");
    if (canvas) {
        var ctx = canvas.getContext("2d");
        var SPACING = 26, RADIUS = 110;
        var dots = [], mouse = { x: -9999, y: -9999 }, host = canvas.parentElement;

        var build = function () {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var rect = host.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + "px";
            canvas.style.height = rect.height + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            dots = [];
            for (var x = SPACING / 2; x < rect.width; x += SPACING) {
                for (var yy = SPACING / 2; yy < rect.height; yy += SPACING) {
                    dots.push({ x: x, y: yy, energy: 0 });
                }
            }
        };

        var draw = function () {
            var rect = host.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);
            var base = root.classList.contains("dark") ? "148,163,184" : "71,85,105";
            for (var i = 0; i < dots.length; i++) {
                var d = dots[i];
                var dist = Math.hypot(d.x - mouse.x, d.y - mouse.y);
                if (dist < RADIUS) {
                    var wave = Math.sin((1 - dist / RADIUS) * Math.PI);
                    if (wave > d.energy) d.energy = wave;
                }
                d.energy *= 0.94;
                var e = d.energy;
                ctx.beginPath();
                ctx.arc(d.x, d.y, 1.4 + e * 3, 0, Math.PI * 2);
                ctx.fillStyle = e > 0.08 ? "rgba(212,175,55," + (0.15 + e * 0.6) + ")" : "rgba(" + base + ",0.16)";
                ctx.fill();
            }
        };

        build();
        window.addEventListener("resize", function () { build(); if (reduce) draw(); });

        if (reduce || !pointerFx) {
            draw();
        } else {
            host.addEventListener("pointermove", function (e) {
                var r = canvas.getBoundingClientRect();
                mouse.x = e.clientX - r.left;
                mouse.y = e.clientY - r.top;
            });
            host.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
            var loop = function () { draw(); requestAnimationFrame(loop); };
            requestAnimationFrame(loop);
        }
    }
})();
