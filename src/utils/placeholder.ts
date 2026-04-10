import sharp from 'sharp'
import type { ImageMetadata } from 'astro'

const cache = new Map<string, string>()

export async function generateBlurPlaceholder(
  image: ImageMetadata,
): Promise<string> {
  // fsPath is set at runtime by Astro's Vite plugin but excluded from the public type
  const fsPath = (image as unknown as { fsPath: string }).fsPath
  const cached = cache.get(fsPath)
  if (cached) return cached

  const buffer = await sharp(fsPath).resize(20).webp({ quality: 20 }).toBuffer()

  const dataUri = `data:image/webp;base64,${buffer.toString('base64')}`
  cache.set(fsPath, dataUri)
  return dataUri
}
