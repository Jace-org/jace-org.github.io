/* Jhapendra Kandel — site interactions. Vanilla, zero dependencies.
   Live headline from abcnews.com.np, Kathmandu clock, work index,
   method slider, section entrances, mobile menu. */
(function () {
    "use strict";

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Year ---------- */
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();

    /* ---------- Fit the hero name to the measure on one line ---------- */
    var heroName = document.querySelector(".hero-name");
    if (heroName) {
        var fit = function () {
            heroName.style.fontSize = "";
            if (window.innerWidth <= 640) return;
            var avail = heroName.parentElement.clientWidth -
                parseFloat(getComputedStyle(heroName.parentElement).paddingLeft) * 2;
            var w = heroName.getBoundingClientRect().width;
            if (w > 0 && avail > 0) {
                var cur = parseFloat(getComputedStyle(heroName).fontSize);
                heroName.style.fontSize = Math.min(cur * avail / w, 176) + "px";
            }
        };
        fit();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
        window.addEventListener("resize", fit);
    }

    /* ---------- Mobile menu ---------- */
    var menuBtn = document.getElementById("menu-btn");
    var navLinks = document.getElementById("nav-links");
    if (menuBtn && navLinks) {
        var setMenu = function (open) {
            navLinks.classList.toggle("open", open);
            menuBtn.setAttribute("aria-expanded", String(open));
            menuBtn.textContent = open ? "Close" : "Menu";
        };
        menuBtn.addEventListener("click", function () {
            setMenu(!navLinks.classList.contains("open"));
        });
        navLinks.addEventListener("click", function (e) {
            if (e.target.tagName === "A") setMenu(false);
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && navLinks.classList.contains("open")) { setMenu(false); menuBtn.focus(); }
        });
    }

    /* ---------- Kathmandu clock ---------- */
    var ktm = document.getElementById("ktm-time");
    if (ktm && window.Intl) {
        var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit" });
        var tickClock = function () { ktm.textContent = fmt.format(new Date()) + " in Kathmandu"; };
        tickClock();
        setInterval(tickClock, 30000);
    }

    /* ---------- Live headline from the news site I built ---------- */
    var liveLink = document.getElementById("live-link");
    var liveWhen = document.getElementById("live-when");
    if (liveLink && window.fetch) {
        var ago = function (date) {
            var mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
            if (mins < 1) return "just now";
            if (mins < 60) return mins + (mins === 1 ? " minute" : " minutes") + " ago";
            var h = Math.round(mins / 60);
            if (h < 24) return h + (h === 1 ? " hour" : " hours") + " ago";
            var d = Math.round(h / 24);
            return d + (d === 1 ? " day" : " days") + " ago";
        };
        var decode = function (html) {
            var doc = new DOMParser().parseFromString(html, "text/html");
            return (doc.body.textContent || "").trim();
        };
        var ctl = window.AbortController ? new AbortController() : null;
        if (ctl) setTimeout(function () { ctl.abort(); }, 8000);
        fetch("https://abcnews.com.np/wp-json/wp/v2/posts?per_page=1&_fields=title,link,date_gmt",
            ctl ? { signal: ctl.signal } : {})
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function (posts) {
                var p = posts && posts[0];
                if (!p || !p.title || !p.link) return;
                var title = decode(p.title.rendered || "");
                if (!title) return;
                liveLink.textContent = title;
                if (/^https:\/\/abcnews\.com\.np\//.test(p.link)) liveLink.href = p.link;
                if (p.date_gmt && liveWhen) {
                    var when = new Date(p.date_gmt + "Z");
                    var setWhen = function () { liveWhen.textContent = "Published " + ago(when) + " by the pipeline I wrote"; };
                    setWhen();
                    setInterval(setWhen, 60000);
                }
            })
            .catch(function () { /* the plain link stays */ });
    }

    /* ---------- Work index: names drive the frame ---------- */
    var list = document.getElementById("work-list");
    var frame = document.getElementById("work-frame");
    if (list && frame) {
        var items = Array.prototype.slice.call(list.querySelectorAll(".work-item"));
        var pics = document.createElement("div");
        pics.className = "frame-pics";
        var desc = document.createElement("p");
        desc.className = "frame-desc";
        desc.setAttribute("aria-live", "polite");
        var imgs = items.map(function (it, i) {
            var src = it.querySelector(".work-pic img");
            var img = src.cloneNode(true);
            img.removeAttribute("loading");
            if (i === 0) img.classList.add("is-on");
            pics.appendChild(img);
            return img;
        });
        frame.appendChild(pics);
        frame.appendChild(desc);
        frame.removeAttribute("aria-hidden");

        var activate = function (i) {
            items.forEach(function (it, k) {
                it.classList.toggle("is-active", k === i);
                imgs[k].classList.toggle("is-on", k === i);
            });
            desc.textContent = items[i].querySelector(".work-desc").textContent;
        };
        activate(0);
        items.forEach(function (it, i) {
            var name = it.querySelector(".work-name");
            name.addEventListener("pointerenter", function () { activate(i); });
            name.addEventListener("focus", function () { activate(i); });
            if (name.tagName === "BUTTON") name.addEventListener("click", function () { activate(i); });
        });
    }

    /* ---------- Method slider ---------- */
    var stage = document.getElementById("stage");
    if (stage) {
        var stages = [
            { name: "Build", clause: "Build it with precision.", tools: "HTML, CSS, JavaScript, React, PHP, Python, MySQL and WordPress, across the front end and the back." },
            { name: "Secure", clause: "Secure it by design.", tools: "Ethical hacking, penetration testing and network security. Every input is untrusted until proven otherwise." },
            { name: "Automate", clause: "Automate with purpose.", tools: "Python pipelines, cron, language models, RAG and the Model Context Protocol doing the repetitive work." },
            { name: "Run", clause: "Then run it myself.", tools: "Linux, Docker and Compose, Nginx, Cloudflare tunnels, an Orange Pi at home and a GPU box for training." }
        ];
        var clause = document.getElementById("method-clause");
        var tools = document.getElementById("method-tools");
        var frags = document.querySelectorAll(".frag");
        var stops = document.querySelectorAll("#method-stops button");
        var show = function (i) {
            i = Math.max(0, Math.min(3, i | 0));
            stage.value = String(i);
            stage.style.setProperty("--p", (i / 3 * 100) + "%");
            stage.setAttribute("aria-valuetext", stages[i].name);
            clause.textContent = stages[i].clause;
            tools.textContent = stages[i].tools;
            frags.forEach(function (f) { f.classList.toggle("is-on", f.getAttribute("data-stage") === String(i)); });
            stops.forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-to") === String(i)); });
        };
        stage.addEventListener("input", function () { show(+stage.value); });
        stops.forEach(function (b) {
            b.addEventListener("click", function () { show(+b.getAttribute("data-to")); });
        });
        show(0);
    }

    /* ---------- Section entrances: parts arrive in reading order ---------- */
    var risers = Array.prototype.slice.call(document.querySelectorAll("[data-rise]"));
    var groups = new Map();
    risers.forEach(function (el) {
        var host = el.closest("section, figure.manuscript") || document.body;
        var n = groups.get(host) || 0;
        el.style.setProperty("--i", String(Math.min(n, 8)));
        groups.set(host, n + 1);
    });
    if (!reduce && "IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
            });
        }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
        risers.forEach(function (el) { io.observe(el); });
        // Safety net: never leave content hidden.
        setTimeout(function () {
            risers.forEach(function (el) {
                var r = el.getBoundingClientRect();
                if (r.top < innerHeight && r.bottom > 0) el.classList.add("in");
            });
        }, 1500);
    } else {
        risers.forEach(function (el) { el.classList.add("in"); });
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
})();
