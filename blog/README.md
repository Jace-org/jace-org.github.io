# Blog

Posts are plain Markdown files in `posts/`, listed in `posts.json`.

## Add a post

1. Create `posts/my-post.md` (no frontmatter needed, just write).
2. Add an entry to `posts.json`:

   ```json
   {
     "slug": "my-post",
     "title": "My post title",
     "date": "2026-09-10",
     "tags": ["Web"],
     "excerpt": "One line shown on the blog index.",
     "file": "my-post.md"
   }
   ```

3. Commit and push. The site rebuilds automatically.

Newest `date` shows first. `tags` become filter buttons.
The renderer supports headings, lists, links, images, quotes,
inline code and fenced code blocks.
