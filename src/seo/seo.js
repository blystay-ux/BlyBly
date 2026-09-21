// -----------------------------------------------------------------------------
// BLY. - SEO single source of truth
//
// Used in TWO places so they can never drift apart:
//   1. scripts/prerender-seo.mjs  -> writes real HTML files at build time
//   2. src/seo/SeoManager.jsx     -> keeps <head> correct during in-app navigation
//
// To change any page title / description / indexing rule, edit THIS file only.
// NOTE: keep the import path below with the ".js" extension - Node needs it.
// -----------------------------------------------------------------------------
import { DESTINATIONS } from '../data/destinations.js'

export const SITE = 'https://blytravel.co.za'

// Link-preview image (WhatsApp, Facebook, X, LinkedIn). Same photo as the homepage hero.
export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=75'

// City pages use their own hero photo when it is hosted on Unsplash (sized for previews).
export function ogImageFor(dest) {
  const u = dest && dest.heroImage
  if (typeof u === 'string' && u.startsWith('https://images.unsplash.com/')) {
    return u.replace(/w=\d+/, 'w=1200').replace(/q=\d+/, 'q=75')
  }
  return DEFAULT_OG_IMAGE
}

// Homepage strings: keep in sync with the <title> and description in index.html
const HOME = {
  title: 'BLY. Travel | Book Hotels & Guesthouses in South Africa',
  description:
    'Book hotels, guesthouses and self-catering stays across South Africa and beyond. Local, simple and built for South African travellers. Find. Book. Bly.',
}

// Pages that must never appear in Google (private, transactional or thin).
// vercel.json sends the same rule as an X-Robots-Tag header - keep both in sync.
const NOINDEX_EXACT = [
  '/search', '/checkout', '/manage-booking', '/my-bookings', '/extranet',
  '/manage-hotel', '/auth', '/admin',
]
const NOINDEX_PREFIX = ['/booking/', '/review/', '/corporate/']

export const STATIC_PAGES = {
  '/destinations': {
    title: 'Where to Stay in South Africa & Beyond | BLY. Travel',
    description:
      'Browse destinations across South Africa and beyond: Cape Town, Johannesburg, Durban, Kruger, the Garden Route and more. Guides, things to do and places to stay.',
  },
  '/events/south-africa': {
    title: 'South Africa Events Calendar | BLY. Travel',
    description:
      'Every major festival, race, conference and sporting moment in South Africa and beyond, with places to stay for each one on BLY.',
  },
  '/insiders': {
    title: 'BLY. Insiders | Industry Rates for Travel Professionals',
    description:
      'A members-only programme for travel agents, airline staff and hotel staff. Unlock Insider rates across BLY. properties.',
  },
  '/terms': { title: 'Terms & Conditions | BLY. Travel', description: 'Terms and conditions for booking with Bly Travel (Pty) Ltd.' },
  '/contact': { title: 'Contact BLY. Travel', description: 'Get in touch with the BLY. Travel team in Centurion, Pretoria.' },
}

export const isFullDestination = (d) => Array.isArray(d.overview) && d.overview.length > 0

export function destinationSeo(dest) {
  return {
    title: `Hotels & Guesthouses in ${dest.name} | BLY. Travel`,
    description: `Find hotels, guesthouses and stays in ${dest.name}. ${dest.cardTagline} Book on BLY., the South African travel platform.`,
    // Stub destinations (no copy yet) stay out of Google until content is written.
    robots: isFullDestination(dest) ? 'index,follow' : 'noindex,follow',
  }
}

// Returns { title?, description?, canonical, robots, image }
// title/description are omitted for routes that set their own (e.g. hotel pages).
export function getSeoForPath(rawPath) {
  return { image: DEFAULT_OG_IMAGE, ...seoForPath(rawPath) }
}

function seoForPath(rawPath) {
  let path = (rawPath || '/').split('?')[0].split('#')[0]
  if (path.length > 1) path = path.replace(/\/+$/, '')

  if (path === '/') return { ...HOME, canonical: `${SITE}/`, robots: 'index,follow' }

  const noindex = NOINDEX_EXACT.includes(path) || NOINDEX_PREFIX.some((p) => path.startsWith(p))
  if (noindex) return { canonical: `${SITE}${path}`, robots: 'noindex,nofollow' }

  if (STATIC_PAGES[path]) return { ...STATIC_PAGES[path], canonical: `${SITE}${path}`, robots: 'index,follow' }

  const m = path.match(/^\/accommodation\/([^/]+)$/)
  if (m) {
    const dest = DESTINATIONS.find((d) => d.slug === m[1])
    if (!dest) return { canonical: `${SITE}/destinations`, robots: 'noindex,follow' }
    return { ...destinationSeo(dest), canonical: `${SITE}/accommodation/${dest.slug}`, image: ogImageFor(dest) }
  }

  // Default (e.g. /hotel/:slug): self-referencing canonical, never the homepage
  return { canonical: `${SITE}${path}`, robots: 'index,follow' }
}
