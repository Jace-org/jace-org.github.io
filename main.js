/* Jhapendra Kandel — the front page. Vanilla + GSAP/ScrollTrigger (optional).
   Everything is readable without this file; motion only ever animates *from*
   a hidden state that GSAP itself sets, so a failed CDN never hides content. */
(function () {
    "use strict";

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

    /* ---------- Year ---------- */
    var y = $("#year");
    if (y) y.textContent = new Date().getFullYear();

    /* ---------- Mobile menu ---------- */
    var menuBtn = $("#menu-btn"), navLinks = $("#nav-links");
    if (menuBtn && navLinks) {
        var setMenu = function (open) {
            navLinks.classList.toggle("open", open);
            menuBtn.setAttribute("aria-expanded", String(open));
            menuBtn.textContent = open ? "Close" : "Menu";
        };
        menuBtn.addEventListener("click", function () { setMenu(!navLinks.classList.contains("open")); });
        navLinks.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && navLinks.classList.contains("open")) { setMenu(false); menuBtn.focus(); }
        });
    }

    /* ---------- Current section in the nav ---------- */
    if ("IntersectionObserver" in window) {
        var navMap = {};
        $$('.nav-links a[href^="#"]').forEach(function (a) { navMap[a.getAttribute("href").slice(1)] = a; });
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                var a = navMap[en.target.id];
                if (a && en.isIntersecting) {
                    $$(".nav-links a.is-here").forEach(function (x) { x.classList.remove("is-here"); });
                    a.classList.add("is-here");
                }
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        Object.keys(navMap).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
    }

    /* ---------- Kathmandu clock ---------- */
    var ktm = $("#ktm-time");
    if (ktm && window.Intl) {
        var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit" });
        var tick = function () { ktm.textContent = fmt.format(new Date()); };
        tick();
        setInterval(tick, 15000);
    }

    /* ---------- Motto: the three clauses take turns ---------- */
    var motto = $$("#motto span");
    if (motto.length && !reduce) {
        var mi = 0;
        setInterval(function () {
            motto[mi].classList.remove("is-on");
            mi = (mi + 1) % motto.length;
            motto[mi].classList.add("is-on");
        }, 2600);
    }

    /* ---------- The wire: real headlines from abcnews.com.np ---------- */
    var wire = $("#wire"), wireList = $("#wire-list");
    if (wire && wireList && window.fetch) {
        var ago = function (date) {
            var mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
            if (mins < 1) return "now";
            if (mins < 60) return mins + "m ago";
            var h = Math.round(mins / 60);
            if (h < 24) return h + "h ago";
            return Math.round(h / 24) + "d ago";
        };
        var decode = function (html) {
            var doc = new DOMParser().parseFromString(html, "text/html");
            return (doc.body.textContent || "").trim();
        };
        var ctl = window.AbortController ? new AbortController() : null;
        if (ctl) setTimeout(function () { ctl.abort(); }, 8000);
        fetch("https://abcnews.com.np/wp-json/wp/v2/posts?per_page=8&_fields=title,link,date_gmt", ctl ? { signal: ctl.signal } : {})
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function (posts) {
                if (!Array.isArray(posts) || !posts.length) return;
                var frag = document.createDocumentFragment();
                posts.forEach(function (p) {
                    var title = p && p.title ? decode(p.title.rendered || "") : "";
                    if (!title || !/^https:\/\/abcnews\.com\.np\//.test(p.link || "")) return;
                    var li = document.createElement("li");
                    if (p.date_gmt) {
                        var t = document.createElement("time");
                        t.dateTime = p.date_gmt + "Z";
                        t.textContent = ago(new Date(p.date_gmt + "Z"));
                        li.appendChild(t);
                    }
                    var a = document.createElement("a");
                    a.href = p.link; a.target = "_blank"; a.rel = "noopener";
                    a.textContent = title;
                    li.appendChild(a);
                    frag.appendChild(li);
                });
                if (!frag.childNodes.length) return;
                wireList.innerHTML = "";
                wireList.appendChild(frag);
                wire.classList.add("is-ready");
                if (reduce) return;
                // duplicate once for a seamless loop; the copy is hidden from AT
                $$("li", wireList).forEach(function (li) {
                    var c = li.cloneNode(true);
                    c.setAttribute("aria-hidden", "true");
                    $$("a", c).forEach(function (a) { a.tabIndex = -1; });
                    wireList.appendChild(c);
                });
                var w = wireList.scrollWidth / 2;
                wire.style.setProperty("--wire-dur", Math.max(30, w / 70) + "s");
                wire.classList.add("is-moving");
            })
            .catch(function () { /* bar stays hidden */ });
    }

    /* ---------- Method slider ---------- */
    var stage = $("#stage"), method = $("#method");
    if (stage && method) {
        var stages = [
            { name: "Build", clause: "Build it with precision.", tools: "HTML, CSS, JavaScript, React, PHP, Python, MySQL and WordPress, across the front end and the back." },
            { name: "Secure", clause: "Secure it by design.", tools: "Ethical hacking, penetration testing and network security. Every input is untrusted until proven otherwise." },
            { name: "Automate", clause: "Automate with purpose.", tools: "Python pipelines, cron, language models, RAG and the Model Context Protocol doing the repetitive work." },
            { name: "Run", clause: "Then run it myself.", tools: "Linux, Docker and Compose, Nginx, Cloudflare tunnels, an Orange Pi at home and a GPU box for training." }
        ];
        var clause = $("#method-clause"), tools = $("#method-tools");
        var frags = $$(".frag"), stops = $$("#method-stops button");
        var cur = -1;
        var show = function (i) {
            i = Math.max(0, Math.min(3, i | 0));
            if (i === cur) return;
            cur = i;
            stage.value = String(i);
            stage.setAttribute("aria-valuetext", stages[i].name);
            method.setAttribute("data-stage", String(i));
            clause.textContent = stages[i].clause;
            tools.textContent = stages[i].tools;
            frags.forEach(function (f) { f.classList.toggle("is-on", f.getAttribute("data-stage") === String(i)); });
            stops.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-to") === String(i)); });
            if (window.gsap && !reduce) gsap.fromTo(clause, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: "power3.out" });
        };
        stage.addEventListener("input", function () { show(+stage.value); });
        stops.forEach(function (b) { b.addEventListener("click", function () { show(+b.getAttribute("data-to")); }); });
        show(0);
    }

    /* ---------- Contact submit state ---------- */
    var form = $("#contact-form");
    if (form) form.addEventListener("submit", function () {
        var b = $("#submit");
        if (b) { b.disabled = true; b.textContent = "Sending…"; }
    });

    /* ---------- Back to top ---------- */
    var bt = $("#back-top");
    if (bt) bt.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

    /* ================= Motion (GSAP) ================= */
    if (reduce || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    var mm = gsap.matchMedia();

    // 1. Masthead: the name rises out of its own baseline, then the deck follows.
    var intro = gsap.timeline({ defaults: { ease: "expo.out" } });
    intro.from(".mast-word", { yPercent: 105, duration: 1.2, stagger: .12 })
        .from(".mast-jk", { opacity: 0, x: -20, duration: .8 }, "-=.7")
        .from(".mast-grid > *", { y: 40, opacity: 0, duration: .9, stagger: .09 }, "-=.8");

    // The photo slowly pushes in as the masthead scrolls away.
    gsap.to(".mast-photo img", {
        scale: 1.18, yPercent: 6, ease: "none",
        scrollTrigger: { trigger: ".mast", start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".mast-name", {
        yPercent: -14, ease: "none",
        scrollTrigger: { trigger: ".mast", start: "top top", end: "bottom top", scrub: true }
    });

    // 2. Section parts arrive in reading order, staggered, once.
    var risers = $$("[data-rise]").filter(function (el) { return !el.closest(".mast"); });
    gsap.set(risers, { y: 28, opacity: 0 });
    ScrollTrigger.batch(risers, {
        start: "top 90%",
        once: true,
        onEnter: function (batch) { gsap.to(batch, { y: 0, opacity: 1, duration: .8, ease: "power3.out", stagger: .08, overwrite: true }); }
    });
    // Safety net: anything still hidden after load becomes visible when in view.
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });

    // 3. Fact tiles: tilt in, numbers count up.
    gsap.from(".fact", {
        rotate: function (i) { return [-4, 3, -2, 4][i % 4]; }, transformOrigin: "50% 100%",
        duration: 1, ease: "back.out(1.6)", stagger: .08,
        scrollTrigger: { trigger: ".facts", start: "top 85%", once: true }
    });
    $$("[data-count]").forEach(function (el) {
        var end = +el.getAttribute("data-count"), o = { v: 0 };
        gsap.to(o, {
            v: end, duration: 1.4, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onUpdate: function () { el.textContent = Math.round(o.v); }
        });
    });

    // 4. Section titles: letters of the heavy heads slide up from a mask.
    $$(".sec-h, .hackme-h, .contact-h").forEach(function (h) {
        gsap.from(h, {
            yPercent: 30, skewY: 3, duration: 1.1, ease: "expo.out",
            scrollTrigger: { trigger: h, start: "top 88%", once: true }
        });
    });

    // 5. The stream: pinned and scrolled sideways on wide screens.
    mm.add("(min-width: 900px)", function () {
        var work = $("#work"), pin = $("#stream-pin"), stream = $("#stream");
        if (!work || !pin || !stream) return;
        work.classList.add("is-h");
        var dist = function () { return Math.max(0, stream.scrollWidth - window.innerWidth); };
        var tween = gsap.to(stream, {
            x: function () { return -dist(); }, ease: "none",
            scrollTrigger: {
                trigger: pin, start: "center center", end: function () { return "+=" + dist(); },
                pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1
            }
        });
        $$(".story", stream).forEach(function (s) {
            gsap.from(s.querySelector(".story-pic img"), {
                scale: 1.25, ease: "none",
                scrollTrigger: { trigger: s, containerAnimation: tween, start: "left right", end: "center center", scrub: true }
            });
            gsap.from(s.querySelectorAll(".story-copy > *"), {
                x: 60, opacity: 0, stagger: .06, ease: "power2.out",
                scrollTrigger: { trigger: s, containerAnimation: tween, start: "left 75%", end: "left 35%", scrub: true }
            });
        });
        return function () { work.classList.remove("is-h"); gsap.set(stream, { clearProps: "x" }); };
    });
    mm.add("(max-width: 899px)", function () {
        $$(".story").forEach(function (s) {
            gsap.from(s, { y: 60, rotate: 1.5, opacity: 0, duration: .9, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 88%", once: true } });
        });
    });

    // 6. The board: bars fill and numbers run up, row by row.
    $$("#board li").forEach(function (li, i) {
        var bar = li.querySelector(".b-bar i"), val = li.querySelector(".b-val"), end = +li.getAttribute("data-v"), o = { v: 0 };
        var tl = gsap.timeline({ scrollTrigger: { trigger: li, start: "top 92%", once: true }, delay: (i % 4) * .05 });
        tl.from(li, { x: -30, opacity: 0, duration: .6, ease: "power3.out" })
          .from(bar, { scaleX: 0, duration: 1.2, ease: "expo.out" }, "-=.4")
          .to(o, { v: end, duration: 1.2, ease: "expo.out", onUpdate: function () { val.textContent = Math.round(o.v); } }, "<");
    });

    // 7. Journey: the rail fills as you read.
    var fill = $("#journey-fill");
    if (fill) gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: ".journey-wrap", start: "top 70%", end: "bottom 70%", scrub: true }
    });

    // 8. The manuscript drifts sideways with the scroll.
    var leaf = $(".manuscript-strip img");
    if (leaf) gsap.fromTo(leaf, { x: 0 }, {
        x: function () { return -Math.max(0, leaf.offsetWidth - leaf.parentElement.offsetWidth); }, ease: "none",
        scrollTrigger: { trigger: ".manuscript", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true }
    });

    // 9. Hack Me: the screenshot tilts into place.
    gsap.fromTo(".hackme-pic", { rotate: 7, y: 80 }, {
        rotate: -2, y: -20, ease: "none",
        scrollTrigger: { trigger: ".hackme", start: "top bottom", end: "bottom top", scrub: true }
    });

    // 10. Footer wordmark climbs into frame.
    gsap.from(".wordmark span", {
        yPercent: 70, ease: "none",
        scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "bottom bottom", scrub: true }
    });

    // 11. Magnetic buttons on pointer devices.
    mm.add("(hover: hover) and (pointer: fine)", function () {
        $$(".btn, .nav-cta, .story-go").forEach(function (b) {
            var xTo = gsap.quickTo(b, "x", { duration: .4, ease: "power3" }),
                yTo = gsap.quickTo(b, "y", { duration: .4, ease: "power3" });
            b.addEventListener("pointermove", function (e) {
                var r = b.getBoundingClientRect();
                xTo((e.clientX - r.left - r.width / 2) * .25);
                yTo((e.clientY - r.top - r.height / 2) * .35);
            });
            b.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
        });
    });
})();
