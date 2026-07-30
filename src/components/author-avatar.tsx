import Image from "next/image";

import { urlForImage } from "@/sanity/lib/image";
import type { Author } from "@/sanity/types";

export function AuthorAvatar({
  author,
  size = 40,
}: {
  author: Author;
  size?: number;
}) {
  const initials = author.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  if (author.image) {
    return (
      <Image
        src={urlForImage(author.image).width(size * 2).height(size * 2).url()}
        alt={author.name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}
