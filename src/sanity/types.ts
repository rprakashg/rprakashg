import type { PortableTextBlock } from "next-sanity";
import type { SanityImageSource } from "@sanity/image-url";

export interface Author {
  name: string;
  role?: string;
  image?: SanityImageSource;
}

export interface Category {
  _id: string;
  title: string;
  slug: string;
}

export interface Tag {
  _id: string;
  title: string;
  slug: string;
}

export interface PostSummary {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  mainImage?: SanityImageSource;
  publishedAt: string;
  readTime?: number;
  categories?: Category[];
  tags?: Tag[];
  author: Author;
}

export interface Post extends PostSummary {
  body?: PortableTextBlock[];
}

export interface ExperienceItem {
  role: string;
  company: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface ProfileContact {
  email?: string;
  phone?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
}

export interface Profile {
  name: string;
  title?: string;
  photo?: SanityImageSource;
  bio?: string;
  skills?: string[];
  experience?: ExperienceItem[];
  contact?: ProfileContact;
}
