# What Happens When an Internet-Facing Server Gets Attacked?

The moment a server has a public IP, it is being probed. Not maybe, not eventually. Within minutes. Here is what that actually looks like and what to do about it.

## The constant background noise

Every public server sees a steady stream of:

- Port scans mapping what you have open
- Login attempts against SSH, mail and admin panels, using common usernames and leaked passwords
- Requests for well-known vulnerable paths: old plugin URLs, config files, admin endpoints
- Probes for software with known CVEs

This is automated and untargeted. It never stops. It is the baseline, not an attack in itself.

## The attack surface

Your exposure is the sum of what is reachable: open ports, running services, web apps and their dependencies, and any credentials that can be used from outside. Every one is a thing to patch and watch. The smallest safe surface is the goal, which is why I keep public machines thin and everything else off the public network.

## Logs are the record

When something happens, the logs are what you have:

- Auth logs for who tried to get in, and from where
- Web server logs for what was requested
- Application logs for what the app did in response
- System logs for what changed on the host

If they only live on the box, an attacker who gets in can edit them. Shipping logs somewhere separate matters for exactly that reason.

## Detection

You are looking for the thing that stands out from the background noise:

- A login that succeeded when it should not have
- A process or an outbound connection that was not there before
- A file changed that nobody deployed
- A spike in traffic or errors on one specific path

## Incident response, briefly

1. Contain: isolate the box, cut its network path, do not power it off if you want memory
2. Assess: what got in, how, and what did they touch
3. Recover: rebuild from known good, rotate every credential the box could see
4. Learn: close the hole, and add the detection that would have caught it sooner

## The takeaway

You cannot stop the probing. You can keep the surface small, keep software patched, keep logs off the box, and know in advance what you would do. A server that is designed to be rebuilt is a bad day. One that is not is a very bad week.
