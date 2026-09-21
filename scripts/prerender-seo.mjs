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
import { SITE, STATIC_PAGES, getSeoForPath, isFullDestination } from '../src/seo/seo.js'

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

const WRAP =
  'max-width:820px;margin:0 auto;padding:96px 24px 64px;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.65;color:#0a0a0a'

const destLink = (d) => `<li><a href="/accommodation/${d.slug}">${esc(d.name)}</a> &mdash; ${esc(d.cardTagline)}</li>`
const main = (inner) => `<main id="seo-fallback" style="${WRAP}">${inner}</main>`

// -- Page bodies (readable text that lives in the raw HTML) --------------------
function homeBody() {
  return main(`
<h1>Book Accommodation, South Africa &amp; Beyond.</h1>
<p>Discover real stays across Cape Town, Joburg, Durban and Pretoria &mdash; direct from the host, better value.</p>
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
<p><a href="/destinations">Browse destinations</a> &middot; <a href="/search">Search stays</a></p>`)

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
console.log('[seo-prerender] done')
