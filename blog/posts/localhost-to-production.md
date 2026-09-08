# From Localhost to Production: Problems Nobody Mentions in Tutorials

The tutorial ends when it runs on your machine. That is where the real work starts. These are the things that broke the first few times I shipped something for real.

## DNS

It works by name on your laptop because of a hosts file entry you forgot you added. In production you need a real domain, records pointed at the right place, and the patience to wait for propagation. Half of "the site is down" right after a launch is just DNS not having caught up yet.

## Networking between services

On localhost everything is 127.0.0.1 and every port is open. In production your app, database and cache are separate hosts or containers on a network with rules. "Connection refused" almost always means the service is fine and the network is not.

## Permissions

Your dev user can read and write everything. The production service account cannot, and should not. Files owned by the wrong user, a directory the app cannot write to, a mounted volume that came up owned by root: each of these costs an hour the first time you meet it.

## Containers

The image that worked yesterday pulls a new base layer and breaks today. Config that is baked in at build time does not change just because you edited the file on the server. You learn to pin versions and to actually rebuild, not just pull.

## Environment configuration

Secrets and settings that lived in your shell now have to come from somewhere on the server. Miss one variable and the app starts, looks healthy, and fails only on the one code path that needed it.

## The pattern

Every one of these is the same lesson. Your machine is a forgiving environment full of state you set up without noticing. Production is a clean, locked-down machine that does exactly what you told it and nothing more. Shipping is mostly the work of finding everything you were relying on without knowing.
