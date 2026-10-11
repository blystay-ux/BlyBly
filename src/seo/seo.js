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

// Turns a site-relative path (/images/...) into a full URL; leaves full URLs alone.
// Structured data and link previews need full URLs.
export const absoluteUrl = (u) => (typeof u === 'string' && u.startsWith('/') ? `${SITE}${u}` : u)

// City pages use their own hero photo for link previews:
// Unsplash heroes are resized for previews, local heroes (/images/...) become absolute URLs.
export function ogImageFor(dest) {
  const u = dest && dest.heroImage
  if (typeof u === 'string' && u.startsWith('https://images.unsplash.com/')) {
    return u.replace(/w=\d+/, 'w=1200').replace(/q=\d+/, 'q=75')
  }
  if (typeof u === 'string' && u.startsWith('/images/')) return `${SITE}${u}`
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
  '/win', // giveaway page: the draw has closed
  '/partners', '/list-hotel', // old property sign-up pages (inventory now comes from HyperGuest)
]
// Hotel pages (/hotel/...) are handled separately in seoForPath: only hotels with a
// build-time page (see hotelRegistry) are indexable, every other hotel URL is noindex.
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
  '/group-request': {
    title: 'Group Bookings & Group Accommodation Requests | BLY. Travel',
    description:
      'Travelling as a group? Send one request with your dates, destination and group size, and a BLY. consultant replies with hotel options. Free to send.',
  },
  '/promo': {
    title: 'Promo Codes & Special Offers | BLY. Travel',
    description:
      'Have a BLY. promo code? Enter it here and your saving is applied at checkout. Plus current event offers for South African travellers.',
  },
  '/terms': { title: 'Terms & Conditions | BLY. Travel', description: 'Terms and conditions for booking with Bly Travel (Pty) Ltd.' },
  '/contact': { title: 'Contact BLY. Travel', description: 'Get in touch with the BLY. Travel team in Centurion, Pretoria.' },
}

export const isFullDestination = (d) => Array.isArray(d.overview) && d.overview.length > 0

export function destinationSeo(dest) {
  return {
    // A destination can override the default pattern with its own `seo` block in destinations.js
    title: dest.seo?.title || `Hotels & Guesthouses in ${dest.name} | BLY. Travel`,
    description:
      dest.seo?.description ||
      `Find hotels, guesthouses and stays in ${dest.name}. ${dest.cardTagline} Book on BLY., the South African travel platform.`,
    // Stub destinations (no copy yet) stay out of Google until content is written.
    robots: isFullDestination(dest) ? 'index,follow' : 'noindex,follow',
  }
}

// Browser-tab title for a hotel page (set by HotelDetail once the hotel has loaded)
export const hotelTitle = (name, city) =>
  `${name}${city && !String(name).toLowerCase().includes(String(city).toLowerCase()) ? `, ${city}` : ''} | BLY. Travel`

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

  if (path.startsWith('/hotel/')) {
    const h = hotelRegistry.get(path)
    if (!h) return { canonical: `${SITE}${path}`, robots: 'noindex,follow' }
    return {
      title: hotelTitle(h.name, h.city),
      description: hotelDescription(h),
      canonical: `${SITE}${path}`,
      robots: 'index,follow',
      image: (h.photos && h.photos[0]) || DEFAULT_OG_IMAGE,
    }
  }

  const m = path.match(/^\/accommodation\/([^/]+)$/)
  if (m) {
    const dest = DESTINATIONS.find((d) => d.slug === m[1])
    if (!dest) return { canonical: `${SITE}/destinations`, robots: 'noindex,follow' }
    return { ...destinationSeo(dest), canonical: `${SITE}/accommodation/${dest.slug}`, image: ogImageFor(dest) }
  }

  const em = path.match(/^\/events\/([^/]+)$/)
  if (em && eventRegistry.has(em[1])) {
    const ev = eventRegistry.get(em[1])
    return { title: eventTitle(ev), description: eventDescription(ev), canonical: `${SITE}${path}`, robots: 'index,follow' }
  }

  // Default: self-referencing canonical, never the homepage
  return { canonical: `${SITE}${path}`, robots: 'index,follow' }
}
// -----------------------------------------------------------------------------
// Events: helpers shared by the build-time prerender and the React event page
// -----------------------------------------------------------------------------

// Filled by scripts/prerender-seo.mjs at build time (empty in the browser)
export const eventRegistry = new Map()

// -----------------------------------------------------------------------------
// Hotels: only hotels with enough saved content get a build-time page and are indexable.
// The list comes from the Supabase view `hg_hotel_pages` (3+ photos, 200+ character description),
// currently limited to South Africa in scripts/prerender-seo.mjs.
// -----------------------------------------------------------------------------

// path ('/hotel/hg-123') -> hotel row. Filled at build time (empty in the browser).
export const hotelRegistry = new Map()

export const hotelPath = (h) => `/hotel/hg-${h.hotel_id}`

export const countryName = (code) => {
  if (!code) return ''
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}

