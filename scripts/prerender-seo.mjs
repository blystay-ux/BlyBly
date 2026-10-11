// -----------------------------------------------------------------------------
// BLY. - build-time SEO prerender
//
// Runs AFTER `vite build` (see package.json "build").
// Why: the app is a single-page app, so the server used to send an EMPTY page
// (with the homepage's title/canonical) for every URL. This script writes a real
// HTML file per public page - own title, description, canonical and readable text
// in the raw HTML - and the React app still takes over in the browser as normal.
//
//   dist/index.html                      -> homepage (prerendered)
//   dist/app-shell.html                  -> clean SPA shell (used for all other routes)
//   dist/destinations/index.html         -> /destinations
//   dist/accommodation/<slug>/index.html -> /accommodation/<slug>
//   dist/events/south-africa/index.html  -> /events/south-africa
//   dist/insiders/index.html             -> /insiders
//
// It never fails the deploy: on any problem it logs a warning and skips that page.
// -----------------------------------------------------------------------------
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DESTINATIONS } from '../src/data/destinations.js'
import {
  SITE, STATIC_PAGES, getSeoForPath, isFullDestination, DEFAULT_OG_IMAGE,
  eventRegistry, eventHeading, eventSearchUrl, relatedForEvent, eventsForDestination, absoluteUrl,
  hotelRegistry, hotelPath, hotelsForDestination, destinationForCity, countryName, plainText,
} from '../src/seo/seo.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const indexPath = path.join(dist, 'index.html')

if (!fs.existsSync(indexPath)) {
  console.warn('[seo-prerender] dist/index.html not found - skipping (did vite build run?)')
  process.exit(0)
}

const template = fs.readFileSync(indexPath, 'utf8')
// Keep a pristine SPA shell for every non-prerendered route (checkout, admin, hotel pages...)
// The shell carries NO canonical tag: the homepage canonical must never be served on other
// routes. SeoManager adds the correct canonical in the browser.
fs.writeFileSync(
  path.join(dist, 'app-shell.html'),
  template.replace(/[ \t]*<link rel="canonical"[^>]*>\r?\n?/, '')
)

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c')

const saDests = DESTINATIONS.filter((d) => d.region === 'south-africa')
const intlDests = DESTINATIONS.filter((d) => d.region !== 'south-africa')
const BLOG = [
  ['/blog/hotels-cape-town-guide', 'Hotels in Cape Town: where to stay'],
  ['/blog/hotels-johannesburg-guide', 'Hotels in Johannesburg: where to stay in Jozi'],
  ['/blog/garden-route-hotels-guide', 'Garden Route road trip: 7 stops from Mossel Bay to Tsitsikamma'],
  ['/blog/stellenbosch-vs-franschhoek', 'Stellenbosch vs Franschhoek: which Winelands town to stay in'],
]

