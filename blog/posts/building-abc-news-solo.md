# Building the ABC News site on my own

I built the ABC News site by myself, start to finish. That meant the design, the WordPress theme, the publishing tools, and all of the server and deployment work. This post is a plain rundown of what that involved.

## The front of the site

The theme is custom. Home page layout, category pages, the article template, the menus, the search, all of it hand written rather than a bought theme with the parts swapped out. I kept the markup simple so pages stay fast on slow connections, which matters a lot for readers in Nepal.

## The publishing side

A news site lives or dies on how fast editors can get a story out. I spent a good amount of time on the editor workflow: draft, review, publish, with the roles set up so the right people can do the right things and nothing else. There is also automation around article generation and importing content, so routine posts do not eat an editor's whole day.

## Running it

This is the part people forget when they picture a "website".

- A Linux server, set up and hardened by hand
- Docker containers for the app, the database and the cache
- Backups that actually get tested, not just scheduled
- TLS, a CDN in front, and monitoring so I hear about problems before readers do

When something breaks at 2am, there is no team to hand it to. So I built it to be boring and easy to bring back up.

## What I took away from it

Doing every layer yourself is slow, but you end up understanding the whole system. When a page is slow I know whether it is the theme, the database, the cache or the network, because I built each one. That is worth the extra time.
