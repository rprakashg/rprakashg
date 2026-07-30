import Link from "next/link";

import { AuthorAvatar } from "@/components/author-avatar";
import type { PostSummary } from "@/sanity/types";
import { formatDate } from "@/lib/utils";

export function FeaturedPost({ post }: { post: PostSummary }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-neutral-800 md:text-3xl lg:text-4xl lg:leading-tight xl:text-5xl dark:text-neutral-200">
        <Link
          href={`/blog/${post.slug}`}
          className="ring-neutral-500 outline-none transition duration-300 hover:text-orange-500 focus-visible:ring-3 dark:hover:text-neutral-50"
        >
          {post.title}
        </Link>
      </h2>

      {post.excerpt && (
        <p className="mt-4 text-pretty text-neutral-600 dark:text-neutral-400">
          {post.excerpt}
        </p>
      )}

      <div className="mt-6 flex items-center sm:mt-10">
        <AuthorAvatar author={post.author} size={48} />
        <div className="ms-3 sm:ms-4">
          <p className="font-bold text-neutral-800 sm:mb-1 dark:text-neutral-200">
            {post.author.name}
          </p>
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

      <div className="mt-5">
        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-x-2 rounded-lg border border-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white dark:border-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
        >
          Read More
        </Link>
      </div>
    </div>
  );
}
