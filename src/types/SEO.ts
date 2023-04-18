export interface HeadMetadata {
  title: string
  description: string
}

export interface OpenGraphData {
  title?: string
  description?: string
  type: 'website' | 'article' | 'profile'
  image_url?: string
}

export interface SEOData {
  head: HeadMetadata
  og: OpenGraphData
}
