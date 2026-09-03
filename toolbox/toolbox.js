/* Resources: reads toolbox.json and renders cards grouped by category,
   with a category filter and a text search. Files are served from the
   resources/files folder; entries can also point at an external url.
   No server, no build step. */
(function () {
    "use strict";

    var groupsEl = document.getElementById("res-groups");
    var filtersEl = document.getElementById("res-filters");
    var searchEl = document.getElementById("res-search");
    var emptyEl = document.getElementById("res-empty");

    var all = [];
    var activeCat = "All";
    var query = "";

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function matches(r) {
        var catOk = activeCat === "All" || r.category === activeCat;
        if (!catOk) return false;
        if (!query) return true;
        var hay = (r.title + " " + (r.description || "") + " " + (r.type || "") + " " + (r.category || "")).toLowerCase();
        return hay.indexOf(query) >= 0;
    }

    function cardHtml(r) {
        var isExternal = !!r.url;
        var href = isExternal ? r.url : "files/" + r.file;
        var actionLabel = isExternal ? "Open link ↗" : "Download ↓";
        var attrs = isExternal
            ? ' target="_blank" rel="noopener"'
            : ' download';
        var meta = [];
        if (r.size) meta.push(esc(r.size));
        if (!isExternal && r.file) meta.push(esc(r.file.split(".").pop().toUpperCase()));
        return (
            '<article class="res-card reveal">' +
            '<div class="res-top"><h3>' + esc(r.title) + "</h3>" +
            (r.type ? '<span class="res-type">' + esc(r.type) + "</span>" : "") +
            "</div>" +
            "<p>" + esc(r.description || "") + "</p>" +
            '<a class="res-action" href="' + href + '"' + attrs + ">" + actionLabel + "</a>" +
            (meta.length ? '<p class="res-meta">' + meta.join(" · ") + "</p>" : "") +
            "</article>"
        );
    }

    function render() {
        var items = all.filter(matches);
        if (!items.length) {
            groupsEl.innerHTML = "";
            emptyEl.hidden = false;
            return;
        }
        emptyEl.hidden = true;

        var cats = [];
        items.forEach(function (r) {
            var c = r.category || "Other";
            if (cats.indexOf(c) < 0) cats.push(c);
        });
        cats.sort();

        groupsEl.innerHTML = cats.map(function (c) {
            var cards = items.filter(function (r) { return (r.category || "Other") === c; })
                .map(cardHtml).join("");
            return '<section class="res-group"><h2>' + esc(c) + '</h2><div class="res-grid">' + cards + "</div></section>";
        }).join("");

        if (window.revealScan) window.revealScan();
    }

    function buildFilters() {
        var cats = ["All"];
        all.forEach(function (r) {
            var c = r.category || "Other";
            if (cats.indexOf(c) < 0) cats.push(c);
        });
        filtersEl.innerHTML = "";
        cats.forEach(function (c) {
            var b = document.createElement("button");
            b.type = "button";
            b.textContent = c;
            b.setAttribute("aria-pressed", String(c === activeCat));
            b.addEventListener("click", function () {
                activeCat = c;
                buildFilters();
                render();
            });
            filtersEl.appendChild(b);
        });
    }

    searchEl.addEventListener("input", function () {
        query = searchEl.value.trim().toLowerCase();
        render();
    });

    fetch("toolbox.json", { cache: "no-cache" })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            all = (data || []).slice().sort(function (a, b) {
                return String(a.title).localeCompare(String(b.title));
            });
            buildFilters();
            render();
        })
        .catch(function () {
            emptyEl.hidden = false;
            emptyEl.textContent = "Could not load the resource list.";
        });
})();
