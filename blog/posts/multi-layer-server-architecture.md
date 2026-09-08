# What I Learned Designing a Multi-Layer Server Architecture

My setup is not one server. It is a VPS, a NAS, a backup box and some tunnels, each with one job. Splitting it that way was not planned up front. It grew out of hitting problems. Here is what pushed it into shape.

## The layers

- A VPS that runs the public sites. Small, replaceable, exposed on purpose.
- A NAS at the office for bulk storage: media, archives, datasets. Never public.
- A separate backup server that pulls copies and keeps history. It reaches the others; nothing reaches back into it.
- Tunnels and a VPN connecting everything, so the private machines never need open ports.

## Why separate the public part

The VPS is the machine most likely to be attacked, so it holds the least. If it is compromised or just dies, I can rebuild it from config and lose nothing that matters. The data lives elsewhere.

## Why storage is its own layer

Disk on a VPS is small and expensive. Disk on a NAS at home is large and cheap. Moving old media and archives off the VPS onto the NAS, and serving them back through a proxy, kept the VPS small without deleting anything. Storage growth stopped being a monthly worry.

## Why backups get their own box

A backup on the same machine is not a backup. A backup that the main machine can reach and overwrite is only half a backup. The backup server pulls, the main servers cannot push into it, and old snapshots survive even if a live machine is wiped or ransomwared.

## What the separation costs

- More machines to patch and monitor
- More network plumbing, which is where most of my outages have actually started
- You have to know which machine does what at 2am, from memory

## The payoff

Each machine has a small, clear job, so a problem is easier to place. I can lose any one layer and recover from it. And the pieces that would genuinely hurt to lose are the ones that nothing can reach directly.
