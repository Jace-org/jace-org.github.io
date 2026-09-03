/* Blog: loads posts.json for the index, and posts/<file>.md for each article.
   Markdown is rendered by a small built-in parser, so there is no build step
   and no external library. Routing is hash-based:
     #                 -> list
     #read/<slug>      -> single post
*/
(function () {
    "use strict";

    var listView = document.getElementById("view-list");
    var postView = document.getElementById("view-post");
    var listEl = document.getElementById("post-list");
    var filtersEl = document.getElementById("post-filters");
    var listEmpty = document.getElementById("list-empty");
    var loadError = document.getElementById("load-error");

    var posts = [];
    var activeTag = "All";

    /* ---------------- Markdown ---------------- */
    function esc(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function inline(s) {
        // images first, then links
        s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, src) {
            return '<img src="' + src + '" alt="' + alt + '" loading="lazy">';
        });
        s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, txt, href) {
            var ext = /^https?:/.test(href);
            return '<a href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + txt + '</a>';
        });
        s = s.replace(/`([^`]+)`/g, function (_, c) { return "<code>" + c + "</code>"; });
        s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
        return s;
    }

    function render(md) {
        var lines = md.replace(/\r\n?/g, "\n").split("\n");
        var out = [];
        var i = 0;

        function flushPara(buf) {
            if (buf.length) out.push("<p>" + inline(buf.join(" ")) + "</p>");
        }

        while (i < lines.length) {
            var line = lines[i];

            // fenced code
            if (/^```/.test(line)) {
                var code = [];
                i++;
                while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
                i++;
                out.push("<pre><code>" + esc(code.join("\n")) + "</code></pre>");
                continue;
            }
            // heading
            var h = /^(#{1,4})\s+(.*)$/.exec(line);
            if (h) {
                var lvl = h[1].length;
                out.push("<h" + lvl + ">" + inline(esc(h[2])) + "</h" + lvl + ">");
                i++;
                continue;
            }
            // hr
            if (/^\s*([*_-])(\s*\1){2,}\s*$/.test(line)) {
                out.push("<hr>");
                i++;
                continue;
            }
            // blockquote
            if (/^>\s?/.test(line)) {
                var q = [];
                while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, "")); i++; }
                out.push("<blockquote>" + inline(esc(q.join(" "))) + "</blockquote>");
                continue;
            }
            // unordered list
            if (/^\s*[-*]\s+/.test(line)) {
                var ul = [];
                while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
                    ul.push("<li>" + inline(esc(lines[i].replace(/^\s*[-*]\s+/, ""))) + "</li>");
                    i++;
                }
                out.push("<ul>" + ul.join("") + "</ul>");
                continue;
            }
            // ordered list
            if (/^\s*\d+\.\s+/.test(line)) {
                var ol = [];
                while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
                    ol.push("<li>" + inline(esc(lines[i].replace(/^\s*\d+\.\s+/, ""))) + "</li>");
                    i++;
                }
                out.push("<ol>" + ol.join("") + "</ol>");
                continue;
            }
            // blank
            if (/^\s*$/.test(line)) { i++; continue; }
            // paragraph (gather until blank / block)
            var para = [];
            while (
                i < lines.length &&
                !/^\s*$/.test(lines[i]) &&
                !/^(#{1,4}\s|>\s?|```|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i]) &&
                !/^\s*([*_-])(\s*\1){2,}\s*$/.test(lines[i])
            ) {
                para.push(esc(lines[i]));
                i++;
            }
            flushPara(para);
        }
        return out.join("\n");
    }

    /* ---------------- List ---------------- */
    function fmtDate(iso) {
        var d = new Date(iso);
        if (isNaN(d)) return iso;
        return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    }

    function buildFilters() {
        var tags = ["All"];
        posts.forEach(function (p) {
            (p.tags || []).forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); });
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
                renderList();
            });
            filtersEl.appendChild(b);
        });
    }

    function renderList() {
        var items = posts.filter(function (p) {
            return activeTag === "All" || (p.tags || []).indexOf(activeTag) >= 0;
        });
        listEl.innerHTML = "";
        if (!items.length) {
            listEmpty.hidden = false;
            return;
        }
        listEmpty.hidden = true;
        items.forEach(function (p) {
            var li = document.createElement("li");
            li.className = "reveal";
            var tagHtml = (p.tags || []).map(function (t) {
                return '<span class="tag">' + esc(t) + "</span>";
            }).join("");
            li.innerHTML =
                '<a class="post-card" href="#read/' + encodeURIComponent(p.slug) + '">' +
                "<h2>" + esc(p.title) + "</h2>" +
                '<p class="post-meta"><span>' + fmtDate(p.date) + "</span>" + tagHtml + "</p>" +
                '<p class="excerpt">' + esc(p.excerpt || "") + "</p>" +
                "</a>";
            listEl.appendChild(li);
        });
        if (window.revealScan) window.revealScan();
    }

    /* ---------------- Router ---------------- */
    function show(which) {
        listView.hidden = which !== "list";
        postView.hidden = which !== "post";
        loadError.hidden = which !== "error";
    }

    function openPost(slug) {
        var meta = posts.filter(function (p) { return p.slug === slug; })[0];
        if (!meta) { show("error"); return; }
        fetch("posts/" + meta.file, { cache: "no-cache" })
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
            .then(function (md) {
                document.getElementById("post-title").textContent = meta.title;
                document.getElementById("post-date").textContent = fmtDate(meta.date);
                document.getElementById("post-tags").innerHTML = (meta.tags || []).map(function (t) {
                    return '<span class="tag">' + esc(t) + "</span>";
                }).join("");
                // drop a leading H1 if it duplicates the title
                md = md.replace(/^\s*#\s+.*\n/, "");
                document.getElementById("post-body").innerHTML = render(md);
                document.title = meta.title + " — Jhapendra Kandel";
                show("post");
                window.scrollTo(0, 0);
            })
            .catch(function () { show("error"); });
    }

    function route() {
        var hash = location.hash.replace(/^#/, "");
        var m = /^read\/(.+)$/.exec(hash);
        if (m) {
            openPost(decodeURIComponent(m[1]));
        } else {
            document.title = "Blog — Jhapendra Kandel";
            show("list");
        }
    }

    /* ---------------- Boot ---------------- */
    fetch("posts.json", { cache: "no-cache" })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            posts = (data || []).slice().sort(function (a, b) {
                return new Date(b.date) - new Date(a.date);
            });
            buildFilters();
            renderList();
            route();
        })
        .catch(function () {
            listEmpty.hidden = false;
            listEmpty.textContent = "Could not load the post list.";
        });

    window.addEventListener("hashchange", route);
})();
