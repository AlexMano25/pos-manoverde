// ── SEO Utility ──────────────────────────────────────────────────────────────
// Dynamically updates page title, meta description, and OG tags for each page.

const DEFAULT_TITLE = 'POS Mano Verde – Logiciel de caisse et gestion des ventes'
const DEFAULT_DESC = 'POS Mano Verde est un logiciel de caisse et de gestion commerciale pour restaurants, boutiques, pharmacies et tous types de commerces.'

/**
 * Update page meta tags dynamically.
 * Call this in useEffect on each public page mount.
 */
export function updatePageMeta(title?: string, description?: string, ogImage?: string): void {
  const fullTitle = title ? `${title} – POS Mano Verde` : DEFAULT_TITLE
  const desc = description || DEFAULT_DESC

  // Title
  document.title = fullTitle

  // Meta description
  let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
  if (metaDesc) {
    metaDesc.content = desc
  } else {
    metaDesc = document.createElement('meta')
    metaDesc.name = 'description'
    metaDesc.content = desc
    document.head.appendChild(metaDesc)
  }

  // OG tags
  setMetaProperty('og:title', fullTitle)
  setMetaProperty('og:description', desc)
  if (ogImage) setMetaProperty('og:image', ogImage)

  // Twitter
  setMetaProperty('twitter:title', fullTitle)
  setMetaProperty('twitter:description', desc)
  if (ogImage) setMetaProperty('twitter:image', ogImage)

  // Canonical
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (canonical) {
    canonical.href = window.location.origin + window.location.pathname
  }
}

function setMetaProperty(property: string, content: string): void {
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!meta) {
    meta = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement | null
  }
  if (meta) {
    meta.content = content
  } else {
    meta = document.createElement('meta')
    if (property.startsWith('og:')) {
      meta.setAttribute('property', property)
    } else {
      meta.name = property
    }
    meta.content = content
    document.head.appendChild(meta)
  }
}
