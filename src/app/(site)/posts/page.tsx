import Link from "next/link";
import type { Metadata } from "next";

import { PostCard } from "@/components/post-card";
import { client } from "@/sanity/lib/client";
import { CATEGORIES_QUERY, POSTS_QUERY } from "@/sanity/lib/queries";
import type { Category, PostSummary } from "@/sanity/types";

export const metadata: Metadata = {
  title: "Posts",
  description: "Browse all posts, filterable by category.",
};

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: activeCategory } = await searchParams;

  const [postsData, categoriesData] = await Promise.all([
    client.fetch(POSTS_QUERY),
    client.fetch(CATEGORIES_QUERY),
  ]);
  const posts = postsData as PostSummary[];
  const categories = categoriesData as Category[];

  const filteredPosts = activeCategory
    ? posts.filter((post) =>
        post.categories?.some((category) => category.slug === activeCategory),
      )
    : posts;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <h1 className="text-2xl font-bold text-balance text-neutral-800 dark:text-neutral-200">
        Posts
      </h1>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/posts"
            className={
              !activeCategory
                ? "inline-flex items-center rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
                : "inline-flex items-center rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            }
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/posts?category=${category.slug}`}
              className={
                activeCategory === category.slug
                  ? "inline-flex items-center rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
                  : "inline-flex items-center rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }
            >
              {category.title}
            </Link>
          ))}
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <p className="mt-10 text-center text-neutral-600 dark:text-neutral-400">
          No posts found in this category.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
