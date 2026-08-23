
> bly@0.1.0 build
> vite build
vite v5.4.21 building for production...
transforming...
✓ 39 modules transformed.
x Build failed in 959ms
error during build:
[vite:build-import-analysis] [plugin vite:build-import-analysis] src/data/destinations.js (287:660): Failed to parse source for import analysis because the content contains invalid JS syntax. If you are using JSX, make sure to name the file with the .jsx or .tsx extension.
file: /vercel/path0/src/data/destinations.js:287:660
285:   // ── STUBS — add full content as copy is written ───────────────────────────
286:   { slug: 'kruger',        name: 'Kruger National Park', region: 'south-africa', regionLabel: 'South Africa', heroImage: '/images/destinations/kruger.jpg',        heroTagline: 'Five animals. Zero cell signal. The real South Africa.',             cardTagline: 'Big Five. Braai. Bush.',                  flyTime: '45min from JHB', currency: 'ZAR', bestTimeShort: 'May – Sep', overview: [], quickFacts: [], bestTime: { badge: 'May – Sep', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Kruger base', copy: 'SANParks camps, private lodges, and self-catering — find your Kruger stay on Bly.' }, searchCity: 'Hoedspruit' },
287:   { slug: 'garden-route',  name: 'Garden Route',         region: 'south-africa', regionLabel: 'South Africa', heroImage: '/images/destinations/garden-route.jpg',  heroTagline: 'Some roads end. The Garden Route doesn't want to.',                cardTagline: 'Forests. Lagoons. Cliffs.',               flyTime: '1hr to George', currency: 'ZAR', bestTimeShort: 'Oct – Apr', overview: [], quickFacts: [], bestTime: { badge: 'Oct – Apr', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Garden Route stop', copy: 'Wilderness, Knysna, Plett, or Storms River — find your Garden Route base on Bly.' }, searchCity: 'Knysna' },
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         ^
288:   { slug: 'knysna',        name: 'Knysna',               region: 'south-africa', regionLabel: 'South Africa', heroImage: '/images/destinations/knysna.jpg',        heroTagline: 'Oysters. Lagoon. Those Heads. Knysna, basically perfect.',        cardTagline: 'The lagoon doesn't rush. Neither should you.', flyTime: '1hr to George', currency: 'ZAR', bestTimeShort: 'Oct – Apr', overview: [], quickFacts: [], bestTime: { badge: 'Oct – Apr', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Knysna stay', copy: 'Lagoon view or forest retreat — Knysna stays book fast. Lock in your rate on Bly.' }, searchCity: 'Knysna' },
289:   { slug: 'pretoria',      name: 'Pretoria',             region: 'south-africa', regionLabel: 'South Africa', heroImage: '/images/destinations/pretoria.jpg',      heroTagline: 'Jacaranda season hits different. So does Pretoria.',              cardTagline: 'History, embassies, 70,000 jacaranda trees.', flyTime: '30min from JHB', currency: 'ZAR', bestTimeShort: 'Oct – Nov', overview: [], quickFacts: [], bestTime: { badge: 'Oct – Nov', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: "Book your Pretoria stay", copy: 'Embassy-district boutiques to Hatfield guesthouses — book direct on Bly.' }, searchCity: 'Pretoria' },
    at getRollupError (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:317:41)
    at error (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:313:42)
    at Object.error (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:22471:20)
    at Object.error (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21523:42)
    at Object.transform (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:64913:14)
Error: Command "npm run build" exited with 1
Deployment Summary
