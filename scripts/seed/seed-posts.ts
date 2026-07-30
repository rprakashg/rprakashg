/**
 * Seeds Sanity `post`/`category`/`tag`/`author` documents from the markdown
 * posts in https://github.com/rprakashg/blog (a Gatsby blog repo).
 *
 * Usage:
 *   tsx scripts/seed/seed-posts.ts --repo <path-to-cloned-blog-repo> [options]
 *
 * Options:
 *   --repo <path>       Path to a local clone of the blog repo (required)
 *   --dry-run           Parse + convert everything, print a summary, write nothing
 *   --include-drafts    Also seed posts with `published: false` in front matter
 *   --overwrite         Replace existing documents instead of skipping ones that already exist
 *   --limit <n>         Only process the first n posts (after filtering), for quick testing
 *
 * Requires env vars (read from .env.local if present, or already exported):
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 *   NEXT_PUBLIC_SANITY_API_VERSION
 *   SANITY_API_WRITE_TOKEN   (a token with Editor/write access — the read token won't work)
 */
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import matter from "gray-matter";
import { createClient, type SanityClient } from "@sanity/client";

import {
  markdownToPortableText,
  type ImageResolution,
  type PortableTextEntry,
} from "./markdown-to-portable-text";

type Frontmatter = {
  title: string;
  date: string;
  author?: string;
  published?: boolean;
  archived?: boolean;
  categories?: string[];
  tags?: string[];
};

type Args = {
  repo: string;
  dryRun: boolean;
  includeDrafts: boolean;
  overwrite: boolean;
  limit?: number;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };
  const repo = get("--repo");
  if (!repo) {
    throw new Error("Missing required --repo <path-to-cloned-blog-repo>");
  }
  const limitRaw = get("--limit");
  return {
    repo: resolve(repo),
    dryRun: argv.includes("--dry-run"),
    includeDrafts: argv.includes("--include-drafts"),
    overwrite: argv.includes("--overwrite"),
    limit: limitRaw ? Number(limitRaw) : undefined,
  };
}

/** Minimal .env.local loader (KEY=VALUE lines only) so this script can run standalone via tsx. */
function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

function plainText(blocks: PortableTextEntry[]): string {
  return blocks
    .filter((b): b is Extract<PortableTextEntry, { _type: "block" }> => b._type === "block")
    .map((b) => b.children.map((c) => c.text).join(""))
    .join(" ")
    .trim();
}

function excerptFrom(blocks: PortableTextEntry[]): string | undefined {
  const firstNormal = blocks.find(
    (b): b is Extract<PortableTextEntry, { _type: "block" }> =>
      b._type === "block" && b.style === "normal" && !b.listItem,
  );
  if (!firstNormal) return undefined;
  const text = firstNormal.children.map((c) => c.text).join("");
  if (text.length <= 200) return text;
  return `${text.slice(0, 200).replace(/\s+\S*$/, "")}…`;
}

