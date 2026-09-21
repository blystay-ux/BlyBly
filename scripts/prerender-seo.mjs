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
  eventRegistry, eventHeading, eventSearchUrl, relatedForEvent,
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
fs.writeFileSync(path.join(dist, 'app-shell.html'), template)

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c')

const saDests = DESTINATIONS.filter((d) => d.region === 'south-africa')
const intlDests = DESTINATIONS.filter((d) => d.region !== 'south-africa')
const BLOG = [
  ['/blog/hotels-cape-town-guide', 'Hotels in Cape Town: where to stay'],
  ['/blog/hotels-johannesburg-guide', 'Hotels in Johannesburg: where to stay in Jozi'],
  ['/blog/garden-route-hotels-guide', 'Garden Route road trip: best hotels along the way'],
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
  const others = DESTINATIONS.filter((x) => x.slug !== d.slug && isFullDestination(x))
    .map((x) => `<a href="/accommodation/${x.slug}">${esc(x.name)}</a>`)
    .join(' &middot; ')
  return main(`
<p><a href="/destinations">Destinations</a> &rsaquo; ${esc(d.name)}</p>
<h1>${esc(d.name)} accommodation</h1>
<p><em>${esc(d.heroTagline)}</em></p>
${d.overview.map((p) => `<p>${esc(p)}</p>`).join('')}
${facts ? `<h2>${esc(d.name)} quick facts</h2><ul>${facts}</ul>` : ''}
${d.bestTime?.copy ? `<h2>Best time to visit ${esc(d.name)}</h2><p><strong>${esc(d.bestTime.badge || '')}.</strong> ${esc(d.bestTime.copy)}</p>` : ''}
${things ? `<h2>Things to do in ${esc(d.name)}</h2><ul>${things}</ul>` : ''}
${tips ? `<h2>Insider tips</h2><ul>${tips}</ul>` : ''}
${travel ? `<h2>Travel tips</h2><ul>${travel}</ul>` : ''}
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
        image: d.heroImage,
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
    '/', '/destinations', '/events/south-africa', '/insiders', '/blog',
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
