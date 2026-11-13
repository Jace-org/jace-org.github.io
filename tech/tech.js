/* Tech Briefing: short cards read from the data hub (tech.json). Vanilla JS, textContent only.
   Needs widgets/data-base.js + widgets/hub.js loaded first. Loaded on /tech/ (renders the grid)
   and on the homepage (shared helpers for the ticker and the "Tech Briefing" block via window.TechBriefing). */
(function () {
    "use strict";

    var LINK_HOST = "abcnews.com.np"; // the only host item links may point to (with the hub's DATA_BASE, the only host constant here)
    // Publishers a story's original article may live on (one list; keep in step with the hub's allowlist).
    var SOURCE_HOSTS = ["theverge.com", "arstechnica.com", "techcrunch.com", "wired.com", "theregister.com",
        "engadget.com", "restofworld.org", "technologyreview.com", "thehackernews.com", "nepalitelecom.com"];
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

    // Original-article link: https, parsed hostname EXACTLY a SOURCE_HOSTS entry or "www." + entry (no other subdomains),
    // port absent or 443, host matches [a-z0-9.-]+ (no trailing dot / percent), no userinfo, <= 500 chars, no control
    // chars or whitespace. Same rule as build_snapshot.safe_source. Returns "" on failure (caller uses the story link).
    function safeSource(href) {
        if (typeof href !== "string" || href.length > 500 || href.indexOf("\\") >= 0 || /[\u0000-\u0020\u007f-\u009f]/.test(href)) return "";
        if (/^[^:]*:\/\/[^\/?#]*@/.test(href)) return "";
        try {
            var u = new URL(href);
            if (u.protocol !== "https:" || u.username || u.password) return "";
            if (u.port !== "" && u.port !== "443") return "";
            var h = u.hostname;
            if (!/^[a-z0-9.-]+$/.test(h) || h.charAt(h.length - 1) === ".") return "";
            var ok = SOURCE_HOSTS.some(function (d) { return h === d || h === "www." + d; });
            return ok ? u.href : "";
        } catch (e) { return ""; }
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
                var link = safeLink(it.link);
                var href = safeSource(it.source_url) || link;
                var when = window.Hub.date(typeof it.date_gmt === "string" && !/[zZ]|[+-]\d\d:?\d\d$/.test(it.date_gmt) ? it.date_gmt + "Z" : it.date_gmt);
                if (!title || !href) return;
                out.push({ title: title, href: href, when: when, summary: trim(window.Hub.str(it.summary, 600), SUMMARY_MAX) });
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
        a.target = "_blank";
        a.rel = "noopener noreferrer";
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

    window.TechBriefing = { ago: ago, load: load, buildCards: buildCards, safeSource: safeSource };

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

    load().then(function (items) {
        if (!items.length) return; // keep the build-time snapshot
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
    }).catch(function () { /* keep the snapshot */ });
})();
