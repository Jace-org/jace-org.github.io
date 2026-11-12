/* Tech Briefing: short cards from the public news API. Vanilla JS, textContent only.
   Loaded on /tech/ (renders the grid) and on the homepage (shared helpers for the
   ticker and the "Tech Briefing" block, via window.TechBriefing). */
(function () {
    "use strict";

    var API_BASE = "https://abcnews.com.np/wp-json/wp/v2/posts"; // the ONE place the API host lives
    var API_HOST = new URL(API_BASE).host;
    var TECH_CATEGORY = 55;
    var PER_PAGE = 12;
    var TIMEOUT_MS = 8000;
    var SUMMARY_MAX = 140;

    function decode(html) {
        var doc = new DOMParser().parseFromString(html || "", "text/html");
        return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
    }

    function trim(text, max) {
        if (text.length <= max) return text;
        var cut = text.slice(0, max);
        var sp = cut.lastIndexOf(" ");
        if (sp > max * 0.6) cut = cut.slice(0, sp);
        return cut.replace(/[\s,;:.–—-]+$/, "") + "…";
    }

    function ago(date) {
        var mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
        if (mins < 1) return "now";
        if (mins < 60) return mins + "m ago";
        var h = Math.round(mins / 60);
        if (h < 24) return h + "h ago";
        return Math.round(h / 24) + "d ago";
    }

    // https and the API's own host only
    function safeLink(href) {
        try {
            var u = new URL(href);
            return u.protocol === "https:" && u.host === API_HOST ? u.href : "";
        } catch (e) { return ""; }
    }

    // query: extra params, e.g. {categories: 55, per_page: 12, page: 1}
    function fetchPosts(query, fields) {
        if (!window.fetch) return Promise.reject(new Error("no fetch"));
        var qs = Object.keys(query).map(function (k) { return k + "=" + encodeURIComponent(query[k]); });
        qs.push("_fields=" + fields);
        var ctl = window.AbortController ? new AbortController() : null;
        var timer = ctl ? setTimeout(function () { ctl.abort(); }, TIMEOUT_MS) : 0;
        return fetch(API_BASE + "?" + qs.join("&"), ctl ? { signal: ctl.signal } : {})
            .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function (posts) { if (!Array.isArray(posts)) throw new Error("bad data"); return posts; });
    }

    function fetchTech(page, perPage) {
        return fetchPosts({ categories: TECH_CATEGORY, per_page: perPage || PER_PAGE, page: page || 1 },
            "title,link,date_gmt,excerpt");
    }

    // One card (<li>) from a post, or null if it fails validation.
    function buildCard(p) {
        var title = p && p.title ? decode(p.title.rendered) : "";
        var href = safeLink(p && p.link);
        if (!title || !href) return null;
        var li = document.createElement("li");
        li.className = "tcard";
        var h = document.createElement("h3");
        h.textContent = title;
        li.appendChild(h);
        var sum = trim(decode(p.excerpt && p.excerpt.rendered), SUMMARY_MAX);
        if (sum) {
            var s = document.createElement("p");
            s.className = "tcard-sum";
            s.textContent = sum;
            li.appendChild(s);
        }
        var foot = document.createElement("div");
        foot.className = "tcard-foot";
        if (p.date_gmt) {
            var d = new Date(p.date_gmt + "Z");
            if (!isNaN(d.getTime())) {
                var t = document.createElement("time");
                t.dateTime = d.toISOString();
                t.textContent = ago(d);
                foot.appendChild(t);
            }
        }
        var a = document.createElement("a");
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "Read full story";
        a.setAttribute("aria-label", "Read full story: " + title);
        foot.appendChild(a);
        li.appendChild(foot);
        return li;
    }

    function buildCards(posts) {
        var frag = document.createDocumentFragment();
        posts.forEach(function (p) { var c = buildCard(p); if (c) frag.appendChild(c); });
        return frag;
    }

    window.TechBriefing = {
        decode: decode, ago: ago, safeLink: safeLink,
        fetchPosts: fetchPosts, fetchTech: fetchTech, buildCards: buildCards
    };

    /* ---------- /tech/ page ---------- */
    var grid = document.getElementById("tech-grid");
    if (!grid) return;

    var more = document.getElementById("tech-more");
    var status = document.getElementById("tech-status");
    var page = 1, loading = false, first = true;

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

    function say(msg) { if (status) status.textContent = msg; }

    function load(n) {
        if (loading) return;
        loading = true;
        if (more) more.disabled = true;
        fetchTech(n).then(function (posts) {
            var frag = buildCards(posts);
            if (first) {
                // fresh data replaces the build-time snapshot
                if (frag.childNodes.length) grid.textContent = "";
                first = false;
            }
            grid.appendChild(frag);
            page = n;
            if (more) {
                more.hidden = posts.length < PER_PAGE;
                more.disabled = false;
            }
            say("");
        }).catch(function () {
            // page past the end answers 400; otherwise keep what is shown
            if (more) { more.disabled = false; if (page > 1) more.hidden = true; }
            if (page > 1) say("That is everything for now.");
        }).then(function () { loading = false; });
    }

    if (more) more.addEventListener("click", function () { load(page + 1); });
    load(1);
})();
