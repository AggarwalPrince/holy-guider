# How to publish a new blog post

1. Create a new file in this folder: `blog-posts/your-post-slug.md`
   (use lowercase letters, numbers, and hyphens only — this becomes the URL)

2. Paste this template at the top and fill it in:

   ```
   ---
   title: "Your Post Title Here"
   description: "One or two sentences. This is what shows up under your title in Google search results — make it count."
   date: "2026-09-27"
   slug: "your-post-slug"
   tags: ["tag one", "tag two"]
   ---

   Write your post here in plain markdown.

   ## Use ## for section headings

   Regular paragraphs just work. **Bold** and *italic* work too.

   > Blockquotes look like this — good for scripture verses.

   - bullet
   - points
   - work fine

   [A link looks like this](/select-religion)
   ```

3. That's it. Commit and push:

   ```
   git add blog-posts/your-post-slug.md
   git commit -m "Add blog post: your post title"
   git push
   ```

   Your host (Vercel/Render/wherever) runs `npm run build` automatically on
   push, which runs `npm run blog` first — so the new post becomes a real
   page at `https://holyguider.com/blog/your-post-slug/`, gets added to
   `sitemap.xml` automatically, and shows up on the `/blog/` listing page.
   Nothing else to configure.

## Checking it locally before you push (optional)

```
npm run blog        # just regenerates the blog pages + sitemap, fast
```
Then open `frontend/public/blog/your-post-slug/index.html` directly in a
browser to preview it.

Or run the full thing exactly like the deploy will:
```
npm run build
npm run preview     # serves the built dist/ folder locally
```

## Rules the build script enforces

- `title`, `date`, and a valid `slug` are required — the build fails loudly
  (with a clear error) if one is missing, rather than silently publishing a
  broken page.
- Two posts can't share the same slug — the build fails if they do.
- Slugs may only contain lowercase letters, numbers, and hyphens.

## A note on quoting scripture

Ancient scripture itself (the Gita, the Bible, the Quran, etc.) is public
domain. But a specific *translation* of it can be copyrighted — quoting a
modern translator's exact wording is a real legal risk. Safer approach:
paraphrase the teaching in your own words rather than quoting a translation
verbatim, the way the two example posts in this folder do. It's also better
for SEO — Google favors original wording over text that's duplicated across
thousands of other scripture sites.
