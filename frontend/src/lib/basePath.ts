/** Prefix a public-asset path with the deploy base path (e.g. GitHub Pages subpath). */
export function withBase(path: string): string {
  return (process.env.NEXT_PUBLIC_BASE_PATH || '') + path
}
