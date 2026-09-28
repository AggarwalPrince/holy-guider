#!/usr/bin/env node
/**
 * build-blog.js
 * ---------------------------------------------------------------------------
 * Turns every markdown file in /blog-posts into a real, standalone, static
 * HTML page under /public/blog/<slug>/index.html — plain HTML with the text
 * already in it, so search engines (and anyone with JS disabled) can read it
 * with zero client-side rendering.
 *
 * Also regenerates:
 *   - /public/blog/index.html   (a listing page of all posts, newest first)
 *   - /public/sitemap.xml       (static routes + every blog post, in sync)
 *
 * Runs automatically before every `npm run build` via the "prebuild" script
 * in package.json — so pushing a new .md file and deploying is the entire
 * workflow. Can also be run on its own with `npm run blog`.
 * ---------------------------------------------------------------------------
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "blog-posts");
const OUT_DIR = path.join(ROOT, "public", "blog");
const SITEMAP_PATH = path.join(ROOT, "public", "sitemap.xml");

const SITE_URL = "https://holyguider.com";
const SITE_NAME = "Holy Guider";
const BRAND = {
  stone: "#EDEEEA",
  ink: "#0D1013",
  inkSoft: "#2A2F33",
  inkMuted: "#565C61",
  brass: "#9E7418",
  accentSoft: "#EFE6D2",
};

// Static (non-blog) routes that belong in the sitemap. Kept here so the
// sitemap is generated in one place instead of hand-edited separately.
const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/select-religion", priority: "0.9", changefreq: "weekly" },
  { path: "/privacy", priority: "0.5", changefreq: "monthly" },
  { path: "/terms", priority: "0.5", changefreq: "monthly" },
  { path: "/terms", priority: "0.5", changefreq: "monthly" },
];

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  // README.md documents how to add a post — it is not itself a post.
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md");

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    const slug = (data.slug || file.replace(/\.md$/, "")).trim();
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error(
        `Invalid slug "${slug}" from ${file} — slugs may only contain lowercase letters, numbers, and hyphens.`
      );
    }
    if (!data.title) throw new Error(`${file} is missing a "title" in its frontmatter.`);
    if (!data.date) throw new Error(`${file} is missing a "date" in its frontmatter (YYYY-MM-DD).`);

    return {
      slug,
      title: data.title,
      description: data.description || "",
      date: data.date,
      tags: Array.isArray(data.tags) ? data.tags : [],
      html: marked.parse(content),
    };
  });

  // Fail loudly on duplicate slugs rather than silently overwriting one post
  // with another during the build.
  const seen = new Set();
  for (const p of posts) {
    if (seen.has(p.slug)) throw new Error(`Duplicate blog slug detected: "${p.slug}"`);
    seen.add(p.slug);
  }

  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function pageShell({ title, description, canonical, ogType = "website", jsonLd = null, bodyHtml }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <link rel="canonical" href="${canonical}" />
    <link rel="icon" type="image/svg+xml" href="${SITE_URL}/favicon.svg" />

    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${SITE_URL}/og-image.svg" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${SITE_URL}/og-image.svg" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital@0;1&display=swap" rel="stylesheet" />

    ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}

    <style>
      :root {
        --stone: ${BRAND.stone}; --ink: ${BRAND.ink}; --ink-soft: ${BRAND.inkSoft};
        --ink-muted: ${BRAND.inkMuted}; --brass: ${BRAND.brass}; --accent-soft: ${BRAND.accentSoft};
      }
      * { box-sizing: border-box; }
      body {
        margin: 0; background: var(--stone); color: var(--ink);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.65;
      }
      .wrap { max-width: 700px; margin: 0 auto; padding: 48px 24px 96px; }
      .top-link { display: inline-block; margin-bottom: 32px; color: var(--brass); text-decoration: none; font-weight: 600; font-size: 0.9rem; }
      .top-link:hover { text-decoration: underline; }
      h1 { font-family: 'Lora', Georgia, serif; font-size: 2.1rem; line-height: 1.25; margin: 0 0 8px; }
      h2 { font-family: 'Lora', Georgia, serif; font-size: 1.4rem; margin: 40px 0 12px; color: var(--ink); }
      .meta { color: var(--ink-muted); font-size: 0.85rem; margin-bottom: 32px; }
      .tags { margin-top: 8px; }
      .tag { display: inline-block; background: var(--accent-soft); color: var(--brass); font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 999px; margin-right: 6px; }
      p { margin: 0 0 16px; color: var(--ink-soft); }
      blockquote { margin: 24px 0; padding: 4px 20px; border-left: 3px solid var(--brass); color: var(--ink); font-style: italic; }
      a { color: var(--brass); }
      ul, ol { color: var(--ink-soft); padding-left: 22px; }
      li { margin-bottom: 6px; }
      hr { border: none; border-top: 1px solid var(--accent-soft); margin: 40px 0; }
      .cta { display: inline-block; margin-top: 8px; padding: 12px 28px; border-radius: 999px; background: var(--ink); color: var(--stone) !important; text-decoration: none; font-weight: 600; }
      .post-list-item { display: block; padding: 20px 0; border-bottom: 1px solid var(--accent-soft); text-decoration: none; color: inherit; }
      .post-list-item:hover h2 { color: var(--brass); }
      .post-list-item h2 { margin: 0 0 6px; }
      .post-list-item p { margin: 0; color: var(--ink-muted); font-size: 0.95rem; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <a class="top-link" href="/blog/">&larr; All posts</a>
      ${bodyHtml}
    </div>
  </body>
</html>`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function buildPostPage(post) {
  const canonical = `${SITE_URL}/blog/${post.slug}/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.svg` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  };

  const tagsHtml = post.tags.length
    ? `<div class="tags">${post.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`
    : "";

  const bodyHtml = `
    <article>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="meta">${formatDate(post.date)}${tagsHtml}</div>
      ${post.html}
    </article>
  `;

  const html = pageShell({
    title: `${post.title} | ${SITE_NAME}`,
    description: post.description,
    canonical,
    ogType: "article",
    jsonLd,
    bodyHtml,
  });

  const dir = path.join(OUT_DIR, post.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
}

function buildIndexPage(posts) {
  const canonical = `${SITE_URL}/blog/`;
  const listHtml = posts
    .map(
      (p) => `
      <a class="post-list-item" href="/blog/${p.slug}/">
        <h2>${escapeHtml(p.title)}</h2>
        <p>${escapeHtml(p.description)}</p>
      </a>`
    )
    .join("");

  const bodyHtml = `
    <h1>Reflections & Guidance</h1>
    <p style="margin-bottom:32px;">Short, practical pieces on scripture, reflection, and finding steadiness — from the ${SITE_NAME} team.</p>
    ${listHtml || "<p>New posts are on the way — check back soon.</p>"}
  `;

  const html = pageShell({
    title: `Blog | ${SITE_NAME}`,
    description: `Reflections on spiritual wisdom, scripture, and daily practice from ${SITE_NAME}.`,
    canonical,
    bodyHtml: bodyHtml.replace(`<a class="top-link" href="/blog/">&larr; All posts</a>`, ""),
  });

  // The index page shouldn't link back to itself — swap the shared "back"
  // link for a link into the app instead.
  const finalHtml = html.replace(
    `<a class="top-link" href="/blog/">&larr; All posts</a>`,
    `<a class="top-link" href="/">&larr; ${SITE_NAME}</a>`
  );

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), finalHtml, "utf-8");
}

function buildSitemap(posts) {
  const today = new Date().toISOString().slice(0, 10);

  const staticUrls = STATIC_ROUTES.map(
    (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  );

  const blogIndexUrl = `  <url>
    <loc>${SITE_URL}/blog/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

  const postUrls = posts.map(
    (p) => `  <url>
    <loc>${SITE_URL}/blog/${p.slug}/</loc>
    <lastmod>${p.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${[...staticUrls, blogIndexUrl, ...postUrls].join("\n")}
</urlset>
`;

  fs.writeFileSync(SITEMAP_PATH, xml, "utf-8");
}

function main() {
  // Start clean so a renamed/deleted post's old HTML doesn't linger.
  if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true, force: true });

  const posts = readPosts();
  posts.forEach(buildPostPage);
  buildIndexPage(posts);
  buildSitemap(posts);

  console.log(`[build-blog] Generated ${posts.length} post(s), the blog index, and sitemap.xml.`);
  posts.forEach((p) => console.log(`  → /blog/${p.slug}/`));
}

main();