// Supplier descriptions arrive with line breaks and sometimes HTML tags.
export const plainText = (t) =>
  String(t || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

export function hotelDescription(h) {
  const place = [h.city, countryName(h.country)].filter(Boolean).join(', ')
  const head = `${h.name} in ${place}.`
  const tail = ' Check availability and book on BLY.'
  const room = 158 - head.length - tail.length - 1
  const text = plainText(h.description)
  const mid = room > 40 && text ? ' ' + (text.length <= room ? text : text.slice(0, room - 1).replace(/\s+\S*$/, '') + '...') : ''
  return `${head}${mid}${tail}`
}

// Hotels to list on a destination page: best-rated first, then by name.
export function hotelsForDestination(slug, hotels, max = 60) {
  const cities = eventCitiesForDestination(slug)
  if (!cities.length) return []
  return (hotels || [])
    .filter((h) => h.name && cities.includes(String(h.city).trim().toLowerCase()))
    .sort((a, b) => (Number(b.star_rating) || 0) - (Number(a.star_rating) || 0) || String(a.name).localeCompare(String(b.name)))
    .slice(0, max)
}

// City guide for a hotel's city, when BLY. has one
export function destinationForCity(city) {
  const dest = DESTINATIONS.find((d) => d.slug === CITY_DEST[String(city).trim().toLowerCase()] && isFullDestination(d))
  return dest ? { slug: dest.slug, name: dest.name } : null
}

// Which event cities (as stored in the events table, lower case) belong to which destination page.
// One list drives both directions: event page -> city guide, and city guide -> its upcoming events.
// Order matters for CITY_DEST: the first destination that lists a city is the one its event pages link to.
const DEST_EVENT_CITIES = {
  'cape-town': ['cape town', 'kaapstad', 'cape town, western cape'],
  johannesburg: ['johannesburg', 'sandton', 'rosebank', 'midrand'],
  durban: ['durban', 'umhlanga', 'umhlanga rocks', 'ballito'],
  kruger: ['kruger national park', 'hoedspruit', 'hazyview', 'skukuza', 'kapama private game reserve'],
  pretoria: ['pretoria', 'tshwane'],
  knysna: ['knysna'],
  'garden-route': ['knysna', 'george', 'plettenberg bay', 'mossel bay', 'wilderness', 'oudtshoorn'],
  winelands: ['paarl', 'stellenbosch', 'franschhoek'],
  'sun-city': ['sun city'],
  dubai: ['dubai'],
  thailand: ['bangkok', 'phuket'],
  mauritius: ['mauritius'],
  zanzibar: ['zanzibar'],
  lisbon: ['lisbon'],
  istanbul: ['istanbul'],
  bali: ['bali'],
  greece: ['athens'],
  london: ['london'],
  kenya: ['nairobi', 'mombasa'],
}
const CITY_DEST = {}
for (const [slug, cities] of Object.entries(DEST_EVENT_CITIES)) {
  for (const c of cities) if (!CITY_DEST[c]) CITY_DEST[c] = slug
}

export const eventCitiesForDestination = (slug) => DEST_EVENT_CITIES[slug] || []

// Upcoming events for a destination page, soonest first. `events` = rows from the events table.
export function eventsForDestination(slug, events, max = 8) {
  const cities = eventCitiesForDestination(slug)
  if (!cities.length) return []
  const today = new Date().toISOString().slice(0, 10)
  return (events || [])
    .filter((e) => {
      const last = e.event_end || e.event_start
      return e.slug && e.name && cities.includes(String(e.city).toLowerCase()) && !(last && last < today)
    })
    .sort((a, b) => String(a.event_start || '9999').localeCompare(String(b.event_start || '9999')))
    .slice(0, max)
}
const CITY_GUIDE = {
  'cape town': ['/blog/hotels-cape-town-guide', 'Hotels in Cape Town: where to stay'],
  johannesburg: ['/blog/hotels-johannesburg-guide', 'Hotels in Johannesburg: where to stay in Jozi'],
  knysna: ['/blog/garden-route-hotels-guide', 'Garden Route road trip: 7 stops from Mossel Bay to Tsitsikamma'],
  paarl: ['/blog/stellenbosch-vs-franschhoek', 'Stellenbosch vs Franschhoek: which Winelands town to stay in'],
}
const SEARCH_CITY = { tshwane: 'Pretoria', 'kugompo city (east london)': 'East London' }

const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '...')
const cityInName = (ev) => ev.name.toLowerCase().includes(String(ev.city).toLowerCase())

export const eventHeading = (ev) =>
  cityInName(ev) ? `${ev.name}: where to stay` : `${ev.name}: where to stay in ${ev.city}`

export const eventTitle = (ev) => `${eventHeading(ev)} | BLY. Travel`

export function eventDescription(ev) {
  const label = ev.date_label || ''
  const when = label ? (label.includes('(') ? `, ${label}` : ` (${label})`) : ''
  const first = String(ev.description || '').split(/(?<=\.)\s/)[0]
  const head = `Find hotels and guesthouses for ${ev.name} in ${ev.city}${when}.`.replace(/\s+/g, ' ')
  const full = `${head} ${first}`.replace(/\s+/g, ' ')
  if (full.length + 13 <= 158) return `${full} Book on BLY.`
  if (full.length <= 158) return full
  return clip(`${head} Book on BLY.`, 158)
}

export function eventSearchUrl(ev) {
  const city = SEARCH_CITY[String(ev.city).toLowerCase()] || ev.city
  const params = new URLSearchParams({ city, adults: 2 })
  if (ev.event_start) {
    params.set('checkIn', ev.event_start)
    const nights = ev.event_end
      ? Math.round((new Date(ev.event_end) - new Date(ev.event_start)) / 86400000)
      : 2
    params.set('nights', Math.min(7, Math.max(1, nights)))
  }
  return `/search?${params.toString()}`
}

// Nearby city page + blog guide, when BLY. has one for this city
export function relatedForEvent(ev) {
  const key = String(ev.city).toLowerCase()
  const dest = DESTINATIONS.find((d) => d.slug === CITY_DEST[key] && isFullDestination(d))
  const g = CITY_GUIDE[key]
  return {
    destination: dest ? { slug: dest.slug, name: dest.name } : null,
    guide: g ? { url: g[0], title: g[1] } : null,
  }
}
