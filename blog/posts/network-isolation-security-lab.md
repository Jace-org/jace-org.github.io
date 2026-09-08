# Why Network Isolation Matters in a Cybersecurity Lab

A security lab runs things you would never trust on your normal network: malware samples, deliberately vulnerable machines, tools that are half written. Isolation is what keeps a lab from turning into an incident. Here is how I think about it.

## Blast radius

The point of segmentation is to limit how far a problem can spread. If a vulnerable box gets popped, what else can the attacker reach from it? On a flat network, everything. With segmentation, just the segment it lives in.

## VLANs and segments

I split the lab into separate networks by trust level:

- A target network for the intentionally weak machines
- A tooling network for the attack boxes
- Management, kept apart from both
- No path from any of it into my real devices

VLANs on a managed switch do this without extra hardware. Rules between segments are default deny, and I open only the specific paths a given exercise needs.

## Zero trust, in miniature

The lab version of zero trust is simple: no machine is trusted just because it is "inside". Every cross-segment connection is allowed on purpose or not at all. A target machine has no reason to reach the internet or the management network, so it cannot.

## Practical points

- Give the lab its own switch path, physical or virtual, not a spare port on the house network
- Snapshot targets so you can reset them quickly
- Assume anything on the target network is hostile, including after an exercise is over
- Log the choke points between segments. That is where you see lateral movement.

## Why it is worth the setup time

Without isolation, one careless sample or one real vulnerability in a tool turns your lab into a foothold on your actual life: your files, your other machines, your accounts. With it, the worst case is that you rebuild a segment. The lab stays a place to break things safely, which is the whole reason to have one.
