/* /lab — interactive Honeypot Lab walkthrough. Plain JS, no dependencies, no network.
   All data is fictional (203.0.113.0/24 is the RFC 5737 documentation range).
   User-typed text is only ever written with textContent / createTextNode, never innerHTML. */
(function () {
    "use strict";

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var KEY = "hpl-demo-v1";

    /* ---------- helpers ---------- */
    function $(s, r) { return (r || document).querySelector(s); }
    function h(tag, attrs, kids) {
        var e = document.createElement(tag), k, v;
        for (k in (attrs || {})) {
            v = attrs[k];
            if (v == null || v === false) continue;
            if (k === "class") e.className = v;
            else if (k === "text") e.textContent = v;
            else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
            else if (v === true) e.setAttribute(k, "");
            else e.setAttribute(k, v);
        }
        (kids || []).forEach(function (c) {
            if (c == null || c === false) return;
            e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
        });
        return e;
    }
    function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? Math.min(ms, 60) : ms); }); }
    function rnd(n) { return Math.floor(Math.random() * n); }
    function clock() { return new Date().toLocaleTimeString([], { hour12: false }); }
    function esc(s) { /* shown as visible text to demonstrate output encoding */
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    var toastT;
    function toast(msg) {
        var t = $("#toast"); t.textContent = msg; t.classList.add("show");
        clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2600);
    }
    function badge(text, kind) { return h("span", { class: "badge " + (kind || "mute"), text: text }); }
    function sevKind(n) { return n >= 80 ? "bad" : n >= 50 ? "warn" : "ok"; }

    /* ---------- state ---------- */
    var dirty = 0;
    function seed() {
        return {
            nextId: 104,
            incidents: [
                { id: 101, title: "Repeated SQL injection probes on /search", src: "203.0.113.24", sev: 82, status: "open", owner: "analyst1", notes: ["Auto-opened from a high-severity alert."] },
                { id: 102, title: "Credential guessing against /login", src: "203.0.113.77", sev: 58, status: "triaging", owner: "analyst1", notes: ["Wordlist pattern, 40 attempts/min."] },
                { id: 103, title: "Port sweep of the decoy range", src: "203.0.113.9", sev: 34, status: "closed", owner: "jkandel", notes: ["Noise. Closed."] }
            ],
            blocklist: [{ ip: "203.0.113.24", reason: "SQLi scanner", exp: "24 hours" }],
            rules: [
                { id: 1, name: "High-severity event", unit: "severity ≥", value: 80, channel: "email", on: true },
                { id: 2, name: "Burst from one source", unit: "events / min ≥", value: 20, channel: "chat", on: true },
                { id: 3, name: "Canary credential replayed", unit: "hits ≥", value: 1, channel: "webhook", on: false }
            ],
            users: [
                { name: "jkandel", role: "admin", active: true },
                { name: "analyst1", role: "analyst", active: true },
                { name: "analyst2", role: "analyst", active: true }
            ]
        };
    }
    var S = (function () {
        try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); if (o && o.incidents && o.users) return o; } } catch (e) { }
        return seed();
    })();
    function save() {
        dirty++; renderSnap();
        try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
    }

    /* =========================================================
       1 · MAP
       ========================================================= */
    var STAGES = [
        { id: "attacker", name: "Attacker", tag: "outside", short: "Sends probes, scans, payloads.", what: "A scanner or a person hitting the lab. In the real project this is a dedicated attacker machine inside the isolated lab, running standard tools.", never: "Never leaves the lab network, and never aims at anything I don't own." },
        { id: "decoy", name: "Decoys", tag: "bait", short: "Deliberately weak fake services.", what: "A fake web app, a fake API, a fake SSH shell. They look interesting, answer with made-up content and record everything that touches them.", never: "Hold no real data, have no way out to the internet, and never run anything an attacker uploads." },
        { id: "collector", name: "Collector", tag: "ingest", short: "One door for events.", what: "Receives each recorded request over a single authenticated channel and normalises it into a standard event.", never: "It is the only link between the decoy side and the rest of the lab." },
        { id: "classifier", name: "Classifier", tag: "decide", short: "Category + severity score.", what: "Rule-based labelling: SQL injection, XSS, path traversal, brute force, scan, and so on, with a 0–100 severity.", never: "No machine learning in v1, so every verdict can be explained by a rule." },
        { id: "store", name: "Event store", tag: "remember", short: "Everything, searchable.", what: "Keeps the classified events and a profile per attacking source so patterns across sessions become visible.", never: "Captured payloads are stored as inert blobs, never opened or run." },
        { id: "portal", name: "Portal", tag: "act", short: "Cases, blocklist, alert rules.", what: "Where an analyst triages. This is also the application that later gets attacked, fixed and retested.", never: "It manages the response, it doesn't replace the dashboard that just shows the stream." }
    ];
    var pipe = $("#pipe"), stageDetail = $("#stage-detail"), pipeStatus = $("#pipe-status");
    var stageEls = STAGES.map(function (st, i) {
        var b = h("button", { class: "lab-stage", type: "button", role: "listitem", "aria-label": st.name + ": " + st.short, onclick: function () { showStage(i); } }, [
            h("em", { text: (i + 1) + " · " + st.tag.toUpperCase() }), h("b", { text: st.name }), h("span", { text: st.short })
        ]);
        pipe.appendChild(b); return b;
    });
    function showStage(i) {
        stageEls.forEach(function (e, j) { e.classList.toggle("sel", i === j); });
        var st = STAGES[i];
        clear(stageDetail).appendChild(h("div", null, [
            h("h3", { text: st.name }), h("p", { class: "lab-small", text: st.what }),
            h("p", { class: "lab-small" }, [h("strong", { text: "Safety: " }), st.never])
        ]));
    }
    showStage(0);
    var running = false;
    function runPipeline(label) {
        if (running) return Promise.resolve();
        running = true;
        var chain = Promise.resolve();
        STAGES.forEach(function (st, i) {
            chain = chain.then(function () {
                stageEls.forEach(function (e, j) { e.classList.toggle("active", i === j); });
                pipeStatus.textContent = (i + 1) + "/6 " + st.name + (label ? " — " + label : "");
                return sleep(520);
            });
        });
        return chain.then(function () {
            stageEls.forEach(function (e) { e.classList.remove("active"); });
            pipeStatus.textContent = "Done. Event is in the portal's queue."; running = false;
        });
    }
    $("#probe-btn").addEventListener("click", function () { runPipeline("probe"); });

    /* =========================================================
       2 · ATTACK
       ========================================================= */
    var ATTACKS = [
        { id: "sqli", label: "SQL injection", cat: "sqli", base: 78, req: "GET /search?q=' OR '1'='1' --  HTTP/1.1\nUser-Agent: sqlmap/1.x (simulated)", tags: ["sql-meta-chars", "tautology"], reply: "A fake results page. There is no real database behind the decoy." },
        { id: "xss", label: "Cross-site scripting", cat: "xss", base: 62, req: "POST /comment  body: <script>alert(1)</script>", tags: ["script-tag", "reflected-input"], reply: "The decoy echoes a fake 'comment saved' page. Nothing is executed." },
        { id: "trav", label: "Path traversal", cat: "path_traversal", base: 70, req: "GET /download?file=../../../../etc/passwd", tags: ["dot-dot-slash", "sensitive-path"], reply: "A made-up passwd file with fake users is returned." },
        { id: "brute", label: "Brute-force login", cat: "brute_force", base: 55, req: "POST /login  user=admin pass=password123  (attempt 14 of a wordlist)", tags: ["repeated-failure", "common-password"], reply: "Always 'invalid credentials', with a realistic delay." },
        { id: "scan", label: "Port scan", cat: "scan", base: 35, req: "SYN sweep: ports 1–1024 from one source in 3 seconds", tags: ["many-ports", "no-payload"], reply: "A few ports answer with fake banners; the rest stay quiet." },
        { id: "upload", label: "Shell upload attempt", cat: "file_upload_abuse", base: 88, req: "POST /upload  file=shell.php  Content-Type: image/jpeg", tags: ["double-extension", "executable-upload"], reply: "'Upload OK'. The file is stored as an inert blob and is never run." }
    ];
    var feed = $("#feed"), feedEmpty = $("#feed-empty");
    var counts = { total: 0, high: 0, srcs: {} };
    var lastEvents = [];
    function makeEvent(a) {
        var sev = Math.max(5, Math.min(99, a.base + rnd(15) - 7));
        return { t: clock(), src: "203.0.113." + (2 + rnd(250)), cat: a.cat, sev: sev, tags: a.tags, title: a.label + " against the decoy" };
    }
    function addEvent(ev, animate) {
        counts.total++; if (ev.sev >= 80) counts.high++; counts.srcs[ev.src] = 1;
        $("#st-total").textContent = counts.total; $("#st-high").textContent = counts.high; $("#st-src").textContent = Object.keys(counts.srcs).length;
        feedEmpty.hidden = true;
        var tr = h("tr", { class: animate === false ? "" : "new" }, [
            h("td", { text: ev.t }), h("td", { text: ev.src }), h("td", { text: ev.cat }),
            h("td", null, [h("span", { class: "sev badge " + sevKind(ev.sev), text: String(ev.sev) })]),
            h("td", null, [h("button", { class: "lab-btn", type: "button", text: "→ case", "aria-label": "Open a case for " + ev.cat + " from " + ev.src, onclick: function () { openCase(ev); } })])
        ]);
        feed.insertBefore(tr, feed.firstChild);
        while (feed.children.length > 10) feed.removeChild(feed.lastChild);
        var rule = S.rules[0];
        if (rule.on && ev.sev >= rule.value) toast("Alert via " + rule.channel + " (simulated): " + ev.cat + " from " + ev.src);
    }
    function openCase(ev) {
        S.incidents.unshift({ id: S.nextId++, title: ev.title.charAt(0).toUpperCase() + ev.title.slice(1), src: ev.src, sev: ev.sev, status: "open", owner: "analyst1", notes: ["Opened from the live feed."] });
        save(); P.tab = "incidents"; P.sel = S.incidents[0].id; renderPortal();
        toast("Case opened. See step 3 below.");
    }
    var chips = $("#attack-chips");
    ATTACKS.forEach(function (a) {
        var b = h("button", { class: "lab-chip", type: "button", text: a.label, "aria-pressed": "false", onclick: function () { fire(a, b); } });
        chips.appendChild(b);
    });
    function fire(a, btn) {
        Array.prototype.forEach.call(chips.children, function (c) { c.classList.toggle("on", c === btn); c.setAttribute("aria-pressed", c === btn ? "true" : "false"); });
        var ev = makeEvent(a);
        $("#atk-req").textContent = a.req;
        var v = clear($("#atk-verdict"));
        v.appendChild(h("div", null, [badge(ev.cat, "mute"), " ", h("span", { class: "sev", text: "severity " + ev.sev + "/100" })]));
        v.appendChild(h("div", { class: "lab-meter" }, [h("i", { style: "width:" + ev.sev + "%" })]));
        v.appendChild(h("div", { class: "lab-tags" }, ev.tags.map(function (t) { return badge(t, "mute"); })));
        $("#atk-reply").textContent = a.reply;
        addEvent(ev); runPipeline(a.label);
    }
    var stormT;
    $("#storm").addEventListener("change", function (e) {
        clearInterval(stormT);
        if (e.target.checked) stormT = setInterval(function () { if (!document.hidden) addEvent(makeEvent(ATTACKS[rnd(ATTACKS.length)])); }, 1700);
    });

    /* =========================================================
       3 · PORTAL
       ========================================================= */
    var P = { user: null, tab: "incidents", sel: null };
    var portalEl = $("#portal");
    var IP_RE = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
    function isAdmin() { return P.user && P.user.role === "admin"; }

    function renderPortal() {
        clear(portalEl);
        if (!P.user) return portalEl.appendChild(loginView());
        var tabs = [["incidents", "Incidents"], ["blocklist", "Blocklist"], ["rules", "Alert rules"], ["users", "Users & roles" + (isAdmin() ? "" : " 🔒")]];
        portalEl.appendChild(h("div", { class: "p-top" }, [
            h("div", { class: "p-tabs", role: "tablist" }, tabs.map(function (t) {
                return h("button", { class: "lab-tab", type: "button", role: "tab", "aria-selected": String(P.tab === t[0]), text: t[1], onclick: function () { P.tab = t[0]; renderPortal(); } });
            })),
            h("div", { class: "p-who" }, [P.user.name + " · ", badge(P.user.role, isAdmin() ? "warn" : "ok"), " ", h("button", { class: "lab-btn", type: "button", text: "Sign out", onclick: function () { P.user = null; renderPortal(); } })])
        ]));
        var body = { incidents: incidentsView, blocklist: blocklistView, rules: rulesView, users: usersView }[P.tab]();
        portalEl.appendChild(body);
    }
    function loginView() {
        var sel = h("select", { id: "login-user", "aria-label": "Demo account" }, S.users.filter(function (u) { return u.active; }).map(function (u) { return h("option", { value: u.name, text: u.name + " (" + u.role + ")" }); }));
        return h("form", { class: "p-login", onsubmit: function (e) { e.preventDefault(); P.user = S.users.filter(function (u) { return u.name === sel.value; })[0]; P.tab = "incidents"; renderPortal(); } }, [
            h("h3", { text: "Sign in" }),
            h("div", { class: "p-form" }, [
                h("label", null, ["Account", sel]),
                h("label", null, ["Password", h("input", { type: "password", value: "demo", disabled: true, "aria-label": "Password (not needed in the demo)" })]),
                h("button", { class: "lab-btn gold", type: "submit", text: "Sign in" }),
                h("p", { class: "lab-small", text: "Demo only: no password is checked. Try both roles." })
            ])
        ]);
    }

    function incidentsView() {
        var wrap = h("div", { class: "p-grid" });
        var list = h("ul", { class: "p-list" });
        S.incidents.forEach(function (i) {
            list.appendChild(h("li", null, [h("button", { class: "p-item" + (P.sel === i.id ? " sel" : ""), type: "button", onclick: function () { P.sel = i.id; renderPortal(); } }, [
                h("span", null, ["#" + i.id + " " + i.title]),
                h("small", { text: i.src + " · sev " + i.sev + " · " + i.status + " · " + i.owner })
            ])]));
        });
        if (!S.incidents.length) list.appendChild(h("li", { class: "lab-small", text: "No cases." }));
        var title = h("input", { type: "text", maxlength: "80", placeholder: "Case title", "aria-label": "New case title" });
        var err = h("div", { class: "p-err", role: "alert" });
        var form = h("form", { class: "p-form", onsubmit: function (e) {
            e.preventDefault(); var t = title.value.trim();
            if (t.length < 3 || t.length > 80) { err.textContent = "Title must be 3–80 characters."; return; }
            S.incidents.unshift({ id: S.nextId++, title: t, src: "unknown", sev: 40, status: "open", owner: P.user.name, notes: [] });
            P.sel = S.incidents[0].id; save(); renderPortal(); toast("Case created.");
        } }, [title, err, h("button", { class: "lab-btn gold", type: "submit", text: "New case" })]);
        wrap.appendChild(h("div", null, [form, list]));

        var cur = S.incidents.filter(function (i) { return i.id === P.sel; })[0];
        var det = h("div", { class: "lab-card" });
        if (!cur) det.appendChild(h("p", { class: "lab-small", text: "Select a case, or open one from the live feed in step 2." }));
        else {
            var st = h("select", { "aria-label": "Status", onchange: function () { cur.status = st.value; save(); renderPortal(); } }, ["open", "triaging", "closed"].map(function (s) { return h("option", { value: s, text: s, selected: s === cur.status }); }));
            var ow = h("select", { "aria-label": "Assignee", onchange: function () { cur.owner = ow.value; save(); renderPortal(); } }, S.users.map(function (u) { return h("option", { value: u.name, text: u.name, selected: u.name === cur.owner }); }));
            var note = h("input", { type: "text", maxlength: "200", placeholder: "Add a note", "aria-label": "Add a note" });
            var nerr = h("div", { class: "p-err", role: "alert" });
            det.appendChild(h("h3", { text: "#" + cur.id + " · " + cur.title }));
            det.appendChild(h("p", { class: "lab-small" }, ["Source ", h("code", { text: cur.src }), " · severity ", badge(String(cur.sev), sevKind(cur.sev))]));
            det.appendChild(h("div", { class: "p-form inline" }, [h("label", null, ["Status", st]), h("label", null, ["Assigned to", ow])]));
            det.appendChild(h("ul", { class: "p-notes" }, cur.notes.map(function (n) { return h("li", { text: n }); })));
            det.appendChild(h("form", { class: "p-form", onsubmit: function (e) {
                e.preventDefault(); var v = note.value.trim();
                if (!v) { nerr.textContent = "Note can't be empty."; return; }
                cur.notes.push(v); save(); renderPortal();
            } }, [note, nerr, h("button", { class: "lab-btn", type: "submit", text: "Add note" })]));
            det.appendChild(h("div", { class: "lab-row" }, [
                h("button", { class: "lab-btn", type: "button", text: "Block source", disabled: cur.src === "unknown", onclick: function () { addBlock(cur.src, "From case #" + cur.id, "24 hours"); } }),
                h("button", { class: "lab-btn danger", type: "button", text: "Delete case", disabled: !isAdmin(), title: isAdmin() ? "" : "Admins only", onclick: function () { S.incidents = S.incidents.filter(function (i) { return i !== cur; }); P.sel = null; save(); renderPortal(); } })
            ]));
            if (!isAdmin()) det.appendChild(h("p", { class: "lab-small", text: "Delete is admin-only. Sign in as jkandel to use it." }));
        }
        wrap.appendChild(det); return wrap;
    }
    function addBlock(ip, reason, exp) {
        if (S.blocklist.some(function (b) { return b.ip === ip; })) { toast(ip + " is already blocked."); return false; }
        S.blocklist.unshift({ ip: ip, reason: reason, exp: exp }); save(); toast(ip + " added to the blocklist."); return true;
    }
    function blocklistView() {
        var ip = h("input", { type: "text", placeholder: "203.0.113.50", "aria-label": "IPv4 address", inputmode: "decimal" });
        var why = h("input", { type: "text", maxlength: "60", placeholder: "Reason", "aria-label": "Reason" });
        var exp = h("select", { "aria-label": "Expiry" }, ["1 hour", "24 hours", "7 days"].map(function (x) { return h("option", { value: x, text: x }); }));
        var err = h("div", { class: "p-err", role: "alert" });
        var form = h("form", { class: "p-form inline", onsubmit: function (e) {
            e.preventDefault();
            if (!IP_RE.test(ip.value.trim())) { err.textContent = "Enter a valid IPv4 address."; return; }
            if (!why.value.trim()) { err.textContent = "A reason is required."; return; }
            if (addBlock(ip.value.trim(), why.value.trim(), exp.value)) renderPortal(); else err.textContent = "Already on the list.";
        } }, [h("label", null, ["Address", ip]), h("label", null, ["Reason", why]), h("label", null, ["Expires", exp]), h("button", { class: "lab-btn gold", type: "submit", text: "Block" })]);
        var rows = S.blocklist.map(function (b) {
            return h("tr", null, [h("td", { text: b.ip }), h("td", { text: b.reason }), h("td", { text: b.exp }), h("td", null, [h("button", { class: "lab-btn", type: "button", text: "Remove", "aria-label": "Remove " + b.ip, onclick: function () { S.blocklist = S.blocklist.filter(function (x) { return x !== b; }); save(); renderPortal(); } })])]);
        });
        return h("div", null, [form, err, h("div", { class: "table-scroll" }, [h("table", { class: "lab-table" }, [
            h("thead", null, [h("tr", null, ["Address", "Reason", "Expires", ""].map(function (t) { return h("th", { text: t }); }))]), h("tbody", null, rows)])]),
            S.blocklist.length ? null : h("p", { class: "lab-small", text: "Nothing blocked." })]);
    }
    function rulesView() {
        return h("div", { class: "p-list" }, S.rules.map(function (r) {
            var on = h("input", { type: "checkbox", checked: r.on, "aria-label": r.name + " enabled", onchange: function () { r.on = on.checked; save(); toast(r.name + (r.on ? " enabled." : " disabled.")); } });
            var val = h("input", { type: "number", min: "1", max: "100", value: String(r.value), "aria-label": r.name + " threshold", onchange: function () { var n = parseInt(val.value, 10); if (!(n >= 1 && n <= 100)) { val.value = r.value; toast("Threshold must be 1–100."); return; } r.value = n; save(); toast("Saved (simulated)."); } });
            var ch = h("select", { "aria-label": r.name + " channel", onchange: function () { r.channel = ch.value; save(); toast("Channel set to " + r.channel + "."); } }, ["email", "webhook", "chat"].map(function (c) { return h("option", { value: c, text: c, selected: c === r.channel }); }));
            return h("div", { class: "lab-card" }, [h("label", { class: "lab-check" }, [on, h("strong", { text: r.name })]), h("div", { class: "p-form inline" }, [h("label", null, [r.unit, val]), h("label", null, ["Notify via", ch])])]);
        }));
    }
    function usersView() {
        if (!isAdmin()) return h("div", { class: "p-denied" }, [h("b", { text: "403" }), h("p", { text: "Forbidden: this page is for admins." }), h("p", { class: "lab-small", text: "The role is checked on the server for every request, not just by hiding the tab. Step 4 shows what happens when it isn't." })]);
        var adminCount = function () { return S.users.filter(function (u) { return u.role === "admin" && u.active; }).length; };
        var rows = S.users.map(function (u) {
            var role = h("select", { "aria-label": u.name + " role", onchange: function () { if (u.role === "admin" && u.active && adminCount() === 1 && role.value !== "admin") { role.value = "admin"; toast("Can't demote the last admin."); return; } u.role = role.value; save(); renderPortal(); } }, ["admin", "analyst"].map(function (r) { return h("option", { value: r, text: r, selected: r === u.role }); }));
            var act = h("input", { type: "checkbox", checked: u.active, "aria-label": u.name + " active", onchange: function () { if (!act.checked && u.role === "admin" && adminCount() === 1) { act.checked = true; toast("Can't disable the last admin."); return; } u.active = act.checked; save(); } });
            return h("tr", null, [h("td", { text: u.name }), h("td", null, [role]), h("td", null, [act])]);
        });
        var name = h("input", { type: "text", maxlength: "20", placeholder: "new_username", "aria-label": "New username" }), err = h("div", { class: "p-err", role: "alert" });
        var form = h("form", { class: "p-form inline", onsubmit: function (e) {
            e.preventDefault(); var v = name.value.trim();
            if (!/^[a-z0-9_]{3,20}$/.test(v)) { err.textContent = "3–20 chars: a–z, 0–9, underscore."; return; }
            if (S.users.some(function (u) { return u.name === v; })) { err.textContent = "That user exists."; return; }
            S.users.push({ name: v, role: "analyst", active: true }); save(); renderPortal();
        } }, [h("label", null, ["Add analyst", name]), h("button", { class: "lab-btn gold", type: "submit", text: "Add" })]);
        return h("div", null, [h("div", { class: "table-scroll" }, [h("table", { class: "lab-table" }, [h("thead", null, [h("tr", null, ["User", "Role", "Active"].map(function (t) { return h("th", { text: t }); }))]), h("tbody", null, rows)])]), form, err]);
    }

    /* =========================================================
       4 · ASSESS
       ========================================================= */
    var R = {};  /* R[weaknessId][ver] = "exploited" | "blocked" */
    var CASES = { 101: "analyst1", 102: "analyst1", 103: "analyst2", 104: "analyst2" };
    var WEAK = [
        {
            id: "inj", name: "Injection", cwe: "CWE-89", owasp: "A03",
            steps: ["Find: the case search builds its query by gluing the search text into the SQL.", "Demonstrate: a quote plus a tautology changes what the query means.", "Fix: bind the text as a parameter and validate its shape.", "Retest: the same input is now treated as plain text or rejected."],
            hint: "Try the example attack on v1, then on v2.", example: "' OR '1'='1' --",
            run: function (ver, q) {
                var data = ["Port sweep (restricted)", "SQLi probes", "Credential guessing", "Admin audit (restricted)"], tmpl = "SELECT id, title FROM incidents WHERE title LIKE '%" + q + "%'";
                if (ver === "v1") {
                    var flawed = /'\s*(or|and)\s+['\d].*(=|--)/i.test(q) || /'\s*--/.test(q) || /;\s*drop/i.test(q);
                    return { q: tmpl, ok: !flawed, msg: flawed ? "Query logic changed: returned all " + data.length + " rows, including restricted ones." : "Returned " + data.filter(function (d) { return d.toLowerCase().indexOf(q.toLowerCase()) > -1; }).length + " matching row(s).", rows: flawed ? data : null };
                }
                var bad = !/^[\w\s\-.,:\/]{0,60}$/.test(q);
                return { q: "SELECT id, title FROM incidents WHERE title LIKE ?   -- bound: '%" + q + "%'", ok: true, blocked: bad, msg: bad ? "400 Rejected by input validation. The text never reaches the query." : "Searched as plain text: " + data.filter(function (d) { return d.toLowerCase().indexOf(q.toLowerCase()) > -1; }).length + " match(es)." };
            },
            ui: function (ctx) {
                var inp = h("input", { type: "text", value: "SQLi", "aria-label": "Search text", maxlength: "80" });
                var out = h("div", { class: "lab-out", "aria-live": "polite" }, ["Run a search."]);
                var go = function () {
                    var r = this.run(ctx.ver, inp.value), bad = ctx.ver === "v1" && r.rows;
                    clear(out); out.className = "lab-out " + (bad ? "bad" : ctx.ver === "v2" && r.blocked ? "ok" : "");
                    out.appendChild(h("code", { text: r.q })); out.appendChild(h("br")); out.appendChild(document.createTextNode(r.msg));
                    if (bad) ctx.record("exploited"); else if (ctx.ver === "v2" && r.blocked) ctx.record("blocked");
                }.bind(this);
                return h("div", null, [h("div", { class: "p-form inline" }, [h("label", null, ["Search cases", inp]), h("div", { class: "lab-row" }, [h("button", { class: "lab-btn gold", type: "button", text: "Search", onclick: go }), h("button", { class: "lab-btn", type: "button", text: "Use example attack", onclick: function () { inp.value = ctx.w.example; go(); } })])]), out]);
            }
        },
        {
            id: "xss", name: "Stored XSS", cwe: "CWE-79", owasp: "A03",
            steps: ["Find: case notes are shown back to other analysts.", "Demonstrate: a note containing script markup would run in the viewer's browser.", "Fix: encode output and add a Content-Security-Policy.", "Retest: the markup is displayed as harmless text."],
            example: "<script>alert(1)</script>",
            ui: function (ctx) {
                var ta = h("textarea", { rows: "2", maxlength: "200", "aria-label": "Case note" }), out = h("div", { class: "lab-out", "aria-live": "polite" }, ["Post a note, then view it as another analyst."]);
                var post = function () {
                    var v = ta.value, hit = /<\s*script|on\w+\s*=|<\s*(img|svg|iframe)|javascript:/i.test(v);
                    clear(out);
                    if (ctx.ver === "v1") {
                        out.className = "lab-out " + (hit ? "bad" : "");
                        if (hit) out.appendChild(h("p", { text: "⚠ In v1 this markup would execute in the viewing analyst's browser (simulated: nothing ran here)." }));
                        out.appendChild(document.createTextNode("Stored and rendered as-is: ")); out.appendChild(h("code", { text: v }));
                        if (hit) ctx.record("exploited");
                    } else {
                        out.className = "lab-out " + (hit ? "ok" : "");
                        out.appendChild(document.createTextNode("Stored and rendered encoded: ")); out.appendChild(h("code", { text: esc(v) })); out.appendChild(h("br"));
                        out.appendChild(h("code", { text: "Content-Security-Policy: default-src 'self'; script-src 'self'" }));
                        if (hit) ctx.record("blocked");
                    }
                };
                return h("div", null, [h("label", { class: "lab-small" }, ["Note", ta]), h("div", { class: "lab-row" }, [h("button", { class: "lab-btn gold", type: "button", text: "Post and view", onclick: post }), h("button", { class: "lab-btn", type: "button", text: "Use example attack", onclick: function () { ta.value = ctx.w.example; post(); } })]), out]);
            }
        },
        {
            id: "bac", name: "Broken access control", cwe: "CWE-862", owasp: "A01",
            steps: ["Find: the admin tab is hidden from analysts, but is the route protected?", "Demonstrate: request the admin endpoint directly as an analyst.", "Fix: verify the role on the server for every request.", "Retest: the same request is refused."],
            ui: function (ctx) {
                var out = h("div", { class: "lab-out", "aria-live": "polite" }, ["You are signed in as analyst1 (role: analyst)."]);
                var call = function (path, admin) {
                    clear(out);
                    if (admin && ctx.ver === "v1") { out.className = "lab-out bad"; out.appendChild(h("code", { text: "GET " + path + " → 200 OK" })); out.appendChild(h("br")); out.appendChild(document.createTextNode("Returned 3 user records. The role was never checked; only the button was hidden.")); ctx.record("exploited"); }
                    else if (admin) { out.className = "lab-out ok"; out.appendChild(h("code", { text: "GET " + path + " → 403 Forbidden" })); out.appendChild(h("br")); out.appendChild(document.createTextNode("Role verified server-side on every request.")); ctx.record("blocked"); }
                    else { out.className = "lab-out"; out.appendChild(h("code", { text: "GET " + path + " → 200 OK" })); out.appendChild(document.createTextNode(" (allowed for analysts)")); }
                };
                return h("div", null, [h("div", { class: "lab-row" }, [h("button", { class: "lab-btn", type: "button", text: "GET /api/incidents", onclick: function () { call("/api/incidents", false); } }), h("button", { class: "lab-btn gold", type: "button", text: "GET /admin/users", onclick: function () { call("/admin/users", true); } })]), out]);
            }
        },
        {
            id: "idor", name: "Insecure direct object reference", cwe: "CWE-639", owasp: "A01",
            steps: ["Find: case URLs carry a numeric ID.", "Demonstrate: change the ID to read someone else's case.", "Fix: check ownership on every request.", "Retest: other people's cases are refused."],
            ui: function (ctx) {
                var id = h("input", { type: "number", value: "101", min: "100", max: "110", "aria-label": "Case ID" }), out = h("div", { class: "lab-out", "aria-live": "polite" }, ["You are analyst1 and own cases 101 and 102."]);
                var go = function () {
                    var n = parseInt(id.value, 10), owner = CASES[n]; clear(out);
                    var line = h("code", { text: "GET /api/cases/" + n });
                    if (!owner) { out.className = "lab-out"; out.appendChild(line); out.appendChild(document.createTextNode(" → 404 Not Found")); return; }
                    if (owner === "analyst1") { out.className = "lab-out"; out.appendChild(line); out.appendChild(document.createTextNode(" → 200 OK (your own case)")); return; }
                    if (ctx.ver === "v1") { out.className = "lab-out bad"; out.appendChild(line); out.appendChild(document.createTextNode(" → 200 OK. Returned " + owner + "'s case. Nothing checked who owns it.")); ctx.record("exploited"); }
                    else { out.className = "lab-out ok"; out.appendChild(line); out.appendChild(document.createTextNode(" → 403 Forbidden. Ownership checked on every request.")); ctx.record("blocked"); }
                };
                return h("div", null, [h("div", { class: "p-form inline" }, [h("label", null, ["Case ID in the URL", id]), h("button", { class: "lab-btn gold", type: "button", text: "Request", onclick: go })]), h("p", { class: "lab-small", text: "Try 103 or 104: they belong to analyst2." }), out]);
            }
        },
        {
            id: "sess", name: "Weak session handling", cwe: "CWE-330", owasp: "A07",
            steps: ["Find: session identifiers look sequential, with no cookie protections.", "Demonstrate: guess the neighbouring session ID.", "Fix: random 256-bit tokens, HttpOnly/Secure/SameSite, short expiry, rotate on login.", "Retest: guessing a neighbour fails."],
            ui: function (ctx) {
                var cur = 1042, tok = function () { var a = new Uint8Array(32); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); };
                var token = tok(), out = h("div", { class: "lab-out", "aria-live": "polite" }), cookie = h("pre", { class: "lab-pre" });
                var show = function () { cookie.textContent = ctx.ver === "v1" ? "Set-Cookie: sid=" + cur + "; Max-Age=604800" : "Set-Cookie: __Host-sid=" + token.slice(0, 24) + "…; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=900"; };
                show();
                return h("div", null, [cookie, h("div", { class: "lab-row" }, [
                    h("button", { class: "lab-btn", type: "button", text: "Log in again", onclick: function () { cur++; token = tok(); show(); clear(out).className = "lab-out"; out.textContent = ctx.ver === "v1" ? "New session id: " + cur + " (next one up)." : "Session rotated: a brand-new random token was issued."; } }),
                    h("button", { class: "lab-btn gold", type: "button", text: "Guess the neighbour's session", onclick: function () {
                        clear(out);
                        if (ctx.ver === "v1") { out.className = "lab-out bad"; out.textContent = "Tried sid=" + (cur + 1) + " → logged in as another user. Sequential IDs are guessable."; ctx.record("exploited"); }
                        else { out.className = "lab-out ok"; out.textContent = "Tried a neighbouring value → rejected. 256-bit random tokens can't be guessed, and cookie flags stop theft from the page."; ctx.record("blocked"); }
                    } })]), out]);
            }
        }
    ];
    var curWeak = 0, curVer = "v1";
    var tabsEl = $("#weak-tabs"), panel = $("#weak-panel");
    function renderTabs() {
        clear(tabsEl);
        WEAK.forEach(function (w, i) {
            tabsEl.appendChild(h("button", { class: "lab-tab", type: "button", role: "tab", "aria-selected": String(i === curWeak), text: (i + 1) + ". " + w.name, onclick: function () { curWeak = i; renderTabs(); renderWeak(); } }));
        });
    }
    function renderWeak() {
        var w = WEAK[curWeak]; clear(panel);
        var ctx = { ver: curVer, w: w, record: function (res) { if (!res) return; R[w.id] = R[w.id] || {}; R[w.id][curVer] = res; renderFindings(); } };
        panel.appendChild(h("h3", { text: w.name }));
        panel.appendChild(h("p", { class: "lab-small" }, [badge(w.cwe, "mute"), " ", badge("OWASP " + w.owasp + ":2021", "mute")]));
        panel.appendChild(h("div", { class: "lab-seg", role: "group", "aria-label": "Portal build" }, ["v1", "v2"].map(function (v) {
            return h("button", { type: "button", "aria-pressed": String(v === curVer), text: v === "v1" ? "v1 · vulnerable" : "v2 · hardened", onclick: function () { curVer = v; renderWeak(); } });
        })));
        panel.appendChild(w.ui.call(w, ctx));
        panel.appendChild(h("ol", { class: "lab-steps" }, w.steps.map(function (s) { var p = s.split(": "); return h("li", null, [h("b", { text: p.shift() + ": " }), p.join(": ")]); })));
    }
    function renderFindings() {
        var tb = clear($("#findings tbody")), done = 0;
        WEAK.forEach(function (w) {
            var r = R[w.id] || {};
            var cell = function (v) { var x = r[v]; if (x) done++; return h("td", null, [x === "exploited" ? badge("exploited", "bad") : x === "blocked" ? badge("blocked", "ok") : badge("not tested", "mute")]); };
            tb.appendChild(h("tr", null, [h("td", { text: w.name }), h("td", { text: w.cwe }), h("td", { text: w.owasp }), cell("v1"), cell("v2")]));
        });
        $("#find-progress").textContent = done + " of " + (WEAK.length * 2) + " checks run. The goal: every v1 exploited, every v2 blocked.";
    }

    /* =========================================================
       5 · SANDBOX
       ========================================================= */
    var CONNS = [
        { from: "Attacker", to: "Decoys", ok: true, why: "This is the intended attack surface." },
        { from: "Attacker", to: "Portal", ok: true, why: "The portal is the assessed target in step 4." },
        { from: "Decoys", to: "Collector", ok: true, why: "One authenticated channel, one port, events only." },
        { from: "Decoys", to: "Internet", ok: false, why: "No route out exists from the decoy side." },
        { from: "Decoys", to: "Event store", ok: false, why: "Different network segment. A compromised decoy can't reach the data." },
        { from: "Attacker", to: "Host machine", ok: false, why: "The host has no address on the lab networks." },
        { from: "Attacker", to: "Event store", ok: false, why: "The attacker has no leg on the internal segment." },
        { from: "Portal", to: "Events API", ok: true, why: "Read-only path the portal uses to pull events." }
    ];
    var term = $("#term"), conns = $("#conns"), termBusy = false;
    function termLine(cls, text) { term.appendChild(h("span", { class: cls, text: text + "\n" })); term.scrollTop = term.scrollHeight; }
    function testConn(c) {
        return sleep(260).then(function () {
            termLine("dim", "$ connect " + c.from + " → " + c.to);
            return sleep(380);
        }).then(function () { termLine(c.ok ? "ok" : "no", (c.ok ? "✔ allowed" : "✖ blocked") + " — " + c.why); });
    }
    CONNS.forEach(function (c) {
        conns.appendChild(h("button", { class: "lab-btn", type: "button", text: c.from + " → " + c.to, onclick: function () { if (termBusy) return; termBusy = true; testConn(c).then(function () { termBusy = false; }); } }));
    });
    $("#conn-all").addEventListener("click", function () {
        if (termBusy) return; termBusy = true; clear(term);
        var p = Promise.resolve(); CONNS.forEach(function (c) { p = p.then(function () { return testConn(c); }); });
        p.then(function () { termBusy = false; });
    });
    function renderSnap() {
        $("#snap-state").textContent = dirty === 0 ? "State: clean snapshot." : "State: " + dirty + " change(s) since the clean snapshot. A real lab reverts the VMs the same way after every test run.";
    }
    $("#snap-revert").addEventListener("click", function () {
        S = seed(); dirty = 0; counts = { total: 0, high: 0, srcs: {} }; R = {}; P.user = null; P.sel = null;
        try { localStorage.removeItem(KEY); } catch (e) { }
        clear(feed); feedEmpty.hidden = false; $("#st-total").textContent = "0"; $("#st-high").textContent = "0"; $("#st-src").textContent = "0";
        renderPortal(); renderFindings(); renderWeak(); renderSnap(); toast("Reverted to the clean snapshot.");
    });

    /* =========================================================
       6 · STATUS (honest)
       ========================================================= */
    [["done", "Idea chosen and project registered"], ["done", "Public concept page"], ["done", "This browser-only interactive mock-up"],
    ["next", "Isolated VM lab on a dedicated machine"], ["next", "Portal v1 with documented weaknesses"], ["next", "Attack, evidence, then v2 hardening and retest"], ["next", "Final written report"]].forEach(function (r) {
        $("#road").appendChild(h("li", null, [badge(r[0] === "done" ? "done" : "planned", r[0] === "done" ? "ok" : "mute"), r[1]]));
    });

    /* ---------- section pills highlight ---------- */
    if ("IntersectionObserver" in window) {
        var links = {}; Array.prototype.forEach.call(document.querySelectorAll("#lab-pills a"), function (a) { links[a.getAttribute("href").slice(1)] = a; });
        var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { for (var k in links) links[k].classList.toggle("on", k === en.target.id); } }); }, { rootMargin: "-30% 0px -60% 0px" });
        Object.keys(links).forEach(function (id) { io.observe(document.getElementById(id)); });
    }

    /* ---------- init ---------- */
    renderPortal(); renderTabs(); renderWeak(); renderFindings(); renderSnap();
})();
