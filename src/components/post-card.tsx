import Link from "next/link";

import { AuthorAvatar } from "@/components/author-avatar";
import type { PostSummary } from "@/sanity/types";
import { formatDate } from "@/lib/utils";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl border border-neutral-200 bg-white p-4 ring-neutral-500 outline-none transition duration-300 hover:border-neutral-300 focus-visible:ring-3 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
    >
      <div className="flex items-center">
        <AuthorAvatar author={post.author} />
        <div className="ms-2.5 sm:ms-4">
          <h4 className="font-bold text-neutral-800 dark:text-neutral-200">
            {post.author.name}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {formatDate(post.publishedAt)}
          </p>
        </div>
      </div>

      <h3 className="mt-4 text-base font-bold text-balance text-neutral-800 group-hover:text-neutral-600 sm:text-lg dark:text-neutral-200 dark:group-hover:text-neutral-400">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="mt-2 text-pretty text-neutral-600 dark:text-neutral-400">
          {post.excerpt}
        </p>
      )}
    </Link>
  );
}