// -- Events (active only) - fetched from Supabase at build time ----------------
// Needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (already set on Vercel).
// For local testing, point SEO_EVENTS_FILE at a JSON file instead. Never fails the deploy.
async function loadEvents() {
  try {
    let rows
    if (process.env.SEO_EVENTS_FILE) {
      rows = JSON.parse(fs.readFileSync(process.env.SEO_EVENTS_FILE, 'utf8'))
    } else {
      const url = process.env.VITE_SUPABASE_URL
      const key = process.env.VITE_SUPABASE_ANON_KEY
      if (!url || !key) { console.warn('[seo-prerender] no Supabase env vars - skipping event pages'); return [] }
      const res = await fetch(`${url}/rest/v1/events?select=*&active=eq.true&order=year.asc,month.asc`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
      if (!res.ok) throw new Error(`Supabase responded ${res.status}`)
      rows = await res.json()
    }
    const today = new Date().toISOString().slice(0, 10)
    return rows.filter((e) => {
      const last = e.event_end || e.event_start
      return e.slug && e.name && e.city && !(last && last < today)
    })
  } catch (err) {
    console.warn(`[seo-prerender] events skipped: ${err.message}`)
    return []
  }
}
const EVENTS = await loadEvents()

// -- Hotels with a public page - fetched from Supabase at build time ------------
// Source: the view `hg_hotel_pages` (hotels with 3+ photos and a 200+ character description).
// HOTEL_COUNTRIES limits which countries get indexable pages. Start: South Africa only.
// For local testing, point SEO_HOTELS_FILE at a JSON file instead. Never fails the deploy.
const HOTEL_COUNTRIES = ['ZA']
async function loadHotels() {
  try {
    let rows = []
    if (process.env.SEO_HOTELS_FILE) {
      rows = JSON.parse(fs.readFileSync(process.env.SEO_HOTELS_FILE, 'utf8'))
    } else {
      const url = process.env.VITE_SUPABASE_URL
      const key = process.env.VITE_SUPABASE_ANON_KEY
      if (!url || !key) { console.warn('[seo-prerender] no Supabase env vars - skipping hotel pages'); return [] }
      const PAGE = 500
      for (let offset = 0; offset < 20000; offset += PAGE) {
        const res = await fetch(
          `${url}/rest/v1/hg_hotel_pages?select=*&country=in.(${HOTEL_COUNTRIES.join(',')})&order=hotel_id.asc&limit=${PAGE}&offset=${offset}`,
          { headers: { apikey: key, Authorization: `Bearer ${key}` } }
        )
        if (!res.ok) throw new Error(`Supabase responded ${res.status}`)
        const page = await res.json()
        rows.push(...page)
        if (page.length < PAGE) break
      }
    }
    return rows.filter((h) => h.hotel_id && h.name && h.city && h.description)
  } catch (err) {
    console.warn(`[seo-prerender] hotels skipped: ${err.message}`)
    return []
  }
}
const HOTELS = await loadHotels()
for (const h of HOTELS) hotelRegistry.set(hotelPath(h), h)
for (const e of EVENTS) eventRegistry.set(e.slug, e)

function eventLinksHtml() {
  if (!EVENTS.length) return ''
  return `<h2>Upcoming events</h2><ul>${EVENTS.map((e) => `<li><a href="/events/${esc(e.slug)}">${esc(e.name)}</a> - ${esc(e.city)}, ${esc(e.date_label)}</li>`).join('')}</ul>`
}

const WRAP =
  'max-width:820px;margin:0 auto;padding:96px 24px 64px;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.65;color:#0a0a0a'

const destLink = (d) => `<li><a href="/accommodation/${d.slug}">${esc(d.name)}</a> &mdash; ${esc(d.cardTagline)}</li>`
const main = (inner) => `<main id="seo-fallback" style="${WRAP}">${inner}</main>`

// -- Page bodies (readable text that lives in the raw HTML) --------------------
function homeBody() {
  return main(`
<h1>Book Accommodation, South Africa &amp; Beyond.</h1>
<p>Discover real stays across Cape Town, Joburg, Durban and Pretoria &mdash; book on BLY., built for South African travellers.</p>
<h2>Popular destinations</h2>
<ul>${saDests.filter(isFullDestination).map(destLink).join('')}</ul>
<p><a href="/destinations">See all destinations</a> &middot; <a href="/events/south-africa">Events calendar</a> &middot; <a href="/insiders">Bly Insiders</a></p>
<h2>Travel guides</h2>
<ul>${BLOG.map(([u, t]) => `<li><a href="${u}">${esc(t)}</a></li>`).join('')}</ul>`)
}

function destinationsBody() {
  return main(`
<h1>Where are you headed?</h1>
<p>South Africa's best destinations and the international spots SA travellers love most.</p>
<h2>South Africa</h2>
<ul>${saDests.map(destLink).join('')}</ul>
<h2>International</h2>
<ul>${intlDests.map(destLink).join('')}</ul>`)
}

function destinationBody(d) {
  const searchUrl = `/search?city=${encodeURIComponent(d.searchCity || d.name)}`
  if (!isFullDestination(d)) {
    return main(`
<p><a href="/destinations">Destinations</a></p>
<h1>${esc(d.name)} accommodation</h1>
<p>${esc(d.heroTagline)}</p>
<p><a href="${searchUrl}">Search stays in ${esc(d.name)}</a></p>`)
  }
  const facts = (d.quickFacts || []).map((f) => `<li><strong>${esc(f.key)}:</strong> ${esc(f.val)}</li>`).join('')
  const things = (d.thingsToDo || [])
    .map((t) => `<li><strong>${esc(t.name)}</strong> &mdash; ${esc(t.desc)}${t.cost ? ` <em>(${esc(t.cost)})</em>` : ''}</li>`)
    .join('')
  const tips = (d.insiderTips || []).map((t) => `<li>${esc(t)}</li>`).join('')
  const travel = (d.travelTips || []).map((t) => `<li><strong>${esc(t.title)}:</strong> ${esc(t.copy)}</li>`).join('')
  const w = d.whereToStay
  const whereToStay = w
    ? `<h2>${esc(w.heading)}</h2><p>${esc(w.intro)}</p>${w.towns
        .map(
          (t) =>
            `<h3>${esc(t.name)}: ${esc(t.bestFor)}</h3><p>${esc(t.copy)}${
              t.searchCity ? ` <a href="/search?city=${encodeURIComponent(t.searchCity)}">Search stays in ${esc(t.searchCity)}</a>` : ''
            }${t.guideSlug ? ` &middot; <a href="/accommodation/${t.guideSlug}">${esc(t.name)} accommodation guide</a>` : ''}</p>`
        )
        .join('')}${
        w.byType && w.byType.length
          ? `<h3>${esc(d.name)} accommodation by type</h3><ul>${w.byType.map((b) => `<li><strong>${esc(b.name)}:</strong> ${esc(b.copy)}</li>`).join('')}</ul>`
          : ''
      }`
    : ''
  const partOf = d.partOf
    ? `<p>${esc(d.partOf.text)} <a href="/accommodation/${d.partOf.slug}">${esc(d.partOf.linkText)}</a>.</p>`
    : ''
  const destEvents = eventsForDestination(d.slug, EVENTS)
    .map((e) => `<li><a href="/events/${esc(e.slug)}">${esc(eventHeading(e))}</a> - ${esc(e.date_label || '')}</li>`)
    .join('')
  const destHotels = hotelsForDestination(d.slug, HOTELS)
    .map((h) => `<li><a href="${hotelPath(h)}">${esc(h.name)}</a>${h.city ? ` - ${esc(h.city)}` : ''}</li>`)
    .join('')
  const others = DESTINATIONS.filter((x) => x.slug !== d.slug && isFullDestination(x))
    .map((x) => `<a href="/accommodation/${x.slug}">${esc(x.name)}</a>`)
    .join(' &middot; ')
  return main(`
<p><a href="/destinations">Destinations</a> &rsaquo; ${esc(d.name)}</p>
<h1>${esc(d.name)} accommodation</h1>
<p><em>${esc(d.heroTagline)}</em></p>
${d.overview.map((p) => `<p>${esc(p)}</p>`).join('')}
${partOf}
${whereToStay}
${facts ? `<h2>${esc(d.name)} quick facts</h2><ul>${facts}</ul>` : ''}
${d.bestTime?.copy ? `<h2>Best time to visit ${esc(d.name)}</h2><p><strong>${esc(d.bestTime.badge || '')}.</strong> ${esc(d.bestTime.copy)}</p>` : ''}
${things ? `<h2>Things to do in ${esc(d.name)}</h2><ul>${things}</ul>` : ''}
${tips ? `<h2>Insider tips</h2><ul>${tips}</ul>` : ''}
${travel ? `<h2>Travel tips</h2><ul>${travel}</ul>` : ''}
${destHotels ? `<h2>Hotels in ${esc(d.name)}</h2><ul>${destHotels}</ul>` : ''}
${destEvents ? `<h2>Upcoming events in ${esc(d.name)}</h2><ul>${destEvents}</ul><p><a href="/events/south-africa">See the full events calendar</a></p>` : ''}
<h2>${esc(d.bookNow?.heading || `Book your ${d.name} stay`)}</h2>
<p>${esc(d.bookNow?.copy || '')} <a href="${searchUrl}">Search stays in ${esc(d.name)}</a></p>
<p>More destinations: ${others}</p>`)
}

const eventsBody = () =>
  main(`
<h1>Events Calendar.</h1>
<p>Every major festival, race, conference and sporting moment in South Africa and beyond &mdash; with BLY. accommodation for each one.</p>
<p><a href="/destinations">Browse destinations</a> &middot; <a href="/search">Search stays</a></p>${eventLinksHtml()}`)

const insidersBody = () =>
  main(`
<h1>Industry rates. For the trade.</h1>
<p>A members-only programme for travel professionals &mdash; unlock special rates across every BLY. property, every stay.</p>
<ul>
<li><strong>Insider-only rates</strong> &mdash; special pricing the public never sees, across participating BLY. properties.</li>
<li><strong>For the trade</strong> &mdash; available to travel agents, property staff and tourism professionals in South Africa.</li>
<li><strong>Instant access</strong> &mdash; once verified, Insider rates appear automatically every time you browse and book.</li>
</ul>`)

const groupRequestBody = () =>
  main(`
<h1>Group bookings: travelling with a crowd? Tell us once.</h1>
<p>Weddings, family reunions, teams, conferences and clubs. Share the plan and a BLY. consultant will come back with hotel options for your whole group.</p>
<h2>What happens next</h2>
<ol>
<li>A BLY. consultant reviews your request.</li>
<li>We send hotel options that fit your dates and group size.</li>
<li>You choose, and we handle the booking for the whole group.</li>
</ol>
<p>Sending a request is free and does not commit you to a booking.</p>
<p><a href="/destinations">Browse destinations</a> &middot; <a href="/events/south-africa">Events calendar</a></p>`)

const promoBody = () =>
  main(`
<h1>Enter promo code.</h1>
<p>Have a discount code? Enter it on this page and your saving will be applied automatically at checkout.</p>
<p><a href="/destinations">Browse destinations</a> &middot; <a href="/events/south-africa">Events calendar</a></p>`)

// -- Head + body injection -----------------------------------------------------
function build(urlPath, body, extraHead = '') {
  const seo = getSeoForPath(urlPath)
  let html = template
  const swap = (re, replacement, label) => {
    if (!re.test(html)) throw new Error(`template is missing ${label}`)
    html = html.replace(re, () => replacement)
  }
  swap(/<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`, '<title>')
  swap(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(seo.description)}" />`, 'meta description')
  swap(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(seo.canonical)}" />`, 'canonical link')
  swap(/<div id="root"><\/div>/, `<div id="root">${body}</div>`, '#root')
  const extra = [
    `<meta name="robots" content="${seo.robots}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="BLY." />`,
    `<meta property="og:locale" content="en_ZA" />`,
    `<link rel="alternate" hreflang="en-za" href="${esc(seo.canonical)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(seo.canonical)}" />`,
    `<meta property="og:title" content="${esc(seo.title)}" />`,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
    `<meta property="og:url" content="${esc(seo.canonical)}" />`,
    `<meta property="og:image" content="${esc(seo.image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${esc(seo.image)}" />`,
    extraHead,
  ].join('\n    ')
  swap(/<\/head>/, `    ${extra}\n  </head>`, '</head>')
  return html
}

function write(urlPath, html) {
  const out = urlPath === '/' ? indexPath : path.join(dist, urlPath.replace(/^\//, ''), 'index.html')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, html)
  console.log(`[seo-prerender] ${urlPath}  ->  ${path.relative(root, out)}`)
}

function tryWrite(urlPath, bodyFn, extraHeadFn) {
  try {
    write(urlPath, build(urlPath, bodyFn(), extraHeadFn ? extraHeadFn() : ''))
  } catch (err) {
    console.warn(`[seo-prerender] SKIPPED ${urlPath}: ${err.message}`)
  }
}

const ld = (id, path, obj) =>
  `<script type="application/ld+json" id="${id}" data-prerender="1" data-path="${path}">${jsonLd(obj)}</script>`

// Homepage + static pages
tryWrite('/', homeBody)
tryWrite('/destinations', destinationsBody, () =>
  ld('bly-breadcrumb-schema', '/destinations', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Destinations', item: `${SITE}/destinations` },
    ],
  })
)
if (STATIC_PAGES['/events/south-africa']) tryWrite('/events/south-africa', eventsBody)
if (STATIC_PAGES['/insiders']) tryWrite('/insiders', insidersBody)
if (STATIC_PAGES['/group-request']) tryWrite('/group-request', groupRequestBody)
if (STATIC_PAGES['/promo']) tryWrite('/promo', promoBody)

// One page per destination
for (const d of DESTINATIONS) {
  const p = `/accommodation/${d.slug}`
  tryWrite(p, () => destinationBody(d), () => {
    if (!isFullDestination(d)) return ''
    return [
      ld('bly-destination-schema', p, {
        '@context': 'https://schema.org',
        '@type': 'TouristDestination',
        name: d.name,
        description: d.overview[0] || d.cardTagline,
        url: `${SITE}${p}`,
        image: absoluteUrl(d.heroImage),
        touristType: 'Leisure travellers',
        includesAttraction: (d.thingsToDo || []).map((a) => ({ '@type': 'TouristAttraction', name: a.name, description: a.desc })),
      }),
      ld('bly-breadcrumb-schema', p, {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Destinations', item: `${SITE}/destinations` },
          { '@type': 'ListItem', position: 3, name: d.name, item: `${SITE}${p}` },
        ],
      }),
    ].join('\n    ')
  })
}
// -- Event pages (one per active, upcoming event) -------------------------------
function eventBody(ev) {
  const rel = relatedForEvent(ev)
  const same = EVENTS.filter((x) => x.slug !== ev.slug && x.city === ev.city).slice(0, 5)
  return main(`
<p><a href="/">Home</a> &rsaquo; <a href="/events/south-africa">Events</a> &rsaquo; ${esc(ev.name)}</p>
<h1>${esc(eventHeading(ev))}</h1>
${ev.sub ? `<p><em>${esc(ev.sub)}</em></p>` : ''}
<ul><li><strong>When:</strong> ${esc(ev.date_label)}</li><li><strong>Where:</strong> ${esc(ev.city)}${ev.area && ev.area !== ev.city ? ', ' + esc(ev.area) : ''}</li><li><strong>Type:</strong> ${esc(ev.category)}</li></ul>
<p>${esc(ev.description)}</p>
<h2>Find accommodation in ${esc(ev.city)}</h2>
<p><a href="${esc(eventSearchUrl(ev))}">Search stays in ${esc(ev.city)}</a>${ev.event_start ? '' : ' (exact dates are still to be confirmed, so pick your own dates)'}</p>
${rel.destination ? `<p><a href="/accommodation/${rel.destination.slug}">${esc(rel.destination.name)} accommodation guide</a></p>` : ''}
${rel.guide ? `<p><a href="${rel.guide.url}">${esc(rel.guide.title)}</a></p>` : ''}
${same.length ? `<h2>More events in ${esc(ev.city)}</h2><ul>${same.map((x) => `<li><a href="/events/${esc(x.slug)}">${esc(x.name)}</a> - ${esc(x.date_label)}</li>`).join('')}</ul>` : ''}
<p><a href="/events/south-africa">All events</a> &middot; <a href="/destinations">Destinations</a></p>`)
}

