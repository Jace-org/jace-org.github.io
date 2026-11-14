/* /new-test — the printed front page. Vanilla + GSAP/ScrollTrigger (optional).
   Everything is readable without this file; motion only animates *from* a state GSAP itself sets. */
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
            document.documentElement.style.overflow = open ? "hidden" : "";
        };
        menuBtn.addEventListener("click", function () { setMenu(!navLinks.classList.contains("open")); });
        navLinks.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && navLinks.classList.contains("open")) { setMenu(false); menuBtn.focus(); }
        });
        window.matchMedia("(min-width: 1100px)").addEventListener("change", function (e) { if (e.matches) setMenu(false); });
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

    /* ---------- Kathmandu clock in the dateline ---------- */
    var ktm = $("#ktm-time");
    if (ktm && window.Intl) {
        var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        var tick = function () { ktm.textContent = fmt.format(new Date()).replace(",", "") + " · UTC+5:45"; };
        tick();
        setInterval(tick, 15000);
    }

    /* ---------- The room: photographs take turns ---------- */
    var shots = $$("#front-photo img");
    if (shots.length > 1 && !reduce) {
        var si = 0;
        setInterval(function () {
            if (document.hidden) return;
            var next = shots[(si + 1) % shots.length];
            if (!next.complete) { next.loading = "eager"; return; }
            shots[si].classList.remove("is-on");
            si = (si + 1) % shots.length;
            shots[si].classList.add("is-on");
        }, 6000);
        // fetch the second picture shortly after first paint so the first change is clean
        setTimeout(function () { shots[1].loading = "eager"; }, 2500);
    }

    /* ---------- Live from abcnews.com.np: the newest headlines, printed on the sheet ---------- */
    var TB = window.TechBriefing;
    var wireList = $("#wire-list");
    var agoOf = TB && TB.ago ? TB.ago : function () { return ""; };
    if (wireList && window.fetch) {
        var WIRE_API = "https://abcnews.com.np/wp-json/wp/v2/posts?per_page=8&_fields=title,link,date_gmt";
        var WIRE_HOST = "abcnews.com.np";
        var decode = function (html) {
            var doc = new DOMParser().parseFromString(html, "text/html");
            return (doc.body.textContent || "").trim();
        };
        var wireOk = function (href) {
            try { var u = new URL(href); return u.protocol === "https:" && u.hostname === WIRE_HOST; } catch (e) { return false; }
        };
        var ctl = window.AbortController ? new AbortController() : null;
        if (ctl) setTimeout(function () { ctl.abort(); }, 8000);
        fetch(WIRE_API, ctl ? { signal: ctl.signal } : {})
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function (posts) {
                if (!Array.isArray(posts) || !posts.length) return;
                var frag = document.createDocumentFragment(), n = 0;
                posts.forEach(function (p) {
                    if (n >= 4) return;
                    var title = p && p.title ? decode(p.title.rendered || "") : "";
                    if (!title || !wireOk(p.link || "")) return;
                    var li = document.createElement("li");
                    if (p.date_gmt) {
                        var t = document.createElement("time");
                        t.dateTime = p.date_gmt + "Z";
                        t.textContent = agoOf(new Date(p.date_gmt + "Z"));
                        li.appendChild(t);
                    }
                    var a = document.createElement("a");
                    a.href = p.link; a.target = "_blank"; a.rel = "noopener noreferrer";
                    a.textContent = title;
                    li.appendChild(a);
                    frag.appendChild(li);
                    n++;
                });
                if (!n) return;
                wireList.textContent = "";
                wireList.appendChild(frag);
                if (window.gsap && !reduce) gsap.from(wireList.children, { y: 14, opacity: 0, duration: .5, stagger: .07, ease: "power3.out", clearProps: "transform,opacity" });
            })
            .catch(function () { /* the static link stays */ });
    }

    /* ---------- Tech Briefing block ---------- */
    var techb = $("#tech"), techbGrid = $("#techb-grid");
    function refreshTriggers() { if (window.ScrollTrigger) { try { ScrollTrigger.refresh(); } catch (e) { } } }
    if (TB && techb && techbGrid) {
        TB.load()
            .then(function (posts) {
                var frag = TB.buildCards(posts.slice(0, 4));
                if (!frag.childNodes.length) return;
                // story links are built relative to the site root; this page lives one folder down
                $$("a", frag).forEach(function (a) {
                    var h = a.getAttribute("href") || "";
                    if (h.indexOf("tech/") === 0) a.setAttribute("href", "/" + h);
                });
                techbGrid.appendChild(frag);
                techb.classList.add("is-ready");
                refreshTriggers();
            })
            .catch(function () { /* block stays hidden */ });
    }

    /* ---------- Data widgets: Now strip + Tech news ---------- */
    if (window.renderNow && $("#now-strip")) Promise.resolve(renderNow($("#now-strip"))).then(refreshTriggers);
    if (window.renderHN && $("#hn-card")) Promise.resolve(renderHN($("#hn-card"))).then(refreshTriggers);

    /* ---------- Method: four verbs ---------- */
    var method = $("#method");
    if (method) {
        var stages = [
            { clause: "Build it with precision.", tools: "HTML, CSS, JavaScript, React, PHP, Python, MySQL and WordPress, across the front end and the back." },
            { clause: "Secure it by design.", tools: "Ethical hacking, penetration testing and network security. Every input is untrusted until proven otherwise." },
            { clause: "Automate with purpose.", tools: "Python pipelines, cron, language models, RAG and the Model Context Protocol doing the repetitive work." },
            { clause: "Then run it myself.", tools: "Linux, Docker and Compose, Nginx, Cloudflare tunnels, an Orange Pi at home and a GPU box for training." }
        ];
        var clause = $("#method-clause"), tools = $("#method-tools");
        var frags = $$(".frag"), stops = $$("#method-stops button");
        var cur = 0;
        var show = function (i) {
            i = (i + 4) % 4;
            if (i === cur) return;
            cur = i;
            method.setAttribute("data-stage", String(i));
            clause.textContent = stages[i].clause;
            tools.textContent = stages[i].tools;
            frags.forEach(function (f) { f.classList.toggle("is-on", f.getAttribute("data-stage") === String(i)); });
            stops.forEach(function (b) {
                var on = b.getAttribute("data-to") === String(i);
                b.classList.toggle("is-on", on);
                b.setAttribute("aria-pressed", String(on));
            });
            if (window.gsap && !reduce) {
                gsap.fromTo(clause, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: "power3.out" });
                gsap.fromTo(tools, { opacity: 0 }, { opacity: 1, duration: .5, delay: .08 });
            }
        };
        stops.forEach(function (b, i) {
            b.addEventListener("click", function () { show(+b.getAttribute("data-to")); });
            b.addEventListener("keydown", function (e) {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                var to = (i + (e.key === "ArrowRight" ? 1 : 3)) % 4;
                stops[to].focus(); show(to);
            });
        });
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

    // 1. Front page: the stripe draws, the name rises from its baseline, the rest follows in reading order.
    gsap.timeline({ defaults: { ease: "expo.out" } })
        .from(".stripe", { scaleX: 0, transformOrigin: "left", duration: 1 })
        .from(".front-line > span", { yPercent: 110, duration: 1.1, stagger: .1 }, .1)
        .from(".front [data-in]", { y: 26, opacity: 0, duration: .8, stagger: .08 }, .45)
        .from(".front-photo", { clipPath: "inset(0% 0% 100% 0%)", duration: 1.2, clearProps: "clipPath" }, .2);

    // The room drifts as the front page scrolls away.
    mm.add("(min-width: 900px)", function () {
        gsap.to(".front-photo img", { scale: 1.08, ease: "none", scrollTrigger: { trigger: ".front", start: "top top", end: "bottom top", scrub: true } });
    });

    // 2. Section parts arrive in reading order, staggered, once.
    var risers = $$("[data-rise]");
    gsap.set(risers, { y: 28, opacity: 0 });
    ScrollTrigger.batch(risers, {
        start: "top 90%", once: true,
        onEnter: function (batch) { gsap.to(batch, { y: 0, opacity: 1, duration: .8, ease: "power3.out", stagger: .08, overwrite: true }); }
    });
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });

    // 3. The slip: rows print one after another, numbers count up.
    gsap.from(".slip > *", { y: 12, opacity: 0, duration: .5, stagger: .06, ease: "power2.out", clearProps: "transform,opacity", scrollTrigger: { trigger: ".slip", start: "top 82%", once: true } });
    $$("[data-count]").forEach(function (el) {
        var end = +el.getAttribute("data-count"), o = { v: 0 };
        gsap.to(o, { v: end, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%", once: true }, onUpdate: function () { el.textContent = Math.round(o.v); } });
    });

    // 4. Story pictures open like a shutter.
    $$(".story-pic, .entry-pic figure").forEach(function (el) {
        gsap.from(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "expo.out", clearProps: "clipPath", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });
    gsap.from(".also-list li", { y: 20, opacity: 0, duration: .6, stagger: .06, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: ".also-list", start: "top 85%", once: true } });

    // 5. The board: bars fill from the left, values run up.
    $$("#board li").forEach(function (li, i) {
        var fill = li.querySelector(".b-fill"), val = li.querySelector(".b-val"), end = +li.getAttribute("data-v"), o = { v: 0 };
        gsap.timeline({ scrollTrigger: { trigger: li, start: "top 92%", once: true }, delay: (i % 4) * .05 })
            .from(fill, { clipPath: "inset(0% 100% 0% 0%)", duration: 1.1, ease: "expo.out", clearProps: "clipPath" })
            .to(o, { v: end, duration: 1.1, ease: "expo.out", onUpdate: function () { val.textContent = Math.round(o.v); } }, "<");
    });

    // 6. Journey: the rail fills as you read.
    var fillEl = $("#journey-fill");
    if (fillEl) gsap.fromTo(fillEl, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".journey-list", start: "top 70%", end: "bottom 70%", scrub: true } });
    $$(".chips").forEach(function (c) {
        gsap.from(c.children, { y: 12, opacity: 0, duration: .5, stagger: .05, ease: "power2.out", clearProps: "transform,opacity", scrollTrigger: { trigger: c, start: "top 92%", once: true } });
    });

    // 7. The manuscript drifts sideways with the scroll.
    var leaf = $(".manuscript-strip img");
    if (leaf) gsap.fromTo(leaf, { x: 0 }, {
        x: function () { return -Math.max(0, leaf.offsetWidth - leaf.parentElement.offsetWidth); }, ease: "none",
        scrollTrigger: { trigger: ".manuscript", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true }
    });

    // 8. Hack Me: the screenshot swings into place.
    gsap.fromTo(".hackme-pic", { rotate: 6, y: 60 }, { rotate: -2, y: 0, ease: "none", scrollTrigger: { trigger: ".hackme", start: "top bottom", end: "center center", scrub: true } });

    // 9. The programme settles onto the table; the coupon and the postcard slide in.
    gsap.fromTo(".programme", { rotate: 3 }, { rotate: -1, ease: "none", scrollTrigger: { trigger: ".creds", start: "top bottom", end: "top 30%", scrub: true } });
    gsap.from(".prog-list li", { y: 14, opacity: 0, duration: .5, stagger: .06, ease: "power2.out", clearProps: "transform,opacity", scrollTrigger: { trigger: ".prog-cols", start: "top 85%", once: true } });
    gsap.from(".post-jk", { yPercent: 40, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".postcard", start: "top 88%", once: true } });
    gsap.from(".post-stamp", { rotate: -20, scale: .6, opacity: 0, duration: .8, ease: "back.out(2)", scrollTrigger: { trigger: ".postcard", start: "top 75%", once: true } });

    // 10. Magnetic buttons on pointer devices.
    mm.add("(hover: hover) and (pointer: fine)", function () {
        $$(".btn, .nav-cta").forEach(function (b) {
            var xTo = gsap.quickTo(b, "x", { duration: .4, ease: "power3" }),
                yTo = gsap.quickTo(b, "y", { duration: .4, ease: "power3" });
            b.addEventListener("pointermove", function (e) {
                var r = b.getBoundingClientRect();
                xTo((e.clientX - r.left - r.width / 2) * .2);
                yTo((e.clientY - r.top - r.height / 2) * .3);
            });
            b.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
        });
    });
})();
