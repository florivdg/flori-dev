#!/usr/bin/env bun

import { readdir } from 'fs/promises'
import { join } from 'path'
import { consola } from 'consola'

/**
 * Define the directory where the images are located.
 */
const GRID_DIR = join(__dirname, '../src/content/grid')

/**
 * Represents the metadata of an image in the Exif format.
 */
interface ExifMetadata {
  FileName: string
  ExposureTime: string
  FNumber: number
  ISO: number
  DateTimeOriginal: string
  FocalLength: string
  LensModel: string
  ImageSize: string
}

/**
 * Get all images that don't have a JSON file and therefore need to be processed.
 */
async function getImagesToProcess(): Promise<string[]> {
  /// Read all files in the grid folder
  const files = await readdir(GRID_DIR)

  /// Filter out only the images
  const images = files.filter((file) => file.endsWith('.jpg'))

  /// Filter out JSON files
  const json = files.filter((file) => file.endsWith('.json'))

  /// Find images that don't have a JSON file
  const missingJson = images
    .filter((image) => !json.includes(image.replace('.jpg', '.json')))
    .map((image) => join(GRID_DIR, image))

  consola.info(
    `Found ${missingJson.length} ${missingJson.length === 1 ? 'image' : 'images'} without metadata`,
  )

  return missingJson
}

/**
 * Extracts the EXIF metadata from an image file.
 * @param imagePath - The path to the image file.
 *
 * @returns A promise that resolves to the extracted EXIF metadata.
 */
async function extractExifMetadata(imagePath: string): Promise<ExifMetadata> {
  /// Check if `exiftool` is installed.
  try {
    Bun.spawn(['exiftool', '--version'])
  } catch (error) {
    consola.error(
      'exiftool is not installed. Please run `brew install exiftool`.',
    )
    process.exit(1)
  }

  /// Extract the metadata
  const proc = Bun.spawn(['exiftool', '-j', imagePath])
  const output = await new Response(proc.stdout).json()
  return output[0]
}

/**
 * Main.
 */
async function main() {
  consola.start('Checking for images to process...')

  const images = await getImagesToProcess()

  const exifData = await Promise.all(
    images.map(async (i) => await extractExifMetadata(i)),
  )

  console.log(exifData)
}

main()
