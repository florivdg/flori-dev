import { describe, it, expect } from 'bun:test'
import { mergeMetaAndVisionData } from './grid-vision'
import type {
  ExifMetadata,
  ImageMetadataSuggestion,
  VisionAIResult,
} from './grid-vision'

const FINAL: ImageMetadataSuggestion = {
  id: '2R9A2805',
  title: [
    'Blossom and Buzz',
    "Spring's Gentle Awakening",
    'Cherry Blossom Haven',
    "Nature's Delicate Balance",
    "A Bee's Spring Feast",
  ],
  image: './2R9A2805.jpg',
  alt: "Close-up of vibrant pink cherry blossoms on a branch with a honeybee collecting nectar. The bee's wings are slightly blurred, capturing its motion as it works. The background is a soft, dreamy pink hue, complementing the sharp details of the blossoms and the bee.",
  location: '',
  date: '2024-03-17',
  tags: ['nature', 'cherryblossom', 'bee', 'spring', 'floral'],
  exif: {
    camera: 'Canon EOS R6m2',
    lens: 'RF70-200mm F2.8 L IS USM',
    aperture: '2.8',
    iso: '125',
    focal_length: '200.0',
    shutter_speed: '1/1000',
  },
}

const VISION_DATA: VisionAIResult = {
  title_ideas: [
    'Blossom and Buzz',
    "Spring's Gentle Awakening",
    'Cherry Blossom Haven',
    "Nature's Delicate Balance",
    "A Bee's Spring Feast",
  ],
  description:
    "Close-up of vibrant pink cherry blossoms on a branch with a honeybee collecting nectar. The bee's wings are slightly blurred, capturing its motion as it works. The background is a soft, dreamy pink hue, complementing the sharp details of the blossoms and the bee.",
  tags: ['nature', 'cherryblossom', 'bee', 'spring', 'floral'],
}

const EXIF_DATA: ExifMetadata = {
  SourceFile: '/Users/flori/Sites/flori-dev/src/content/grid/2R9A2805.jpg',
  FileName: '2R9A2805.jpg',
  Model: 'Canon EOS R6m2',
  ExposureTime: '1/1000',
  FNumber: 2.8,
  ISO: 125,
  DateTimeOriginal: '2024:03:17 15:06:16',
  FocalLength: '200.0 mm',
  LensModel: 'RF70-200mm F2.8 L IS USM',
}

describe('mergeMetaAndVisionData', () => {
  it('should merge Exif and Vision data', () => {
    expect(mergeMetaAndVisionData(EXIF_DATA, VISION_DATA)).toEqual(FINAL)
  })
})
