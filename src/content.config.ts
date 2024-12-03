import { z, defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'

/**
 * Define a content collection for my reads.
 */
const readsCollection = defineCollection({
  loader: glob({ pattern: '**\/[^_]*.{md,mdx}', base: './src/content/reads' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.date(),
      draft: z.boolean().default(false),
      tags: z.array(z.string()),
      image: z
        .object({
          src: image(),
          alt: z.string(),
        })
        .optional(),
    }),
})

/**
 * Define a content collection for photos.
 */
const gridCollection = defineCollection({
  loader: glob({ pattern: '**\/[^_]*.json', base: './src/content/grid' }),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      title: z.string(),
      image: image(),
      alt: z.string(),
      location: z.string().optional(),
      date: z.string().transform((str) => new Date(str)),
      tags: z.array(z.string()),
      exif: z.object({
        camera: z.string(),
        lens: z.string(),
        aperture: z.string(),
        focal_length: z.string(),
        shutter_speed: z.string(),
        iso: z.string(),
      }),
    }),
})

/// Export all collections.
export const collections = {
  reads: readsCollection,
  grid: gridCollection,
}
