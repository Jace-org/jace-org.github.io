# Resources

Files live in `files/`, listed in `toolbox.json`.

## Add a downloadable file

1. Drop the file into `files/` (pdf, md, zip, html, image, anything).
2. Add an entry to `toolbox.json`:

   ```json
   {
     "title": "Thing name",
     "description": "One or two lines about it.",
     "category": "Cheat Sheets",
     "type": "PDF",
     "file": "thing.pdf",
     "size": "1.2 MB"
   }
   ```

## Add an external link instead

   ```json
   {
     "title": "Some tool",
     "description": "What it is.",
     "category": "Tools",
     "type": "Repo",
     "url": "https://github.com/you/thing"
   }
   ```

`category` values become the filter buttons and the section headings.
