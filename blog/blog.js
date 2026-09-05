/* Blog list filtering. The post list itself is static, pre-rendered
   HTML (see build.py) so it works with JS disabled and is fully
   crawlable; this just adds the tag filter buttons on top of it. */
(function () {
    "use strict";

    var listEl = document.getElementById("post-list");
    var filtersEl = document.getElementById("post-filters");
    var listEmpty = document.getElementById("list-empty");
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
            b.setAttribute("aria-pressed", String(t === activeTag));
            b.addEventListener("click", function () {
                activeTag = t;
                buildFilters();
                applyFilter();
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
        if (listEmpty) listEmpty.hidden = visible > 0;
    }

    if (items.length) buildFilters();
})();
