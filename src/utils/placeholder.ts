import sharp from 'sharp'
import type { ImageMetadata } from 'astro'

export async function generateBlurPlaceholder(
  image: ImageMetadata,
): Promise<string> {
  // fsPath is set at runtime by Astro's Vite plugin but excluded from the public type
  const fsPath = (image as unknown as { fsPath?: string }).fsPath
  if (!fsPath)
    throw new Error('ImageMetadata.fsPath missing — Astro internal API changed')

  const buffer = await sharp(fsPath)
    .rotate()
    .resize(20)
    .webp({ quality: 20 })
    .toBuffer()

  return `data:image/webp;base64,${buffer.toString('base64')}`
}
