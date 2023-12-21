import { z, defineCollection } from 'astro:content'

/**
 * Define a content collection for my reads.
 */
const readsCollection = defineCollection({
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.date(),
      draft: z.boolean().default(false),
      tags: z.array(z.string()),
      image: z
        .object({
          src: image().refine((img) => img.width >= 3000, {
            message: 'Cover image must be at least 3000 pixels wide!',
          }),
          alt: z.string(),
        })
        .optional(),
    }),
})

/**
 * Define a content collection for photos.
 */
const gridCollection = defineCollection({
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      image: image().refine((img) => img.width >= 3000, {
        message: 'Photos must be at least 3000 pixels wide!',
      }),
      alt: z.string(),
      location: z.string().optional(),
      date: z.date(),
      tags: z.array(z.string()),
    }),
})

/// Export all collections.
export const collections = {
  reads: readsCollection,
  grid: gridCollection,
}
