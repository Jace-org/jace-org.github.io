/* Blog list filtering. The post list itself is static, pre-rendered
   HTML (see build.py) so it works with JS disabled and is fully
   crawlable; this just adds the tag filter buttons on top of it. */
(function () {
    "use strict";

    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();

    var menuBtn = document.getElementById("menu-btn"), navLinks = document.getElementById("nav-links");
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

    document.documentElement.classList.add("js");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reveal: staggered on first paint, then once each as it scrolls in.
    var rv = Array.prototype.slice.call(document.querySelectorAll(".post-list > li, .pn"));
    rv.forEach(function (el, i) { el.classList.add("rv"); el.style.setProperty("--i", String(Math.min(i, 8))); });
    if (reduce || !("IntersectionObserver" in window)) {
        rv.forEach(function (el) { el.classList.add("in"); });
    } else {
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
        }, { rootMargin: "0px 0px -6% 0px" });
        rv.forEach(function (el) { io.observe(el); });
    }

    // Reading progress fallback for browsers without scroll-driven animations.
    var bar = document.querySelector(".read-progress");
    if (bar && !(window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()")) && !reduce) {
        var tick = false, de = document.documentElement;
        var upd = function () {
            tick = false;
            var max = de.scrollHeight - de.clientHeight;
            bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, de.scrollTop / max) : 0) + ")";
        };
        window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
        upd();
    }

    var listEl = document.getElementById("post-list");
    var filtersEl = document.getElementById("post-filters");
    var listEmpty = document.getElementById("list-empty");
    var noteEl = document.getElementById("filter-note");
    if (!listEl || !filtersEl) return;

    var items = Array.prototype.slice.call(listEl.querySelectorAll("li[data-tags]"));
    var activeTag = "All";

    function tagsOf(li) {
        var raw = li.getAttribute("data-tags") || "";
        return raw ? raw.split("|") : [];
    }

    function buildFilters() {
        var tags = ["All"];
        items.forEach(function (li) {
            tagsOf(li).forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); });
        });
        filtersEl.innerHTML = "";
        tags.forEach(function (t) {
            var b = document.createElement("button");
            b.type = "button";
            b.textContent = t;
            var cnt = t === "All" ? items.length : items.filter(function (li) { return tagsOf(li).indexOf(t) >= 0; }).length;
            var n = document.createElement("span");
            n.className = "n"; n.textContent = String(cnt);
            b.appendChild(n);
            b.setAttribute("aria-pressed", String(t === activeTag));
            b.addEventListener("click", function () {
                activeTag = t;
                buildFilters();
                applyFilter();
                items.forEach(function (li) { li.classList.add("in"); });
            });
            filtersEl.appendChild(b);
        });
    }

    function applyFilter() {
        var visible = 0;
        items.forEach(function (li) {
            var show = activeTag === "All" || tagsOf(li).indexOf(activeTag) >= 0;
            li.hidden = !show;
            if (show) visible++;
        });
        listEl.classList.toggle("is-filtered", activeTag !== "All");
        if (listEmpty) listEmpty.hidden = visible > 0;
        if (noteEl) noteEl.textContent = activeTag === "All" ? "" : visible + (visible === 1 ? " post" : " posts") + " tagged " + activeTag;
    }

    if (items.length) {
        try {
            var want = new URLSearchParams(location.search).get("tag");
            var all = []; items.forEach(function (li) { all = all.concat(tagsOf(li)); });
            if (want && all.indexOf(want) >= 0) activeTag = want;
        } catch (e) { /* ignore */ }
        buildFilters();
        applyFilter();
    }
})();
