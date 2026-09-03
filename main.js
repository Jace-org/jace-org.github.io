/* Jhapendra Kandel — site interactions. Vanilla, no dependencies. */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- Year ---- */
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---- Header shadow on scroll ---- */
    var header = document.getElementById("site-header");
    var onScroll = function () {
        header.classList.toggle("scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---- Mobile nav ---- */
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("nav");
    if (toggle && nav) {
        toggle.addEventListener("click", function () {
            var open = nav.classList.toggle("open");
            toggle.setAttribute("aria-expanded", String(open));
        });
        nav.addEventListener("click", function (e) {
            if (e.target.tagName === "A") {
                nav.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
            }
        });
    }

    /* ---- Typing effect in hero ---- */
    var typed = document.getElementById("typed");
    if (typed) {
        var phrases = [
            "Full-stack developer",
            "Web designer",
            "Front-end + back-end engineer",
            "Building products from Nepal"
        ];
        if (reduceMotion) {
            typed.textContent = phrases[0];
        } else {
            var pi = 0, ci = 0, deleting = false;
            var tick = function () {
                var word = phrases[pi];
                ci += deleting ? -1 : 1;
                typed.textContent = word.slice(0, ci);
                var delay = deleting ? 45 : 85;
                if (!deleting && ci === word.length) {
                    delay = 1600;
                    deleting = true;
                } else if (deleting && ci === 0) {
                    deleting = false;
                    pi = (pi + 1) % phrases.length;
                    delay = 350;
                }
                setTimeout(tick, delay);
            };
            tick();
        }
    }

    /* ---- Reveal on scroll + skill bars ---- */
    var revealEls = document.querySelectorAll(".reveal, .skills");
    if ("IntersectionObserver" in window && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in-view");
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
        revealEls.forEach(function (el) { io.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add("in-view"); });
    }

    /* ---- Active nav link via scroll position ---- */
    var sections = ["home", "about", "projects", "gallery", "contact"]
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);
    var navLinks = Array.prototype.slice.call(nav ? nav.querySelectorAll('a[href^="#"]') : []);
    if (sections.length && navLinks.length && "IntersectionObserver" in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var id = entry.target.id;
                navLinks.forEach(function (a) {
                    a.classList.toggle("active", a.getAttribute("href") === "#" + id);
                });
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        sections.forEach(function (s) { spy.observe(s); });
    }

    /* ---- Contact form: disable button on submit ---- */
    var form = document.getElementById("contact-form");
    if (form) {
        form.addEventListener("submit", function () {
            var btn = document.getElementById("submit");
            if (btn) {
                btn.disabled = true;
                btn.textContent = "Sending…";
            }
        });
    }
})();
