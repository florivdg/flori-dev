import sharp from 'sharp'
import type { ImageMetadata } from 'astro'

export interface BlurPlaceholder {
  dataUrl: string
  color: string
}

const cache = new Map<string, Promise<BlurPlaceholder>>()

export function generateBlurPlaceholder(
  image: ImageMetadata,
): Promise<BlurPlaceholder> {
  // fsPath is set at runtime by Astro's Vite plugin but excluded from the public type
  const fsPath = (image as unknown as { fsPath?: string }).fsPath
  if (!fsPath)
    throw new Error('ImageMetadata.fsPath missing — Astro internal API changed')

  let cached = cache.get(fsPath)
  if (!cached) {
    cached = compute(fsPath)
    cache.set(fsPath, cached)
  }
  return cached
}

async function compute(fsPath: string): Promise<BlurPlaceholder> {
  const pipeline = sharp(fsPath).rotate()
  const [color, buffer] = await Promise.all([
    pipeline.clone().resize(1, 1).removeAlpha().raw().toBuffer(),
    pipeline.resize(20).webp({ quality: 20 }).toBuffer(),
  ])

  return {
    dataUrl: `data:image/webp;base64,${buffer.toString('base64')}`,
    color: `rgb(${color[0]} ${color[1]} ${color[2]})`,
  }
}
