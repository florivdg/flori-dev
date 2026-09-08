import type { Plugin } from 'unified'
import type { Root, Link } from 'mdast'
// Loads the `declare module 'mdast'` augmentation that adds `data.hProperties`.
// @astrojs/mdx v8 no longer pulls this into the TS program transitively.
import type {} from 'mdast-util-to-hast'

interface ExternalLinksOptions {
  /** What to set as the target attribute; defaults to "_blank". */
  target?: string
  /** What to set as the rel attribute; defaults to "noopener noreferrer". */
  rel?: string
}

/**
 * Determines if a URL is external.
 *
 * @param url - The URL to test.
 * @returns True if the URL begins with "http://", "https://", or "//".
 */
function isExternalUrl(url: string): boolean {
  return /^(?:https?:\/\/|\/\/)/i.test(url)
}

/**
 * Recursively traverses the AST and applies a visitor function to every node.
 *
 * @param node - The current AST node.
 * @param visitor - A function to call with each node.
 */
function traverse(node: any, visitor: (node: any) => void): void {
  visitor(node)
  if (node && Array.isArray(node.children)) {
    for (const child of node.children) {
      traverse(child, visitor)
    }
  }
}

/**
 * Remark plugin that processes link nodes in the Markdown AST.
 * If a link's URL is external, it adds target and rel attributes.
 *
 * @param options - Optional settings to override the default attributes.
 * @returns A transformer function for the Markdown AST.
 */
const remarkExternalLinks: Plugin<[ExternalLinksOptions?], Root> = (
  options = {},
) => {
  // Use provided options or fall back to defaults.
  const target = options.target ?? '_blank'
  const rel = options.rel ?? 'noopener noreferrer'

  return (tree: Root) => {
    traverse(tree, (node) => {
      if (node.type === 'link') {
        // Cast the node to a Link to access its URL property.
        const linkNode = node as Link
        if (isExternalUrl(linkNode.url)) {
          // Ensure the node has a data object to store HTML properties.
          linkNode.data = linkNode.data || {}
          // hProperties is used by remark-rehype (or similar) to add HTML attributes.
          linkNode.data.hProperties = linkNode.data.hProperties || {}

          // Set the target and rel attributes for security best practices.
          // hast types `rel` as a space-separated list, so pass it as an array;
          // hast-util-to-html joins it back with spaces on output.
          linkNode.data.hProperties.target = target
          linkNode.data.hProperties.rel = rel.split(/\s+/).filter(Boolean)
        }
      }
    })
  }
}

export default remarkExternalLinks
