/* Shared behaviour for /blog and /resources sub-pages.
   Theme toggle + persistence, reveal on scroll, year. Zero dependencies. */
(function () {
    "use strict";
    var root = document.documentElement;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Theme toggle */
    var toggle = document.getElementById("theme-toggle");
    if (toggle) {
        var setIcon = function () {
            toggle.textContent = root.classList.contains("dark") ? "☾" : "☀";
        };
        setIcon();
        toggle.addEventListener("click", function () {
            var apply = function () {
                root.classList.toggle("dark");
                try {
                    localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
                } catch (e) { }
                var mc = document.querySelector('meta[name="theme-color"]');
                if (mc) mc.setAttribute("content", root.classList.contains("dark") ? "#0f172a" : "#eef2f7");
                setIcon();
            };
            if (reduce || !document.startViewTransition) { apply(); return; }
            var r = toggle.getBoundingClientRect();
            root.style.setProperty("--wipe-x", (r.left + r.width / 2) + "px");
            root.style.setProperty("--wipe-y", (r.top + r.height / 2) + "px");
            document.startViewTransition(apply);
        });
    }

    /* Year */
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();

    /* Reveal on scroll */
    window.revealScan = function () {
        var els = document.querySelectorAll(".reveal:not(.in-view)");
        if (!("IntersectionObserver" in window) || reduce) {
            els.forEach(function (el) { el.classList.add("in-view"); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add("in-view"); io.unobserve(en.target); }
            });
        }, { rootMargin: "0px 0px -6% 0px", threshold: 0.1 });
        els.forEach(function (el) { io.observe(el); });
    };
    window.revealScan();
})();
