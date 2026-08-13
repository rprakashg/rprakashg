import { FeaturedPost } from "@/components/featured-post";
import { PostCard } from "@/components/post-card";
import { sanityFetch } from "@/sanity/lib/client";
import { POSTS_QUERY } from "@/sanity/lib/queries";
import type { PostSummary } from "@/sanity/types";

export default async function HomePage() {
  const postsData = await sanityFetch({ query: POSTS_QUERY, tags: ["post"] });
  const posts = postsData as PostSummary[];

  const [mostRecentPost, ...otherPosts] = posts;

  return (
    <>
      {mostRecentPost && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
          <h2 className="mb-6 text-2xl font-bold text-balance text-neutral-800 dark:text-neutral-200">
            Featured
          </h2>
          <FeaturedPost post={mostRecentPost} />
        </section>
      )}

      <section
        id="posts"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
      >
        <h2 className="mb-6 text-2xl font-bold text-balance text-neutral-800 dark:text-neutral-200">
          Latest Posts
        </h2>
        {posts.length === 0 ? (
          <p className="text-center text-neutral-600 dark:text-neutral-400">
            No blog posts yet. Check back soon.
          </p>
        ) : otherPosts.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {otherPosts.slice(0, 3).map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
