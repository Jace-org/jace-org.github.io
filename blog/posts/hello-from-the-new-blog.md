# Hello from the new blog

For a while my blog lived on a separate subdomain. It ran on its own setup and it was one more thing to keep alive. I moved it here, onto the same site as my portfolio, so there is only one place to look after.

## How it works

Every post is a plain Markdown file in the `blog/posts` folder of the site repo. A small list file, `posts.json`, keeps the title, date, tags and short summary for each one. When you open the blog, a bit of JavaScript reads that list and shows the cards. When you open a post, it fetches the Markdown file and renders it in the browser.

There is no server and no build step. It is just static files on GitHub Pages, which means it is free to host and hard to break.

## Writing a new post

1. Add a Markdown file to `blog/posts`.
2. Add one entry to `posts.json` pointing at it.
3. Commit and push.

That is the whole flow. If you are reading this, it worked.

## What I will write about

Mostly the things I actually spend time on: building web apps, running my own servers, security work, and lately training small models at home. Short and practical, not long essays.
