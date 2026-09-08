# Cloudflare Tunnels as Part of a Self-Hosted Infrastructure

I run services on machines that sit behind a home or office router. Cloudflare Tunnel is how I expose the few that need to be public without opening any ports. Here is where it fits and where it does not.

## The problem it solves

Normally, to reach a service from the internet you forward a port on your router to the machine. That means:

- An open port that gets scanned continuously
- Your real IP address exposed
- A need for a static IP or dynamic DNS

A tunnel flips this around. A small daemon on your machine makes an outbound connection to Cloudflare and holds it open. Traffic for your hostname arrives at Cloudflare's edge and rides back down that connection. There are no inbound ports at all.

## What that buys you

- Nothing to forward, nothing to open in the firewall
- TLS terminates at the edge, so certificates are handled for you
- The origin IP stays hidden
- It works the same whether the box is on the LAN, has moved networks, or is behind CGNAT

## How I use it

- Public status pages and dashboards that should be reachable off the office network
- A CDN origin on the NAS, with Cloudflare caching in front
- Anything I would otherwise have shoved onto the VPS just to get a public URL

Internal-only services do not get a tunnel. They stay on the private network and I reach them over a VPN.

## Limitations to know

- You are trusting Cloudflare with your traffic and depending on their uptime
- It is an HTTP proxy at heart, so other protocols need extra setup or do not fit
- The free tier terms are worth reading if you plan to serve large files or video
- The daemon is one more process to keep alive, so it needs a watchdog and a start-on-boot entry

## Where it sits in the bigger picture

Tunnels are the public door. Behind them everything is still segmented: public services on their own path, private services on the VPN, and the sensitive machines never exposed at all. A tunnel reduces attack surface. It does not replace the rest of the design.
