import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText, type PortableTextComponents } from "next-sanity";
import type { Metadata } from "next";

import { AuthorAvatar } from "@/components/author-avatar";
import { PostCard } from "@/components/post-card";
import { urlForImage } from "@/sanity/lib/image";
import { POST_QUERY, POST_SLUGS_QUERY, POSTS_QUERY } from "@/sanity/lib/queries";
import { client, sanityFetch } from "@/sanity/lib/client";
import type { Post, PostSummary } from "@/sanity/types";
import { formatDate } from "@/lib/utils";

/** Sanity image asset IDs encode their original pixel dimensions, e.g. `image-<hash>-1200x800-png`. */
function imageDimensions(ref: string): { width: number; height: number } {
  const match = ref.match(/-(\d+)x(\d+)-/);
  if (!match) return { width: 1200, height: 675 };
  return { width: Number(match[1]), height: Number(match[2]) };
}

const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({
      value,
    }: {
      value: { asset: { _ref: string }; alt?: string };
    }) => {
      const { width, height } = imageDimensions(value.asset._ref);
      return (
        <Image
          src={urlForImage(value).width(width).url()}
          alt={value.alt ?? ""}
          width={width}
          height={height}
          className="my-6 h-auto max-w-full rounded-xl"
        />
      );
    },
    code: ({ value }: { value: { code: string; language?: string } }) => (
      <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100">
        <code className={value.language ? `language-${value.language}` : undefined}>
          {value.code}
        </code>
      </pre>
    ),
    table: ({ value }: { value: { rows: { cells: string[] }[] } }) => {
      const [headerRow, ...bodyRows] = value.rows;
      return (
        <div className="my-6 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full border-collapse text-sm">
            {headerRow && (
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800">
                  {headerRow.cells.map((cell, i) => (
                    <th
                      key={i}
                      className="px-4 py-2 text-left font-semibold text-neutral-800 dark:text-neutral-200"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {bodyRows.map((row, i) => (
                <tr
                  key={i}
                  className={
                    i % 2 === 0
                      ? "bg-white dark:bg-neutral-900"
                      : "bg-neutral-50 dark:bg-neutral-800/40"
                  }
                >
                  {row.cells.map((cell, j) => (
                    <td key={j} className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
  },
};

export async function generateStaticParams() {
  const slugs = await client
    .withConfig({ useCdn: false })
    .fetch<{ slug: string }[]>(POST_SLUGS_QUERY);
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await sanityFetch({ query: POST_QUERY, params: { slug }, tags: ["post"] });
  const post = data as Post | null;

  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await sanityFetch({ query: POST_QUERY, params: { slug }, tags: ["post"] });
  const post = data as Post | null;

  if (!post) notFound();

  const allPostsData = await sanityFetch({ query: POSTS_QUERY, tags: ["post"] });
  const allPosts = allPostsData as PostSummary[];
  const relatedPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <article className="mx-auto w-full max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-x-3">
        <AuthorAvatar author={post.author} size={48} />
        <div>
          <span className="font-bold text-neutral-700 dark:text-neutral-300">
            {post.author.name}
          </span>
          <ul className="text-xs text-neutral-500">
            <li className="inline">{formatDate(post.publishedAt)}</li>
            {post.readTime && (
              <li className="inline before:mx-2 before:content-['·']">
                {post.readTime} min read
              </li>
            )}
          </ul>
        </div>
      </div>

      <h1 className="mb-5 text-2xl font-bold text-neutral-800 md:text-4xl dark:text-neutral-200">
        {post.title}
      </h1>

      {post.mainImage && (
        <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-xl">
          <Image
            src={urlForImage(post.mainImage).width(1200).height(675).url()}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {post.body && (
        <div className="prose prose-neutral dark:prose-invert mb-8 max-w-none">
          <PortableText value={post.body} components={portableTextComponents} />
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag._id}
              className="inline-flex items-center rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {tag.title}
            </span>
          ))}
        </div>
      )}

      {relatedPosts.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-6 text-2xl font-bold text-balance text-neutral-800 dark:text-neutral-200">
            Related Posts
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {relatedPosts.map((related) => (
              <PostCard key={related._id} post={related} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <Link
          href="/posts"
          className="text-sm font-semibold text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
        >
          &larr; View all posts
        </Link>
      </div>
    </article>
  );
}
