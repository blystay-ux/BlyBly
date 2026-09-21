import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getSeoForPath } from './seo.js'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

// Keeps <title>, description, canonical and robots correct on every route change.
// (The first page load is already correct in the raw HTML thanks to the build-time prerender.)
export default function SeoManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = getSeoForPath(pathname)

    if (seo.title) document.title = seo.title
    if (seo.description) setMeta('name', 'description', seo.description)

    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', seo.canonical)

    setMeta('name', 'robots', seo.robots)

    if (seo.title) setMeta('property', 'og:title', seo.title)
    if (seo.description) setMeta('property', 'og:description', seo.description)
    setMeta('property', 'og:url', seo.canonical)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', 'BLY.')

    // Remove build-time JSON-LD that belongs to a different page
    document.querySelectorAll('script[data-prerender]').forEach((el) => {
      if (el.getAttribute('data-path') !== pathname.replace(/\/+$/, '') && el.getAttribute('data-path') !== pathname) el.remove()
    })
  }, [pathname])

  return null
}
