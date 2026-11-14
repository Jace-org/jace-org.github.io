/* Tech Briefing: short cards read from the data hub (tech.json). Vanilla JS, textContent only.
   Needs widgets/data-base.js + widgets/hub.js loaded first. Loaded on /tech/ (renders the grid)
   and on the homepage (shared helpers for the ticker and the "Tech Briefing" block via window.TechBriefing). */
(function () {
    "use strict";

    var LINK_HOST = "abcnews.com.np"; // the only host item links may be on; used ONLY to derive the story slug, never rendered
    var SLUG_RE = /^[a-z0-9-]{3,200}$/;
    // Stories open on this site: /tech/?story=<slug>. On /tech/ the relative form is "?story=", elsewhere "tech/?story=".
    var STORY_BASE = document.getElementById("tech-grid") ? "?story=" : "tech/?story=";
    var PER_PAGE = 12;
    var SUMMARY_MAX = 140;

    function ago(date) {
        var mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
        if (mins < 1) return "now";
        if (mins < 60) return mins + "m ago";
        var h = Math.round(mins / 60);
        if (h < 24) return h + "h ago";
        return Math.round(h / 24) + "d ago";
    }

    function trim(text, max) {
        if (text.length <= max) return text;
        var cut = text.slice(0, max);
        var sp = cut.lastIndexOf(" ");
        if (sp > max * 0.6) cut = cut.slice(0, sp);
        return cut.replace(/[\s,;:.–—-]+$/, "") + "…";
    }

    // https and LINK_HOST only
    function safeLink(href) {
        if (typeof href !== "string" || href.length > 2048) return "";
        try {
            var u = new URL(href);
            return u.protocol === "https:" && u.hostname === LINK_HOST && !u.username && !u.password ? u.href : "";
        } catch (e) { return ""; }
    }

    // slug = last non-empty path segment of the validated abcnews link; "" when it fails SLUG_RE
    function slugOf(link) {
        var href = safeLink(link);
        if (!href) return "";
        var segs = new URL(href).pathname.split("/").filter(Boolean);
        var seg = segs.length ? segs[segs.length - 1] : "";
        return SLUG_RE.test(seg) ? seg : "";
    }

    // Validated, normalised items from tech.json (max 48). Rejects the whole file on a bad shape.
    function load() {
        if (!window.Hub || !window.DATA_BASE) return Promise.reject(new Error("no hub"));
        return window.Hub.get("tech.json").then(function (d) {
            if (!Array.isArray(d.items)) throw new Error("bad items");
            var out = [];
            d.items.slice(0, 48).forEach(function (it) {
                if (!it || typeof it !== "object") return;
                var title = window.Hub.str(it.title, 300);
                var slug = slugOf(it.link);
                var when = window.Hub.date(typeof it.date_gmt === "string" && !/[zZ]|[+-]\d\d:?\d\d$/.test(it.date_gmt) ? it.date_gmt + "Z" : it.date_gmt);
                if (!title || !slug) return;
                var full = window.Hub.str(it.summary, 600);
                out.push({ title: title, slug: slug, href: STORY_BASE + slug, when: when, full: full, summary: trim(full, SUMMARY_MAX) });
            });
            return out;
        });
    }

    function buildCard(it) {
        var li = document.createElement("li");
        li.className = "tcard";
        var h = document.createElement("h3");
        h.textContent = it.title;
        li.appendChild(h);
        if (it.summary) {
            var s = document.createElement("p");
            s.className = "tcard-sum";
            s.textContent = it.summary;
            li.appendChild(s);
        }
        var foot = document.createElement("div");
        foot.className = "tcard-foot";
        if (it.when) {
            var t = document.createElement("time");
            t.dateTime = it.when.toISOString();
            t.textContent = ago(it.when);
            foot.appendChild(t);
        }
        var a = document.createElement("a");
        a.href = it.href;
        a.textContent = "Read full story";
        a.setAttribute("aria-label", "Read full story: " + it.title);
        foot.appendChild(a);
        li.appendChild(foot);
        return li;
    }

    function buildCards(items) {
        var frag = document.createDocumentFragment();
        items.forEach(function (it) { frag.appendChild(buildCard(it)); });
        return frag;
    }

    window.TechBriefing = { ago: ago, load: load, buildCards: buildCards, slugOf: slugOf };

    /* ---------- /tech/ page ---------- */
    var grid = document.getElementById("tech-grid");
    if (!grid) return;

    var more = document.getElementById("tech-more");
    var status = document.getElementById("tech-status");

    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
    var menuBtn = document.getElementById("menu-btn"), navLinks = document.getElementById("nav-links");
    if (menuBtn && navLinks) {
        menuBtn.addEventListener("click", function () {
            var open = !navLinks.classList.contains("open");
            navLinks.classList.toggle("open", open);
            menuBtn.setAttribute("aria-expanded", String(open));
            menuBtn.textContent = open ? "Close" : "Menu";
        });
    }

    var listing = document.getElementById("tech-listing");
    var storyEl = document.getElementById("tech-story");
    var BASE_TITLE = document.title;
    var items = [];
    var loaded = false;
    var failed = false;

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }

    function fmtDate(d) {
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }

    function backLink() {
        var a = el("a", "tstory-back", "Back to Tech Briefing");
        a.href = "./";
        return a;
    }

    function renderStory(slug) {
        storyEl.textContent = "";
        var it = null;
        if (SLUG_RE.test(slug)) {
            for (var i = 0; i < items.length; i++) if (items[i].slug === slug) { it = items[i]; break; }
        }
        var h = el("h1", "tstory-h");
        h.id = "tstory-h";
        h.tabIndex = -1;
        storyEl.setAttribute("aria-labelledby", "tstory-h");
        storyEl.appendChild(backLink());
        if (!it && !loaded && !failed) {
            h.textContent = "Loading story\u2026";
            storyEl.appendChild(h);
            document.title = "Tech Briefing | Jhapendra Kandel";
            return h;
        }
        if (!it) {
            h.textContent = loaded ? "Story not found" : "Story unavailable";
            storyEl.appendChild(h);
            storyEl.appendChild(el("p", "tstory-body", loaded
                ? "That story is no longer in the briefing, or the link is not right. The list shows what is current."
                : "The briefing could not be loaded just now. Please try again in a moment."));
            document.title = h.textContent + " | Tech Briefing | Jhapendra Kandel";
            return h;
        }
        h.textContent = it.title;
        storyEl.appendChild(h);
        if (it.when) {
            var t = el("time", "tstory-date", fmtDate(it.when));
            t.dateTime = it.when.toISOString();
            storyEl.appendChild(t);
        }
        if (it.full) storyEl.appendChild(el("p", "tstory-body", it.full));
        var others = items.filter(function (o) { return o.slug !== it.slug; }).slice(0, 4);
        if (others.length) {
            var sec = el("section", "tstory-more");
            var mh = el("h2", "tstory-more-h", "More stories");
            mh.id = "tstory-more-h";
            sec.setAttribute("aria-labelledby", "tstory-more-h");
            sec.appendChild(mh);
            var ul = el("ul", "tstory-list");
            others.forEach(function (o) {
                var li = document.createElement("li");
                var a = el("a", null, o.title);
                a.href = o.href;
                li.appendChild(a);
                ul.appendChild(li);
            });
            sec.appendChild(ul);
            storyEl.appendChild(sec);
        }
        document.title = it.title + " | Tech Briefing | Jhapendra Kandel";
        return h;
    }

    // Show the grid or the detail view for the current URL. focus: move focus to the heading.
    function route(focus) {
        var slug = new URLSearchParams(location.search).get("story");
        if (slug === null || !storyEl) {
            if (listing) listing.hidden = false;
            if (storyEl) { storyEl.hidden = true; storyEl.textContent = ""; }
            document.title = BASE_TITLE;
            if (focus) { var h1 = document.getElementById("tech-h"); if (h1) { h1.tabIndex = -1; h1.focus(); } }
            return;
        }
        if (listing) listing.hidden = true;
        storyEl.hidden = false;
        var heading = renderStory(slug);
        window.scrollTo(0, 0);
        if (focus) heading.focus();
    }

    // Same-tab internal navigation with history; modified clicks fall through to the browser (new tab etc.)
    document.addEventListener("click", function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target.closest ? e.target.closest("a") : null;
        if (!a || !a.closest("main")) return;
        var href = a.getAttribute("href");
        if (href !== "./" && !(href && href.indexOf("?story=") === 0)) return;
        e.preventDefault();
        history.pushState(null, "", href === "./" ? location.pathname : href);
        route(true);
    });
    window.addEventListener("popstate", function () { route(true); });

    var inStory = new URLSearchParams(location.search).get("story") !== null;
    if (inStory) route(false); // "Loading" state is covered by the first render below

    load().then(function (list) {
        items = list;
        loaded = true;
        if (items.length) {
            var shown = 0;
            var showMore = function () {
                grid.appendChild(buildCards(items.slice(shown, shown + PER_PAGE)));
                shown = Math.min(items.length, shown + PER_PAGE);
                if (more) more.hidden = shown >= items.length;
                if (status && shown >= items.length && items.length > PER_PAGE) status.textContent = "That is everything for now.";
            };
            grid.textContent = ""; // fresh data replaces the snapshot
            showMore();
            if (more) more.addEventListener("click", showMore);
        }
        if (new URLSearchParams(location.search).get("story") !== null) route(inStory);
    }).catch(function () { // keep the snapshot; a story URL gets the friendly message
        failed = true;
        if (new URLSearchParams(location.search).get("story") !== null) route(inStory);
    });
})();
