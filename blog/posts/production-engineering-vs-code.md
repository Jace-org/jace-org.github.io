# Why Production Engineering Is Different from Writing Code

Writing code that works is a small part of running something people depend on. The rest is a different skill set, and it is the part that decides whether the thing stays up.

## Writing code answers "does it work"

Production engineering answers a harder set of questions:

- Does it still work at 3am with nobody watching
- What happens when a dependency is slow or down
- How do I find out it broke before a user tells me
- How fast can I get it back
- What is the damage if it is attacked, or the data leaks

## The parts that are not code

- Reliability: retries, timeouts, graceful failure, not falling over because one thing hiccuped
- Monitoring: metrics and alerts that fire on real problems and stay quiet on noise
- Backups: tested restores, retained history, a target the main box cannot wipe
- Security: least privilege, patched systems, a small attack surface, secrets kept out of the repo
- Deployment: a repeatable way to ship and to roll back, so a bad release is a five minute problem

## A different sense of "done"

Code is done when the feature works. A production system is never done. It needs patching, its dependencies move, its traffic changes, and its failure modes only show up under load you did not test for. "Done" turns into "running well and easy to fix".

## Why it is worth learning

Building every layer of my own infrastructure forced this on me. There was no ops team to hand a broken thing to. That was slow, but now when something is wrong I can tell whether it is the code, the container, the database, the network or the host, because I own all of them. Writing the code was the easy half.
