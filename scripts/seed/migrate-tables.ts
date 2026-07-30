/**
 * One-off migration: regenerates the `body` field for the handful of posts whose
 * markdown source contains a table, now that the schema has a real `table` block
 * type (src/sanity/schemaTypes/post.ts). Only patches `body` — nothing else on
 * these documents is touched.
 *
 * Usage:
 *   tsx scripts/seed/migrate-tables.ts --repo <path-to-cloned-blog-repo> [--dry-run]
 */
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import matter from "gray-matter";
import { createClient } from "@sanity/client";

import { markdownToPortableText, type ImageResolution } from "./markdown-to-portable-text";

const SLUGS = [
  "auth-and-rbac-in-ocp",
  "build_iso_images_for_vpac",
  "installing-openshift-clusters-with-ansible",
  "opensource-summit-2024",
  "rbac-cluster-lifecycle-rhacm",
];

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };
  const repo = get("--repo");
  if (!repo) throw new Error("Missing required --repo <path-to-cloned-blog-repo>");
  return { repo: resolve(repo), dryRun: argv.includes("--dry-run") };
}

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

function resolveLocalImagePath(repo: string, url: string): string | null {
  const clean = url.split("?")[0];
  const candidates = clean.startsWith("/")
    ? [join(repo, clean), join(repo, "static", clean), join(repo, "src/images", basename(clean))]
    : [join(repo, "posts", clean), join(repo, "src/images", basename(clean))];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
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

async function main() {
  loadEnvLocal();
  const args = parseArgs();

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-07-28";
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !dataset) throw new Error("Missing Sanity project/dataset env vars.");
  if (!token && !args.dryRun) throw new Error("Missing SANITY_API_WRITE_TOKEN.");

  const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });
  const imageCache = new Map<string, string>();

  async function resolveImage({ url, alt }: { url: string; alt?: string | null }): Promise<ImageResolution | null> {
    const path = resolveLocalImagePath(args.repo, url);
    if (!path) return null;
    const cached = imageCache.get(path);
    if (cached) return { assetId: cached, alt: alt ?? undefined };
    if (args.dryRun) {
      const fake = `dry-run-${basename(path)}`;
      imageCache.set(path, fake);
      return { assetId: fake, alt: alt ?? undefined };
    }
    const asset = await client.assets.upload("image", createReadStream(path), {
      filename: basename(path),
      contentType: contentTypeFor(path),
    });
    imageCache.set(path, asset._id);
    return { assetId: asset._id, alt: alt ?? undefined };
  }

  for (const slug of SLUGS) {
    const filePath = join(args.repo, "posts", `${slug}.md`);
    const raw = readFileSync(filePath, "utf8");
    const { content } = matter(raw);
    const { blocks, warnings } = await markdownToPortableText(content, resolveImage);

    const tableCount = blocks.filter((b) => b._type === "table").length;
    console.log(`post-${slug}: ${blocks.length} blocks, ${tableCount} table(s), ${warnings.length} warning(s)`);
    for (const w of warnings) console.log(`  - ${w}`);

    if (args.dryRun) continue;

    await client.patch(`post-${slug}`).set({ body: blocks }).commit();
    console.log(`  patched post-${slug}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