function eventLd(ev) {
  const p = `/events/${ev.slug}`
  const out = []
  if (ev.event_start) {
    out.push(
      ld('bly-event-schema', p, {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: ev.name,
        description: ev.description,
        startDate: ev.event_start,
        ...(ev.event_end ? { endDate: ev.event_end } : {}),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: ev.city,
          address: { '@type': 'PostalAddress', addressLocality: ev.city, ...(ev.area ? { addressRegion: ev.area } : {}) },
        },
        image: [DEFAULT_OG_IMAGE],
        url: `${SITE}${p}`,
      })
    )
  }
  out.push(
    ld('bly-breadcrumb-schema', p, {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Events', item: `${SITE}/events/south-africa` },
        { '@type': 'ListItem', position: 3, name: ev.name, item: `${SITE}${p}` },
      ],
    })
  )
  return out.join('\n    ')
}

for (const ev of EVENTS) tryWrite(`/events/${ev.slug}`, () => eventBody(ev), () => eventLd(ev))
console.log(`[seo-prerender] event pages: ${EVENTS.length}`)

// -- Hotel pages (one per hotel in HOTELS) --------------------------------------
function hotelBody(h) {
  const p = hotelPath(h)
  const dest = destinationForCity(h.city)
  const place = [h.city, countryName(h.country)].filter(Boolean).join(', ')
  const stars = Math.round(Number(h.star_rating) || 0)
  const paras = String(h.description || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '')
    .split(/\n+/).map((x) => x.trim()).filter(Boolean)
  const sameCity = HOTELS.filter((x) => String(x.city).toLowerCase() === String(h.city).toLowerCase())
  const at = sameCity.findIndex((x) => x.hotel_id === h.hotel_id)
  const more = []
  for (let k = 1; k < sameCity.length && more.length < 8; k++) more.push(sameCity[(at + k) % sameCity.length])
  const searchUrl = `/search?city=${encodeURIComponent(h.city)}${h.country ? `&amp;country=${esc(h.country)}` : ''}`
  return main(`
<p><a href="/">Home</a> &rsaquo; ${dest ? `<a href="/accommodation/${dest.slug}">${esc(dest.name)}</a> &rsaquo; ` : ''}${esc(h.name)}</p>
<h1>${esc(h.name)}</h1>
<p>${stars > 0 ? `${stars}-star stay in ` : ''}${esc(place)}</p>
${h.photos && h.photos[0] ? `<p><img src="${esc(h.photos[0])}" alt="${esc(h.name)}" style="max-width:100%;border-radius:12px" /></p>` : ''}
<p><a href="${p}">Check availability and rates for ${esc(h.name)}</a></p>
<h2>About ${esc(h.name)}</h2>
${paras.map((x) => `<p>${esc(x)}</p>`).join('')}
${h.facilities && h.facilities.length ? `<h2>Facilities</h2><ul>${h.facilities.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
${h.room_types && h.room_types.length ? `<h2>Room types</h2><ul>${h.room_types.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
${h.check_in || h.check_out ? `<h2>Good to know</h2><p>${h.check_in ? `Check-in from ${esc(h.check_in)}. ` : ''}${h.check_out ? `Check-out by ${esc(h.check_out)}.` : ''}</p>` : ''}
${more.length ? `<h2>More hotels in ${esc(h.city)}</h2><ul>${more.map((x) => `<li><a href="${hotelPath(x)}">${esc(x.name)}</a></li>`).join('')}</ul>` : ''}
<p><a href="${searchUrl}">All stays in ${esc(h.city)}</a>${dest ? ` &middot; <a href="/accommodation/${dest.slug}">${esc(dest.name)} travel guide</a>` : ''} &middot; <a href="/destinations">Destinations</a></p>`)
}

function hotelLd(h) {
  const p = hotelPath(h)
  const dest = destinationForCity(h.city)
  const stars = Number(h.star_rating) || 0
  const crumbs = [{ name: 'Home', item: `${SITE}/` }]
  if (dest) crumbs.push({ name: dest.name, item: `${SITE}/accommodation/${dest.slug}` })
  crumbs.push({ name: h.name, item: `${SITE}${p}` })
  const hotel = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: h.name,
    url: `${SITE}${p}`,
    description: plainText(h.description).slice(0, 500),
    address: { '@type': 'PostalAddress', addressLocality: h.city, addressCountry: h.country },
  }
  if (h.photos && h.photos.length) hotel.image = h.photos
  if (h.latitude != null && h.longitude != null) {
    hotel.geo = { '@type': 'GeoCoordinates', latitude: Number(h.latitude), longitude: Number(h.longitude) }
  }
  if (stars > 0) hotel.starRating = { '@type': 'Rating', ratingValue: stars }
  if (h.check_in) hotel.checkinTime = h.check_in
  if (h.check_out) hotel.checkoutTime = h.check_out
  if (h.facilities && h.facilities.length) {
    hotel.amenityFeature = h.facilities.map((f) => ({ '@type': 'LocationFeatureSpecification', name: f, value: true }))
  }
  return [
    ld('bly-hotel-schema', p, hotel),
    ld('bly-breadcrumb-schema', p, {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
    }),
  ].join('\n    ')
}
{
  let written = 0
  for (const h of HOTELS) {
    try {
      const p = hotelPath(h)
      const out = path.join(dist, p.replace(/^\//, ''), 'index.html')
      fs.mkdirSync(path.dirname(out), { recursive: true })
      fs.writeFileSync(out, build(p, hotelBody(h), hotelLd(h)))
      written++
    } catch (err) {
      console.warn(`[seo-prerender] SKIPPED hotel ${h.hotel_id}: ${err.message}`)
    }
  }
  console.log(`[seo-prerender] hotel pages: ${written}`)
}

// Hotel sitemap (always written, so the URL in robots.txt never breaks)
try {
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
  for (const h of HOTELS) xml.push('  <url>', `    <loc>${SITE}${hotelPath(h)}</loc>`, '  </url>')
  xml.push('</urlset>', '')
  fs.writeFileSync(path.join(dist, 'sitemap-hotels.xml'), xml.join('\n'))
  console.log(`[seo-prerender] sitemap-hotels.xml  ->  ${HOTELS.length} URLs`)
} catch (err) {
  console.warn(`[seo-prerender] hotel sitemap skipped: ${err.message}`)
}

// -- Sitemap (rebuilt on every deploy from the same data as the pages) ---------
// Only indexable pages are listed. Blog lastmod dates are kept from public/sitemap.xml.
try {
  const smPath = path.join(root, 'public', 'sitemap.xml')
  const oldXml = fs.existsSync(smPath) ? fs.readFileSync(smPath, 'utf8') : ''
  const lastmods = {}
  for (const m of oldXml.matchAll(/<url>[\s\S]*?<\/url>/g)) {
    const loc = (m[0].match(/<loc>([^<]+)<\/loc>/) || [])[1]
    const lm = (m[0].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1]
    if (loc) lastmods[loc.trim()] = lm
  }
  const urls = [
    '/', '/destinations', '/events/south-africa', '/insiders', '/group-request', '/blog',
    ...DESTINATIONS.filter(isFullDestination).map((d) => `/accommodation/${d.slug}`),
    ...BLOG.map(([u]) => u),
    ...EVENTS.map((e) => `/events/${e.slug}`),
  ]
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
  for (const u of urls) {
    const loc = `${SITE}${u}`
    xml.push('  <url>', `    <loc>${loc}</loc>`)
    if (lastmods[loc]) xml.push(`    <lastmod>${lastmods[loc]}</lastmod>`)
    xml.push('  </url>')
  }
  xml.push('</urlset>', '')
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), xml.join('\n'))
  console.log(`[seo-prerender] sitemap.xml  ->  ${urls.length} URLs`)
} catch (err) {
  console.warn(`[seo-prerender] sitemap skipped: ${err.message}`)
}
console.log('[seo-prerender] done')