function readTimeFrom(blocks: PortableTextEntry[]): number {
  const words = plainText(blocks).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Resolves a markdown image reference to a local file inside the cloned blog repo. */
function resolveLocalImagePath(repo: string, url: string): string | null {
  const clean = url.split("?")[0];
  const candidates = clean.startsWith("/")
    ? [join(repo, clean), join(repo, "static", clean), join(repo, "src/images", basename(clean))]
    : [join(repo, "posts", clean), join(repo, "src/images", basename(clean))];

  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function contentTypeFor(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

async function uploadImage(
  client: SanityClient,
  path: string,
  cache: Map<string, string>,
  dryRun: boolean,
): Promise<string> {
  const cached = cache.get(path);
  if (cached) return cached;
  if (dryRun) {
    const fake = `dry-run-asset-${basename(path)}`;
    cache.set(path, fake);
    return fake;
  }
  const asset = await client.assets.upload("image", createReadStream(path), {
    filename: basename(path),
    contentType: contentTypeFor(path),
  });
  cache.set(path, asset._id);
  return asset._id;
}

async function main() {
  loadEnvLocal();
  const args = parseArgs();

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-07-28";
  const token = process.env.SANITY_API_WRITE_TOKEN;

  if (!projectId || !dataset) {
    throw new Error(
      "Missing NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET (checked .env.local and process.env).",
    );
  }
  if (!token && !args.dryRun) {
    throw new Error(
      "Missing SANITY_API_WRITE_TOKEN. Create a write token in sanity.io/manage (API > Tokens) " +
        "and set SANITY_API_WRITE_TOKEN in .env.local, or pass --dry-run to preview without writing.",
    );
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });

  const postsDir = join(args.repo, "posts");
  if (!existsSync(postsDir)) {
    throw new Error(`No posts/ directory found at ${postsDir} — is --repo pointing at the blog repo?`);
  }

  const postFiles = readdirSync(postsDir).filter((f) => f.endsWith(".md"));

  type ParsedPost = {
    slug: string;
    file: string;
    data: Frontmatter;
    content: string;
  };

  const parsed: ParsedPost[] = postFiles.map((file) => {
    const raw = readFileSync(join(postsDir, file), "utf8");
    const { data, content } = matter(raw);
    return {
      slug: file.replace(/\.md$/, ""),
      file,
      data: data as Frontmatter,
      content,
    };
  });

  const included = parsed
    .filter((p) => args.includeDrafts || p.data.published !== false)
    .slice(0, args.limit);

  console.log(
    `Found ${parsed.length} posts, ${included.length} selected ` +
      `(${args.includeDrafts ? "including drafts" : "published only"}).`,
  );

  // ---- Author -------------------------------------------------------------
  const profilePath = join(args.repo, "data/profile.yml");
  let authorName = "Ram Gopinathan";
  let authorBio: string | undefined;
  if (existsSync(profilePath)) {
    const yml = readFileSync(profilePath, "utf8");
    authorName = yml.match(/^name:\s*"?([^"\n]+)"?/m)?.[1]?.trim() ?? authorName;
    authorBio = yml.match(/^bio:\s*"?([^"\n]+)"?/m)?.[1]?.trim();
  }
  const authorId = `author-${slugify(authorName)}`;
  const imageCache = new Map<string, string>();

  let authorImageAssetId: string | undefined;
  for (const candidate of ["src/images/ram-profile.jpeg", "src/images/profile.jpeg"]) {
    const path = join(args.repo, candidate);
    if (existsSync(path)) {
      authorImageAssetId = await uploadImage(client, path, imageCache, args.dryRun);
      break;
    }
  }

  const authorDoc = {
    _id: authorId,
    _type: "author" as const,
    name: authorName,
    bio: authorBio,
    ...(authorImageAssetId
      ? { image: { _type: "image", asset: { _type: "reference", _ref: authorImageAssetId } } }
      : {}),
  };

  // ---- Categories & tags ----------------------------------------------------
  const categoryMap = new Map<string, { _id: string; title: string; slug: string }>();
  const tagMap = new Map<string, { _id: string; title: string; slug: string }>();

  for (const post of included) {
    for (const raw of post.data.categories ?? []) {
      const slug = slugify(raw);
      if (!categoryMap.has(slug)) {
        categoryMap.set(slug, { _id: `category-${slug}`, title: titleCase(raw), slug });
      }
    }
    for (const raw of post.data.tags ?? []) {
      const slug = slugify(raw);
      if (!tagMap.has(slug)) {
        tagMap.set(slug, { _id: `tag-${slug}`, title: titleCase(raw), slug });
      }
    }
  }

  console.log(`Author: ${authorName}`);
  console.log(`Categories: ${categoryMap.size}, Tags: ${tagMap.size}`);

  // ---- Write reference documents (author, categories, tags) -----------------
  const put = args.overwrite
    ? (doc: Record<string, unknown>) => client.createOrReplace(doc as never)
    : (doc: Record<string, unknown>) => client.createIfNotExists(doc as never);

  if (!args.dryRun) {
    await put(authorDoc);
    for (const category of categoryMap.values()) {
      await put({
        _id: category._id,
        _type: "category",
        title: category.title,
        slug: { _type: "slug", current: category.slug },
      });
    }
    for (const tag of tagMap.values()) {
      await put({
        _id: tag._id,
        _type: "tag",
        title: tag.title,
        slug: { _type: "slug", current: tag.slug },
      });
    }
  }

  // ---- Posts ------------------------------------------------------------
  const imageWarnings: { post: string; warning: string }[] = [];
  let created = 0;

  for (const post of included) {
    const { blocks, warnings } = await markdownToPortableText(post.content, async ({ url, alt }) => {
      const path = resolveLocalImagePath(args.repo, url);
      if (!path) return null;
      const assetId = await uploadImage(client, path, imageCache, args.dryRun);
      const resolution: ImageResolution = { assetId, alt: alt ?? undefined };
      return resolution;
    });
    for (const warning of warnings) imageWarnings.push({ post: post.slug, warning });

    const categories = (post.data.categories ?? []).map((c) => ({
      _type: "reference" as const,
      _key: slugify(c),
      _ref: categoryMap.get(slugify(c))!._id,
    }));
    const tags = (post.data.tags ?? []).map((t) => ({
      _type: "reference" as const,
      _key: slugify(t),
      _ref: tagMap.get(slugify(t))!._id,
    }));

    const doc = {
      _id: `post-${post.slug}`,
      _type: "post",
      title: post.data.title,
      slug: { _type: "slug", current: post.slug },
      excerpt: excerptFrom(blocks),
      author: { _type: "reference", _ref: authorId },
      publishedAt: new Date(post.data.date).toISOString(),
      readTime: readTimeFrom(blocks),
      categories,
      tags,
      body: blocks,
    };

    if (args.dryRun) {
      console.log(`[dry-run] would seed post: ${doc._id} ("${doc.title}")`);
    } else {
      await put(doc);
      console.log(`Seeded post: ${doc._id}`);
    }
    created += 1;
  }

  console.log(`\nDone. ${created} post(s) processed.`);
  if (imageWarnings.length > 0) {
    console.log(`\n${imageWarnings.length} image reference(s) could not be resolved on disk:`);
    for (const { post, warning } of imageWarnings) {
      console.log(`  - [${post}] ${warning}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
