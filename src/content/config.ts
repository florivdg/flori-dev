import { z, defineCollection } from 'astro:content'

/**
 * Define a content collection for my reads.
 */
const readsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    image: z.string().optional(),
  }),
})

/// Export all collections.
export const collections = {
  reads: readsCollection,
}
