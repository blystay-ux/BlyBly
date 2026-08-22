// ─────────────────────────────────────────────────────────────────────────────
// Bly Travel — Destination Data
// Each destination drives the /accommodation/:slug landing page.
// Add hero images by replacing the heroImage placeholder with a real URL.
// Remaining 17 destinations are stubbed — add full content as copy is written.
// ─────────────────────────────────────────────────────────────────────────────

export const DESTINATIONS = [

  // ── SOUTH AFRICA ─────────────────────────────────────────────────────────

  {
    slug: 'cape-town',
    name: 'Cape Town',
    region: 'south-africa',
    regionLabel: 'South Africa',
    heroImage: '/images/destinations/cape-town.jpg',  // replace with real image
    heroTagline: 'The mountain picks your mood. The ocean handles the rest.',
    cardTagline: 'Mountain. Ocean. Magic.',
    flyTime: '2hrs from JHB',
    currency: 'ZAR',
    bestTimeShort: 'Nov – Feb',
    overview: [
      "Cape Town is South Africa's most-photographed city for a reason — it's genuinely, almost unfairly, beautiful. Table Mountain looms over everything like a flat-topped godfather, the Atlantic Seaboard sparkles on one side, False Bay stretches on the other, and somehow the city packs world-class food, wine, beaches, and culture into a peninsula you can drive end-to-end in an hour.",
      "This isn't just a holiday destination. It's a place people visit once and spend the next five years figuring out how to move to. The V&A Waterfront hums with tourists and locals alike; Woodstock and Salt River are mid-bake gentrification with great coffee; and the Winelands are literally 40 minutes away when you need more beauty.",
    ],
    quickFacts: [
      { key: 'Fly from',        val: 'JHB (2hrs) · DBN (2hrs) · PE (1hr)' },
      { key: 'Currency',        val: 'South African Rand (ZAR)' },
      { key: 'Climate',         val: 'Mediterranean — hot dry summers (Dec–Mar), mild wet winters (Jun–Aug)' },
      { key: 'Language',        val: 'Afrikaans · Xhosa · English' },
      { key: 'Getting around',  val: 'Uber, MyCiTi bus, car hire for day trips' },
      { key: 'Best areas',      val: "V&A Waterfront, Sea Point, Green Point, De Waterkant, Camps Bay, Boulders (Simon's Town)" },
    ],
    bestTime: {
      badge: 'Nov – Feb',
      copy: "Peak summer — beach weather, long days. March–April is the crowd-and-price sweet spot. Sept–Oct for whale season on False Bay side.",
    },
    thingsToDo: [
      {
        num: '01',
        name: 'Table Mountain Cable Car',
        tag: 'Bucket List',
        desc: "Ride up for the 360° view, walk down the Platteklip Gorge trail if you're feeling ambitious. Go early morning before the cloud rolls in — the mountain makes no promises after midday.",
        cost: 'R430 return · Cable car',
      },
      {
        num: '02',
        name: 'Cape Peninsula Day Trip',
        tag: 'Road Trip',
        desc: "Chapman's Peak Drive, Boulders Beach Penguins, Cape Point Lighthouse, Hout Bay harbour — all in one long glorious loop. Hire a car or join a tour, but do it in that order.",
        cost: '~R200pp fuel · car hire from R450/day',
      },
      {
        num: '03',
        name: 'Boulders Beach Penguins',
        tag: 'Wild',
        desc: "African penguins, up close, waddling around like they own the place. Because they do. Simon's Town village is a great half-day add-on — good fish and chips, genuinely charming.",
        cost: 'R220 conservation fee',
      },
      {
        num: '04',
        name: 'Cape Winelands',
        tag: 'Sipping',
        desc: "Franschhoek, Stellenbosch, and Paarl are less than an hour away. Book a tasting at Boschendal, grab a lazy long lunch at Le Quartier Français, and thank us later.",
        cost: 'Wine tastings from R150–R400pp',
      },
      {
        num: '05',
        name: 'Zeitz MOCAA & V&A Waterfront',
        tag: 'Culture',
        desc: "The Waterfront sounds touristy but it delivers: harbour seals, artisan markets, and Zeitz MOCAA — Africa's largest contemporary art museum in a converted grain silo.",
        cost: 'Museum from R200 · Waterfront free to explore',
      },
      {
        num: '06',
        name: 'Clifton & Camps Bay Beaches',
        tag: 'Beach',
        desc: "The Atlantic is cold (cold cold) but Clifton 4th Beach and Camps Bay are the spots. Pack the cooler, claim your towel space early, settle in for a proper Cape Town afternoon.",
        cost: 'Free · Camps Bay restaurants from R180 a main',
      },
    ],
    insiderTips: [
      "The southerly wind (the Cape Doctor) hits hardest Dec–Feb. Beach days can flip fast — always check the wind direction before committing to Atlantic vs False Bay.",
      "Kalk Bay is what Hout Bay wishes it were. Kalky's fish and chips on the harbour wall is better than 90% of restaurant meals you'll have.",
      "Long Street is the nightlife strip, but Truth Coffee in De Waterkant is the morning ritual that matters more.",
      "Traffic on De Waal Drive into town is bad in peak summer. Stay on the Atlantic Seaboard and avoid needing to commute if you can.",
      "The Cape of Good Hope trail hike means you don't need to pay for the funicular at Cape Point. Worth knowing.",
    ],
    travelTips: [
      { title: 'Load Shedding',       copy: 'Download EskomSePush before you fly. It shows your accommodation\'s shed schedule so you\'re never caught off-guard at dinner.' },
      { title: 'Car Is King',         copy: 'Uber covers the CBD well, but for the Peninsula, Winelands, or any beach hopping, hire a car. Surge from Camps Bay at night can be brutal.' },
      { title: 'UV Is Serious',       copy: "You're closer to the ozone hole than you think. SPF 50, every day, reapply. No one believes this until they peel." },
      { title: 'Book Sunset Tables',  copy: 'Camps Bay restaurants fill up Dec–Jan. If you want a sunset table with a view, book 2–3 days ahead — the walk-in gamble rarely pays off.' },
    ],
    bookNow: {
      heading: 'Ready to book Cape Town?',
      copy: "Hotels, guesthouses, and self-catering options — from the V&A to Camps Bay. No booking fees, no surprises. Just the good stuff.",
    },
    searchCity: 'Cape Town',
  },

  {
    slug: 'johannesburg',
    name: 'Johannesburg',
    region: 'south-africa',
    regionLabel: 'South Africa',
    heroImage: '/images/destinations/johannesburg.jpg',
    heroTagline: "Jo'burg doesn't welcome you slowly. It just starts.",
    cardTagline: "Electric. Complicated. Irreplaceable.",
    flyTime: '1hr from DBN',
    currency: 'ZAR',
    bestTimeShort: 'May – Aug',
    overview: [
      "Johannesburg is not a city you visit for the scenery. You visit it because it's alive in a way that few cities on earth can match — electric, complicated, historically loaded, and deeply, stubbornly itself. This is where South Africa's story happened. Apartheid, gold, jazz, Mandela, the townships, the art scene — all of it, layered in a city that refuses to be neatly packaged.",
      "What surprises most visitors is how green and leafy the northern suburbs are — Sandton, Rosebank, Melville, Parkhurst — and how good the food scene has become. Maboneng and Braamfontein have done for Joburg what Shoreditch did for East London, and the art, music, and restaurant culture there is legitimately world-class. Soweto is not to be missed.",
    ],
    quickFacts: [
      { key: 'Fly from',        val: 'CPT (2hrs) · DBN (1hr) · PE (1.5hrs)' },
      { key: 'Currency',        val: 'South African Rand (ZAR)' },
      { key: 'Climate',         val: 'Subtropical highland — warm summers with afternoon storms (Nov–Feb), dry mild winters (May–Aug)' },
      { key: 'Language',        val: 'Zulu · Sotho · Afrikaans · English + 8 more' },
      { key: 'Getting around',  val: 'Gautrain (airport to Sandton), Uber, car hire for suburbs' },
      { key: 'Best areas',      val: 'Sandton, Rosebank, Melville, Maboneng, Fourways' },
    ],
    bestTime: {
      badge: 'May – Aug',
      copy: "Dry season, no afternoon storms, clear blue sky, mild days. Sept–Oct shoulder season is ideal. Dec–Jan is peak but hot and stormy.",
    },
    thingsToDo: [
      {
        num: '01',
        name: 'Apartheid Museum',
        tag: 'Essential',
        desc: "The most important museum in South Africa. Brutally honest, beautifully curated. Block out 3–4 hours and don't plan anything heavy for afterwards.",
        cost: 'R220pp',
      },
      {
        num: '02',
        name: 'Soweto Township Tour',
        tag: 'History + Culture',
        desc: "Vilakazi Street (the only street where two Nobel Peace Prize winners lived), Regina Mundi, Orlando Ekhaya. Do it with a local guide — you get context you simply can't find on your own.",
        cost: 'R500–R800pp with guide',
      },
      {
        num: '03',
        name: 'Maboneng Precinct',
        tag: 'Urban',
        desc: "Joburg's creative quarter: galleries, brunch spots, design stores, and the Market on Main on Sundays. The arts crawl on the last Sunday of the month is the one to plan around.",
        cost: 'Free to explore · budget R150–300 for food',
      },
      {
        num: '04',
        name: 'Cradle of Humankind',
        tag: 'UNESCO',
        desc: "An hour northwest of Joburg: the Sterkfontein Caves where Mrs Ples was discovered. 3.5 million years of human history in a cave you can walk through today.",
        cost: 'R220 cave tour',
      },
      {
        num: '05',
        name: 'Neighbourgoods Market, Braamfontein',
        tag: 'Food + Vibe',
        desc: "Saturday mornings, Braamfontein. Bunny chow, boerewors, craft beer, vinyl. The social event of the Joburg week and a perfect introduction to the city's energy.",
        cost: 'Free entry · budget R200–400 for food and drinks',
      },
      {
        num: '06',
        name: 'Gold Reef City',
        tag: 'Fun',
        desc: "Victorian Joburg re-created as a theme park, with genuine gold mine tours going 200m underground. Better than it sounds. Excellent with kids, surprisingly good without them.",
        cost: 'R350–R450pp',
      },
    ],
    insiderTips: [
      "Never walk in the Joburg CBD at night. Maboneng and Braamfontein have improved massively but keep your wits.",
      "The Gautrain from OR Tambo to Sandton costs R200 and takes 15 minutes. The alternative (Uber in peak hour) costs more and takes an hour. Easy choice.",
      "Joburg winters are colder than most SA visitors expect. It can drop to 5°C at night in June–July. Pack a proper jacket.",
      "Sunday in Joburg is sacred. Everything happens on Sundays — Neighbourgoods, the Maboneng market, brunch culture. Plan your best day around it.",
      "Petrol station restaurants are a Joburg institution. Mugg & Bean at a BP doesn't feel like it should work. It does. Don't fight it.",
    ],
    travelTips: [
      { title: 'Drive or Uber',      copy: "Joburg is a car city. Distances are significant and the Gautrain only covers the main spine. Uber is safe, good value, and plentiful." },
      { title: 'Stay North',         copy: "For first-timers, Sandton and Rosebank are easiest — safe, walkable, excellent food. Venture CBD with intention, not by accident." },
      { title: 'Storm Season',       copy: "Nov–Feb afternoon storms are fast and intense. A 20-minute cloudburst can dump 50mm. Don't be outside in one — they pass quickly." },
      { title: "Don't Skip Soweto", copy: "South Africa's largest township and one of its most vibrant places. A guided tour is the right approach — it supports local guides and gives you context." },
    ],
    bookNow: {
      heading: 'Book your Joburg stay',
      copy: "Business lodges, boutique hotels, and suburb guesthouses — direct, no markups, no middleman.",
    },
    searchCity: 'Johannesburg',
  },

  {
    slug: 'durban',
    name: 'Durban',
    region: 'south-africa',
    regionLabel: 'South Africa',
    heroImage: '/images/destinations/durban.jpg',
    heroTagline: 'Warm water. Warmer people. Durban runs on both.',
    cardTagline: 'Indian Ocean. Indian spice. Entirely its own thing.',
    flyTime: '1hr from JHB',
    currency: 'ZAR',
    bestTimeShort: 'Jun – Sep',
    overview: [
      "Durban is South Africa's least pretentious city — and that's exactly why people who go keep going back. The Indian Ocean here is warm enough to actually swim in year-round (unlike the Atlantic — sorry, Cape Town). The food is a riot: bunny chow, curries, cane spirit, beachfront kotas — Durban's culinary culture is unlike anywhere else in the country and entirely its own thing.",
      "The Golden Mile is the heartbeat of the city, but the real Durban hides in the Berea, in Victoria Street Market, in uShaka Marine World, and out towards the Valley of a Thousand Hills where the scenery shifts dramatically. The best surf breaks in South Africa, excellent weather almost year-round, and a warmth — literal and human — that the highveld cities simply can't match.",
    ],
    quickFacts: [
      { key: 'Fly from',        val: 'JHB (1hr) · CPT (2hrs) · PE (1.5hrs)' },
      { key: 'Currency',        val: 'South African Rand (ZAR)' },
      { key: 'Climate',         val: 'Subtropical humid — warm year-round, rainfall Oct–Mar, dry mild winters' },
      { key: 'Language',        val: 'Zulu · English · Tamil (Indian community)' },
      { key: 'Getting around',  val: 'Uber · car hire recommended for further areas' },
      { key: 'Best areas',      val: 'Umhlanga, Berea, Golden Mile/Beachfront, uMhlanga Rocks' },
    ],
    bestTime: {
      badge: 'Jun – Sep',
      copy: "Durban's 'winter' is warm and dry — peak season for good reason. December–January is summer beach season but humid. Surfers: the Billabong Pro runs July–August.",
    },
    thingsToDo: [
      {
        num: '01',
        name: "Bunny Chow at Emmanuel's or Goundens",
        tag: 'Essential Eat',
        desc: "A quarter loaf of white bread hollowed out and filled with curry. Order the bean or the mutton. Eat with your hands. This is not optional — it's the whole point of coming to Durban.",
        cost: 'Under R60 · no excuses',
      },
      {
        num: '02',
        name: 'uShaka Marine World',
        tag: 'Family',
        desc: "One of Africa's best marine theme parks: shark tank dives, dolphin shows, and a water park that'll destroy your afternoon plans in the best way.",
        cost: 'From R280pp',
      },
      {
        num: '03',
        name: 'Valley of a Thousand Hills',
        tag: 'Scenic',
        desc: "45 minutes from central Durban, the Midlands landscape opens up dramatically. Phezulu Safari Park does Zulu cultural shows alongside croc feeding.",
        cost: 'R350pp with cultural show',
      },
      {
        num: '04',
        name: 'Victoria Street Market',
        tag: 'Culture',
        desc: "Durban's Indian spice market: saris, spices, curries to-go, and absolute sensory overload. Go for the atmosphere as much as anything else.",
        cost: 'Free entry',
      },
      {
        num: '05',
        name: 'Umhlanga Beach',
        tag: 'Beach',
        desc: "Durban's upmarket northern suburb has the best beach setup: clean, calm, good restaurants close by, and a proper surf break.",
        cost: 'Free · restaurants from R150 a main',
      },
      {
        num: '06',
        name: 'North Beach Surf & Surf Museum',
        tag: 'Surf',
        desc: "If you surf, North Beach and New Pier are where Durban's surf culture lives. The city has an actual Surf Museum — which tells you everything about how seriously Durban takes the ocean.",
        cost: 'Lessons from R350pp',
      },
    ],
    insiderTips: [
      "The N3 between Joburg and Durban is one of the most dangerous roads in SA. If driving, go early, don't speed, and avoid it at night — full stop.",
      "Durban heat + humidity in January is intense. If you're from the Highveld, give yourself a day to acclimatise before doing anything physically demanding.",
      "The Bluff area (south of the harbour) is local, underrated, and has excellent surf breaks that visitors completely overlook.",
      "Musgrave, Windermere, and Florida Road are where the restaurant and bar scene actually lives — not the tourist beachfront strip.",
      "The taxi culture in Durban is aggressive by SA standards. Stick to Uber unless you know exactly what you're doing.",
    ],
    travelTips: [
      { title: 'Swim Safely',       copy: 'Durban beaches have shark nets and lifeguards. Always swim between the flags. Check the shark spotter board before entering the water.' },
      { title: 'Base in Umhlanga', copy: 'Umhlanga Rocks is the easiest base — restaurants in walking distance, great beach, Uber everywhere. Central Durban beachfront is louder and less curated.' },
      { title: 'Respect the Curry', copy: "Durban curry is not 'mild' by default. Clarify your heat preference — local medium can be tourist maximum. Delicious either way, just go in prepared." },
      { title: 'Day Trip to Drakensberg', copy: "The uKhahlamba-Drakensberg Park is 3.5 hours from Durban. Absolutely worth the drive for a night or two — the contrast from the city is dramatic." },
    ],
    bookNow: {
      heading: 'Sun, surf, and bunny chow — in that order.',
      copy: "Find your Durban stay on Bly. No markups, just good accommodation booked direct from the property.",
    },
    searchCity: 'Durban',
  },

  // ── STUBS — add full content as copy is written ───────────────────────────
  { slug: 'kruger',        name: 'Kruger National Park', region: 'south-africa', regionLabel: 'South Africa', heroImage: '/images/destinations/kruger.jpg',        heroTagline: 'Five animals. Zero cell signal. The real South Africa.',             cardTagline: 'Big Five. Braai. Bush.',                  flyTime: '45min from JHB', currency: 'ZAR', bestTimeShort: 'May – Sep', overview: [], quickFacts: [], bestTime: { badge: 'May – Sep', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Kruger base', copy: 'SANParks camps, private lodges, and self-catering — find your Kruger stay on Bly.' }, searchCity: 'Hoedspruit' },
  { slug: 'garden-route',  name: 'Garden Route',         region: 'south-africa', regionLabel: 'South Africa', heroImage: '/images/destinations/garden-route.jpg',  heroTagline: 'Some roads end. The Garden Route doesn't want to.',                cardTagline: 'Forests. Lagoons. Cliffs.',               flyTime: '1hr to George', currency: 'ZAR', bestTimeShort: 'Oct – Apr', overview: [], quickFacts: [], bestTime: { badge: 'Oct – Apr', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Garden Route stop', copy: 'Wilderness, Knysna, Plett, or Storms River — find your Garden Route base on Bly.' }, searchCity: 'Knysna' },
  { slug: 'knysna',        name: 'Knysna',               region: 'south-africa', regionLabel: 'South Africa', heroImage: '/images/destinations/knysna.jpg',        heroTagline: 'Oysters. Lagoon. Those Heads. Knysna, basically perfect.',        cardTagline: 'The lagoon doesn't rush. Neither should you.', flyTime: '1hr to George', currency: 'ZAR', bestTimeShort: 'Oct – Apr', overview: [], quickFacts: [], bestTime: { badge: 'Oct – Apr', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Knysna stay', copy: 'Lagoon view or forest retreat — Knysna stays book fast. Lock in your rate on Bly.' }, searchCity: 'Knysna' },
  { slug: 'pretoria',      name: 'Pretoria',             region: 'south-africa', regionLabel: 'South Africa', heroImage: '/images/destinations/pretoria.jpg',      heroTagline: 'Jacaranda season hits different. So does Pretoria.',              cardTagline: 'History, embassies, 70,000 jacaranda trees.', flyTime: '30min from JHB', currency: 'ZAR', bestTimeShort: 'Oct – Nov', overview: [], quickFacts: [], bestTime: { badge: 'Oct – Nov', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: "Book your Pretoria stay", copy: 'Embassy-district boutiques to Hatfield guesthouses — book direct on Bly.' }, searchCity: 'Pretoria' },
  { slug: 'winelands',     name: 'Cape Winelands',       region: 'south-africa', regionLabel: 'South Africa', heroImage: '/images/destinations/winelands.jpg',     heroTagline: 'If heaven has a wine list, it was sourced here.',                 cardTagline: 'Oak trees. Cape Dutch gables. A glass of something cold.', flyTime: '45min from CPT', currency: 'ZAR', bestTimeShort: 'Feb – Apr', overview: [], quickFacts: [], bestTime: { badge: 'Feb – Apr', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Winelands stay', copy: 'Wine farms, boutique guesthouses, vine-view cottages — book direct on Bly.' }, searchCity: 'Stellenbosch' },
  { slug: 'sun-city',      name: 'Sun City',             region: 'south-africa', regionLabel: 'South Africa', heroImage: '/images/destinations/sun-city.jpg',      heroTagline: 'Man built a palace in the Bushveld. It worked.',                 cardTagline: 'Yes, it\'s a resort. Yes, it\'s worth it.',  flyTime: '2hrs from JHB', currency: 'ZAR', bestTimeShort: 'May – Aug', overview: [], quickFacts: [], bestTime: { badge: 'May – Aug', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Sun City stay', copy: 'Palace, casino, or Pilanesberg bush — lock in your rate on Bly.' }, searchCity: 'Sun City' },
  { slug: 'drakensberg',   name: 'Drakensberg',          region: 'south-africa', regionLabel: 'South Africa', heroImage: '/images/destinations/drakensberg.jpg',   heroTagline: "The mountains that look painted. The Drakensberg.",              cardTagline: "This is what 'remote' actually feels like.",  flyTime: '3.5hrs from DBN', currency: 'ZAR', bestTimeShort: 'May – Aug', overview: [], quickFacts: [], bestTime: { badge: 'May – Aug', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Drakensberg stay', copy: 'Mountain chalets, hiking lodges, or Berg resorts — book your stay direct on Bly.' }, searchCity: 'Drakensberg' },

  // ── INTERNATIONAL ─────────────────────────────────────────────────────────

  { slug: 'dubai',      name: 'Dubai',     region: 'international', regionLabel: 'International', heroImage: '/images/destinations/dubai.jpg',     heroTagline: "Built in 40 years. Unbelievable for 40 reasons. Dubai.",        cardTagline: 'Too big to believe. Too good not to go.',    flyTime: '8hrs from JHB', currency: 'AED', bestTimeShort: 'Nov – Mar', overview: [], quickFacts: [], bestTime: { badge: 'Nov – Mar', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Dubai stay', copy: 'Downtown, Marina, or Deira — book direct on Bly, no commission, no surprise charges.' }, searchCity: 'Dubai' },
  { slug: 'thailand',   name: 'Thailand',  region: 'international', regionLabel: 'International', heroImage: '/images/destinations/thailand.jpg',  heroTagline: "Street food at midnight. Temples at dawn. Thailand at its own pace.", cardTagline: 'Every cliché is true. Go anyway.',           flyTime: '11hrs from JHB', currency: 'THB', bestTimeShort: 'Nov – Feb', overview: [], quickFacts: [], bestTime: { badge: 'Nov – Feb', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Thailand stay', copy: 'Bangkok, Chiang Mai, or beach island — book your Thailand stay direct on Bly.' }, searchCity: 'Bangkok' },
  { slug: 'mauritius',  name: 'Mauritius', region: 'international', regionLabel: 'International', heroImage: '/images/destinations/mauritius.jpg', heroTagline: "Lagoon so blue it looks wrong. It's not. Mauritius.",            cardTagline: "The Indian Ocean's most polished jewel.",    flyTime: '4hrs from JHB', currency: 'MUR', bestTimeShort: 'May – Nov', overview: [], quickFacts: [], bestTime: { badge: 'May – Nov', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Mauritius stay', copy: 'Beach villa, boutique resort, or all-inclusive — find your Mauritius stay on Bly.' }, searchCity: 'Mauritius' },
  { slug: 'zanzibar',   name: 'Zanzibar',  region: 'international', regionLabel: 'International', heroImage: '/images/destinations/zanzibar.jpg',  heroTagline: "Spice island. Turquoise water. Zanzibar at its own speed.",      cardTagline: "Stone Town's alleys and North Coast's sand.",flyTime: '8hrs from JHB', currency: 'USD', bestTimeShort: 'Jun – Oct', overview: [], quickFacts: [], bestTime: { badge: 'Jun – Oct', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Zanzibar stay', copy: 'Stone Town riad, beachfront bungalow, or spice farm retreat — find your stay on Bly.' }, searchCity: 'Zanzibar' },
  { slug: 'lisbon',     name: 'Lisbon',    region: 'international', regionLabel: 'International', heroImage: '/images/destinations/lisbon.jpg',    heroTagline: "Seven hills. Seven reasons not to leave. Lisbon.",              cardTagline: "Europe's darling. Still hasn't been ruined.", flyTime: '10.5hrs from JHB', currency: 'EUR', bestTimeShort: 'Mar – May', overview: [], quickFacts: [], bestTime: { badge: 'Mar – May', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Lisbon stay', copy: 'Alfama views, Chiado boutiques, or Belém waterfront — find your Lisbon stay on Bly.' }, searchCity: 'Lisbon' },
  { slug: 'istanbul',   name: 'Istanbul',  region: 'international', regionLabel: 'International', heroImage: '/images/destinations/istanbul.jpg',  heroTagline: "Two continents. One city. Istanbul plays by its own rules.",    cardTagline: 'The Bosphorus splits Europe and Asia.',      flyTime: '10hrs from JHB', currency: 'TRY', bestTimeShort: 'Apr – May', overview: [], quickFacts: [], bestTime: { badge: 'Apr – May', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Istanbul stay', copy: 'Sultanahmet history or Beyoğlu buzz — find your Istanbul stay on Bly.' }, searchCity: 'Istanbul' },
  { slug: 'bali',       name: 'Bali',      region: 'international', regionLabel: 'International', heroImage: '/images/destinations/bali.jpg',      heroTagline: "Rice terraces. Temple smoke. That Bali feeling you can't explain.", cardTagline: 'Everyone goes to Bali. Everyone is right.', flyTime: '11hrs from JHB', currency: 'IDR', bestTimeShort: 'May – Sep', overview: [], quickFacts: [], bestTime: { badge: 'May – Sep', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Bali stay', copy: 'Ubud jungle villa or Seminyak beach club hotel — book on Bly. No commission.' }, searchCity: 'Bali' },
  { slug: 'greece',     name: 'Greece',    region: 'international', regionLabel: 'International', heroImage: '/images/destinations/greece.jpg',    heroTagline: "The white and blue. The wine and the ruins. Greece, obviously.", cardTagline: 'Some places earn their legend.',             flyTime: '10hrs from JHB', currency: 'EUR', bestTimeShort: 'May – Jun', overview: [], quickFacts: [], bestTime: { badge: 'May – Jun', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Greece stay', copy: 'Caldera view, old town guesthouse, or beachfront Crete — find your stay on Bly.' }, searchCity: 'Athens' },
  { slug: 'london',     name: 'London',    region: 'international', regionLabel: 'International', heroImage: '/images/destinations/london.jpg',    heroTagline: "900 years of history. Also the best brunch in the world. London.", cardTagline: "The city that keeps reinventing itself.",   flyTime: '11hrs from JHB', currency: 'GBP', bestTimeShort: 'May – Sep', overview: [], quickFacts: [], bestTime: { badge: 'May – Sep', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your London stay', copy: 'Shoreditch boutique, South Bank hotel, or Notting Hill guesthouse — find your stay on Bly.' }, searchCity: 'London' },
  { slug: 'kenya',      name: 'Kenya',     region: 'international', regionLabel: 'International', heroImage: '/images/destinations/kenya.jpg',     heroTagline: "The Mara. The wildebeest. The moment nothing else matters.",    cardTagline: "Kenya doesn't do subtle. Thank goodness.",   flyTime: '4hrs from JHB', currency: 'KES', bestTimeShort: 'Jul – Oct', overview: [], quickFacts: [], bestTime: { badge: 'Jul – Oct', copy: '' }, thingsToDo: [], insiderTips: [], travelTips: [], bookNow: { heading: 'Book your Kenya stay', copy: 'Mara camp, Nairobi lodge, or Diani beachfront — find your Kenya stay on Bly.' }, searchCity: 'Nairobi' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

export const getDestinationBySlug = (slug) =>
  DESTINATIONS.find((d) => d.slug === slug) || null

export const getSADestinations = () =>
  DESTINATIONS.filter((d) => d.region === 'south-africa')

export const getInternationalDestinations = () =>
  DESTINATIONS.filter((d) => d.region === 'international')
