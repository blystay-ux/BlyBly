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

// Homepage strings are unchanged from index.html (wording is reviewed in a later step)
const HOME = {
  title: 'Bly \u2014 Book Accommodation in South Africa | Direct, Better Value',
  description:
    'Book accommodation across South Africa \u2014 Cape Town, Johannesburg, Durban, Pretoria and beyond. Direct bookings, no middleman fees. Find your stay on Bly.',
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
    title: 'Destinations \u2014 Where to Stay in South Africa & Beyond | Bly',
    description:
      "Browse Bly's destinations: Cape Town, Johannesburg, Durban, Kruger, the Garden Route and more. Guides, things to do and stays for every trip.",
  },
  '/events/south-africa': {
    title: 'South Africa Events Calendar \u2014 Festivals, Sport & Conferences | Bly',
    description:
      'Every major festival, race, conference and sporting moment in South Africa and beyond, with Bly accommodation for each one.',
  },
  '/insiders': {
    title: 'Bly Insiders \u2014 Industry Rates for Travel Professionals',
    description:
      'A members-only programme for travel agents, airline staff and hotel staff. Unlock Insider rates across Bly properties.',
  },
  '/terms': { title: 'Terms & Conditions | Bly Travel', description: 'Terms and conditions for booking with Bly Travel (Pty) Ltd.' },
  '/contact': { title: 'Contact Bly Travel', description: 'Get in touch with the Bly Travel team in Centurion, Pretoria.' },
}

export const isFullDestination = (d) => Array.isArray(d.overview) && d.overview.length > 0

export function destinationSeo(dest) {
  return {
    title: `${dest.name} Accommodation | Book Direct on Bly`,
    description: `Find accommodation in ${dest.name}. ${dest.cardTagline} Book direct on Bly \u2014 no middleman, better rates.`,
    // Stub destinations (no copy yet) stay out of Google until content is written.
    robots: isFullDestination(dest) ? 'index,follow' : 'noindex,follow',
  }
}

// Returns { title?, description?, canonical, robots }
// title/description are omitted for routes that set their own (e.g. hotel pages).
export function getSeoForPath(rawPath) {
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
    return { ...destinationSeo(dest), canonical: `${SITE}/accommodation/${dest.slug}` }
  }

  // Default (e.g. /hotel/:slug): self-referencing canonical, never the homepage
  return { canonical: `${SITE}${path}`, robots: 'index,follow' }
}
