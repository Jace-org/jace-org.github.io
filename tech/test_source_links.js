// Offline test for SOURCE_HOSTS handling in tech.js. Run: node tech/test_source_links.js
const vm = require("vm"), fs = require("fs"), path = require("path"), assert = require("assert");
const win = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "tech.js"), "utf8"), { window: win, document: { getElementById: () => null }, URL });
const f = win.TechBriefing.safeSource;
["https://theverge.com/a", "https://www.theverge.com/a?x=1", "https://www.wired.com/x", "https://theverge.com:443/a"].forEach(u => assert.ok(f(u), u));
["javascript:alert(1)", "http://theverge.com/a", "https://theverge.com.evil.example/a", "https://evil.example/theverge.com",
 "https://theverge.com@evil.example/", "https://user:pw@theverge.com/", "data:text/html,x", "https://evil.example\\@theverge.com/",
 "https://notwired.com/a", "https://theverge.com/\u0000", "https://theverge.com/" + "a".repeat(600), "", null, 5, "//theverge.com/a",
 "https://feeds.theverge.com/a", "https://feeds.wired.com/x", "https://evil%2f.theverge.com/x", "https://theverge.com:8443/a",
 "https://theverge.com./a", "https://@theverge.com/a", "https://theverge.com/a b", "https://m.wired.com/x", "https://www.www.theverge.com/a"
].forEach(u => assert.strictEqual(f(u), "", String(u)));
console.log("ok");
