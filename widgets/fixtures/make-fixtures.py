#!/usr/bin/env python3
"""Regenerate contract-shaped sample JSON (fresh timestamps). Run: python3 widgets/fixtures/make-fixtures.py
Writes ./ (fresh) and ./stale (generated_at 5 h old). Hostile samples in ./bad are hand-written."""
import json, os, datetime as dt
here = os.path.dirname(os.path.abspath(__file__))
now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
iso = lambda t: t.isoformat().replace('+00:00', 'Z')

def build(gen):
    g = iso(gen)
    cves = {"schema": 1, "generated_at": g, "items": [
        {"id": "CVE-2026-1001", "published": iso(now - dt.timedelta(hours=2)), "cvss": 9.8, "severity": "CRITICAL",
         "summary": "Sample: unauthenticated remote code execution in an example web gateway.", "url": "https://nvd.nist.gov/vuln/detail/CVE-2026-1001"},
        {"id": "CVE-2026-1002", "published": iso(now - dt.timedelta(days=1)), "cvss": 9.1, "severity": "CRITICAL",
         "summary": "Sample: authentication bypass in an example VPN appliance.", "url": "https://nvd.nist.gov/vuln/detail/CVE-2026-1002"}]}
    hn = {"schema": 1, "generated_at": g, "items": [
        {"id": 1000 + i, "title": "Sample story number %d about systems programming" % i, "url": "https://example.com/story-%d" % i,
         "host": "example.com", "score": 400 - i * 20, "comments": 100 - i * 5, "time": int((now - dt.timedelta(hours=i + 1)).timestamp()),
         "hn_url": "https://news.ycombinator.com/item?id=%d" % (1000 + i)} for i in range(12)]}
    hist = [{"date": (now - dt.timedelta(days=89 - i)).strftime('%Y-%m-%d'), "asn_count": 120 + i // 20, "prefix_count": 900 + i * 3 + (i % 7)} for i in range(90)]
    pulse = {"schema": 1, "generated_at": g, "country": "NP", "asn_count": 124, "prefix_count_v4": 720, "prefix_count_v6": 260,
        "networks": [
            {"asn": 23752, "name": "Nepal Telecom", "announced_prefixes": 40, "visible": True},
            {"asn": 17501, "name": "WorldLink", "announced_prefixes": 85, "visible": True},
            {"asn": 45650, "name": "Vianet", "announced_prefixes": 30, "visible": True},
            {"asn": 38565, "name": "Ncell", "announced_prefixes": 12, "visible": False},
            {"asn": 139922, "name": "DishHome", "announced_prefixes": 9, "visible": True}],
        "history": hist,
        "outages": [{"date": "2026-01-15", "title": "Sample outage entry", "note": "Sample note: fixture data, not a real event.", "source_url": "https://example.com/report"}]}
    nowj = {"schema": 1, "generated_at": g, "text": "Sample status: testing the data widgets.", "updated": iso(now - dt.timedelta(hours=6))}
    topics = ["smartglasses launch", "chip export rules", "open-source database release", "undersea cable repair", "browser security update", "robotics startup funding"]
    tech = {"schema": 1, "generated_at": g, "items": [
        {"id": 5000 + i, "title": "Sample tech story %d: %s" % (i, topics[i % 6]),
         "summary": "Sample summary for fixture story %d. It is deliberately long enough to need trimming so the card layout can be checked with a realistic amount of text in it." % i,
         "link": "https://abcnews.com.np/sample-tech-story-%d/" % i,
         "date_gmt": (now - dt.timedelta(hours=i * 3 + 1)).strftime('%Y-%m-%dT%H:%M:%S')} for i in range(30)]}
    health = {"ok": True, "generated_at": g}
    return {"cves": cves, "hn": hn, "pulse": pulse, "now": nowj, "tech": tech, "health": health}

for d, gen in ((here, now), (os.path.join(here, 'stale'), now - dt.timedelta(hours=5))):
    for k, v in build(gen).items():
        with open(os.path.join(d, k + '.json'), 'w') as f: json.dump(v, f, indent=1)
