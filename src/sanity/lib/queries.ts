import { defineQuery } from 'next-sanity'

export const POSTS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    mainImage,
    publishedAt,
    readTime,
    categories[]->{ _id, title, "slug": slug.current },
    tags[]->{ _id, title, "slug": slug.current },
    author->{ name, role, image }
  }
`)

export const POST_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    mainImage,
    publishedAt,
    readTime,
    categories[]->{ _id, title, "slug": slug.current },
    tags[]->{ _id, title, "slug": slug.current },
    body,
    author->{ name, role, image }
  }
`)

export const POST_SLUGS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)]{ "slug": slug.current }
`)

export const CATEGORIES_QUERY = defineQuery(`
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": slug.current
  }
`)

export const PROFILE_QUERY = defineQuery(`
  *[_type == "profile"][0]{
    name,
    title,
    photo,
    bio,
    skills,
    experience[]{ role, company, startDate, endDate, current, description },
    contact
  }
`)
