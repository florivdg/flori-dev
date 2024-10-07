#!/usr/bin/env bun

import { readdir } from 'fs/promises'
import { join } from 'path'
import { consola } from 'consola'
import { destr } from 'destr'
import OpenAI from 'openai'

/**
 * Define the directory where the images are located.
 */
const GRID_DIR = join(__dirname, '../src/content/grid')

/**
 * Instantiate the OpenAI client.
 */
const openai = new OpenAI()

/**
 * Represents the metadata of an image in the Exif format.
 */
export interface ExifMetadata {
  SourceFile: string
  FileName: string
  Model: string
  FNumber: number
  FocalLength: string
  ExposureTime: string
  ISO: number
  DateTimeOriginal: string
  LensModel: string
}

/**
 * Represents the result of the AI analysis.
 */
export interface VisionAIResult {
  title_ideas: string[]
  description: string
  tags: string[]
}

/**
 * Represents the final metadata suggestion for an image.
 */
export interface ImageMetadataSuggestion {
  id: string
  title: string[]
  image: string
  alt: string
  location: string
  date: string
  tags: string[]
  exif: {
    camera: string
    lens: string
    aperture: string
    iso: string
    focal_length: string
    shutter_speed: string
  }
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
 * Encodes an image file to base64.
 * @param imagePath - The path to the image file.
 * @returns A Promise that resolves to the base64 encoded image.
 */
async function base64EncodeImage(imagePath: string): Promise<string> {
  const arrayBuffer = await Bun.file(imagePath).arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return buffer.toString('base64')
}

/**
 * Generates image description, title suggestions and tags using AI.
 *
 * @param metadata - The metadata of the image.
 * @returns A Promise that resolves to a VisionAIResult object containing the generated image description, title suggestions, and tags.
 */
async function generateImageDescriptionTitleSuggestionsAndTags(
  metadata: ExifMetadata,
): Promise<VisionAIResult> {
  consola.info(
    'Generating image description, title suggestions and tags with AI...',
  )

  try {
    /// Base64 encode the image in order to pass it to the API
    const encodedImage = await base64EncodeImage(metadata.SourceFile)

    const prompt = `
Create an accurate and detailed description of this image that would also work as an alt text. The alt text should not contain words like image, photograph, illustration or such. Describe the scene as it is. Also come up with 5 title suggestions for this image. At last suggest 5 tags that suit the image description. These tags should be single words only. Identify the main subject or theme and make sure to put the according tag first. Return the description, the title suggestions and tags as JSON without any extra notes or information. Return a JSON string that can be parsed. Do not use markdown code blocks. Use the following JSON format: \n\n\"\"\"{\"title_ideas\": [\"\", \"\", \"\", \"\", \"\"],\"description\": \"\",\"tags\": [\"\", \"\",\"\", \"\", \"\"]}\"\"\"`

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${encodedImage}`,
              },
            },
          ],
        },
      ],
      model: 'gpt-4o-mini',
      max_tokens: 2048,
    })

    const jsonString = completion.choices[0]?.message?.content
    if (!jsonString) {
      throw new Error('Empty message content from AI.')
    }

    return destr<VisionAIResult>(jsonString)
  } catch (error) {
    consola.error(error)
    consola.error(
      'Failed to generate image description, title suggestions and tags.',
    )

    return {
      title_ideas: [],
      description: '',
      tags: [],
    }
  }
}

/**
 * Merges the metadata from EXIF data and vision data to create an ImageMetadataSuggestion object.
 * @param exifData - The EXIF metadata of the image.
 * @param visionData - The vision AI result data of the image.
 * @returns The merged ImageMetadataSuggestion object.
 */
export function mergeMetaAndVisionData(
  exifData: ExifMetadata,
  visionData: VisionAIResult,
): ImageMetadataSuggestion {
  return {
    id: exifData.FileName.replace('.jpg', ''),
    title: visionData.title_ideas,
    image: `./${exifData.FileName}`,
    alt: visionData.description,
    location: '',
    date: exifData.DateTimeOriginal.split(' ')[0].replaceAll(':', '-'),
    tags: visionData.tags,
    exif: {
      camera: exifData.Model,
      lens: exifData.LensModel,
      aperture: exifData.FNumber.toString(),
      iso: exifData.ISO.toString(),
      focal_length: exifData.FocalLength.replace(' mm', ''),
      shutter_speed: exifData.ExposureTime,
    },
  }
}

/**
 * Writes the given image metadata to a JSON file.
 * @param imageMetadata - The image metadata to be written.
 * @returns A Promise that resolves when the JSON file is written successfully.
 */
async function writeToJsonFile(
  imageMetadata: ImageMetadataSuggestion,
): Promise<void> {
  const jsonPath = join(GRID_DIR, `${imageMetadata.id}.json`)
  const json = JSON.stringify(imageMetadata, null, 2)
  await Bun.write(jsonPath, json)
}

/**
 * Main.
 */
async function main() {
  consola.start('Checking for images to process...')

  /// Load all images that don't have a JSON file.
  const images = await getImagesToProcess()

  /// Extract EXIF metadata from these images.
  const exifData = await Promise.all(
    images.map(async (i) => await extractExifMetadata(i)),
  )

  /// Determine the image description, title suggestions and tags for each image with AI.
  const visionData = await Promise.all(
    exifData.map(
      async (e) => await generateImageDescriptionTitleSuggestionsAndTags(e),
    ),
  )

  /// Merge the EXIF and Vision data to create the final metadata suggestion.
  const imageData = exifData.map((e, i) =>
    mergeMetaAndVisionData(e, visionData[i]),
  )

  /// Write the metadata to JSON files.
  await Promise.all(imageData.map(async (i) => await writeToJsonFile(i)))

  consola.success('All images processed successfully.')
}

main()
