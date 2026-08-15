import { absoluteUrl, localizedPathname } from '../metadata.ts'

export type BreadcrumbStep = {
  name: string
  pathname: string
}

/**
 * Builds the breadcrumb trail. Of the markup in this project, this is the one
 * with a realistic chance of a visible rich result — Google renders breadcrumb
 * trails in place of the raw URL in a search snippet.
 */
export function buildBreadcrumbs(trail: BreadcrumbStep[], locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: absoluteUrl(localizedPathname(step.pathname, locale)),
    })),
  }
}
