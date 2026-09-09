import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

// ── Event data ────────────────────────────────────────────────────────────────
const EVENTS = [
  // FESTIVALS & CULTURE
  { id: 1, name: 'Cape Town Minstrel Carnival', sub: 'Tweede Nuwe Jaar', date: '5 Jan 2026', month: 1, year: 2026, city: 'Cape Town', area: 'Western Cape', category: 'Festival', priority: 'LARGE', slug: 'accommodation-cape-town-minstrel-carnival-2026', icon: '🎭', desc: 'Iconic New Year cultural parade through the Bo-Kaap. Target domestic travellers needing last-minute January accommodation.' },
  { id: 2, name: 'Cape Town Carnival', sub: 'Human Rights Day', date: '21 Mar 2026', month: 3, year: 2026, city: 'Cape Town', area: 'Western Cape', category: 'Festival', priority: 'LARGE', slug: 'accommodation-cape-town-carnival-2026', icon: '🎪', desc: 'Free outdoor event at Green Point with huge footfall. Promote Cape Town stays around Human Rights Day weekend.' },
  { id: 3, name: 'KKNK', sub: 'Klein Karoo Nasionale Kunstefees', date: '28 Mar – 4 Apr 2026', month: 3, year: 2026, city: 'Oudtshoorn', area: 'Western Cape', category: 'Festival', priority: 'LARGE', slug: 'accommodation-kknk-oudtshoorn-2026', icon: '🎵', desc: "SA's biggest Afrikaans arts festival. Build a Garden Route + KKNK road-trip package for Joburg & Cape Town travellers." },
  { id: 4, name: 'Montreux Jazz Franschhoek', sub: '', date: 'Mar 2026', month: 3, year: 2026, city: 'Franschhoek', area: 'Western Cape', category: 'Festival', priority: 'LARGE', slug: 'accommodation-montreux-jazz-franschhoek-2026', icon: '🎷', desc: 'Sold-out premium wine-country jazz event. High average booking value audience. Package with Winelands boutique guesthouses.' },
  { id: 5, name: 'SA Fashion Week', sub: 'Summer Edition', date: 'Mar 2026', month: 3, year: 2026, city: 'Johannesburg', area: 'Gauteng', category: 'Festival', priority: 'MEDIUM', slug: 'accommodation-sa-fashion-week-march-2026', icon: '👗', desc: 'Fashion & lifestyle audience. Sandton accommodation demand peaks during show days.' },
  { id: 6, name: 'Splashy Fen Music Festival', sub: '', date: '2–6 Apr 2026', month: 4, year: 2026, city: 'Himeville', area: 'KwaZulu-Natal', category: 'Festival', priority: 'MEDIUM', slug: 'accommodation-splashy-fen-2026', icon: '🎸', desc: 'Loyal SA music festival audience. Target Durban & Joburg travellers needing Drakensberg accommodation.' },
  { id: 7, name: 'AfrikaBurn', sub: '', date: '26 Apr – 2 May 2027', month: 4, year: 2027, city: 'Tankwa Karoo', area: 'Northern Cape', category: 'Festival', priority: 'LARGE', slug: 'accommodation-afrikaburn-2027', icon: '🔥', desc: 'Growing international attendance. Pre/post-burn accommodation in Cape Town or Ceres — high demand window.' },
  { id: 8, name: 'Franschhoek Literary Festival', sub: '', date: '15–18 May 2026', month: 5, year: 2026, city: 'Franschhoek', area: 'Western Cape', category: 'Festival', priority: 'MEDIUM', slug: 'accommodation-franschhoek-literary-festival-2026', icon: '📚', desc: 'Premium wine-country audience with high average booking value. Ideal for direct outreach to FLF newsletter subscribers.' },
  { id: 9, name: 'National Arts Festival', sub: '', date: '25 Jun – 5 Jul 2026', month: 6, year: 2026, city: 'Makhanda', area: 'Eastern Cape', category: 'Festival', priority: 'LARGE', slug: 'accommodation-national-arts-festival-makhanda-2026', icon: '🎨', desc: "Africa's largest arts festival — 70 000+ visitors. Direct outreach to CEO Monica Newton for official accommodation listing." },
  { id: 10, name: 'Knysna Oyster Festival', sub: '', date: '3–12 Jul 2026', month: 7, year: 2026, city: 'Knysna', area: 'Garden Route', category: 'Festival', priority: 'LARGE', slug: 'accommodation-knysna-oyster-festival-2026', icon: '🦪', desc: '50 000+ visitors. Pitch as official accommodation partner early — high demand, limited supply in July.' },
  { id: 11, name: 'Durban International Film Festival', sub: '', date: '16–27 Jul 2026', month: 7, year: 2026, city: 'Durban', area: 'KwaZulu-Natal', category: 'Festival', priority: 'MEDIUM', slug: 'accommodation-durban-international-film-festival-2026', icon: '🎬', desc: 'Film industry travellers + culture tourists. Build Durban accommodation packages around festival venues.' },
  { id: 12, name: 'Oppikoppi Music Festival', sub: '', date: 'Aug 2026 (TBC)', month: 8, year: 2026, city: 'Northam', area: 'Limpopo', category: 'Festival', priority: 'LARGE', slug: 'accommodation-oppikoppi-2026', icon: '🤘', desc: "30 000+ attendees. SA's most legendary bush festival. Target pre-festival night stays in Pretoria." },
  { id: 13, name: 'Hermanus Whale Festival', sub: '', date: '24–27 Sep 2026 (TBC)', month: 9, year: 2026, city: 'Hermanus', area: 'Western Cape', category: 'Festival', priority: 'LARGE', slug: 'accommodation-hermanus-whale-festival-2026', icon: '🐋', desc: '50 000+ visitors in peak October season. CT–Hermanus weekend package. Contact for travel partner listing.' },
  { id: 14, name: 'Rocking the Daisies', sub: '', date: '2–4 Oct 2026', month: 10, year: 2026, city: 'Darling', area: 'Western Cape', category: 'Festival', priority: 'MEDIUM', slug: 'accommodation-rocking-the-daisies-2026', icon: '🌼', desc: "SA's biggest eco/music festival. Cape Town pre/post-festival stays. Strong young adult audience — great social media potential." },
  { id: 15, name: 'Macufe', sub: 'Mangaung African Cultural Festival', date: '1–10 Oct 2026 (TBC)', month: 10, year: 2026, city: 'Bloemfontein', area: 'Free State', category: 'Festival', priority: 'LARGE', slug: 'accommodation-macufe-bloemfontein-2026', icon: '🥁', desc: "One of SA's biggest cultural festivals — 200 000+ attendees. Bloemfontein is under-served accommodation market. High BLY. opportunity." },
  { id: 16, name: 'SA Fashion Week', sub: 'Spring Edition', date: 'Oct 2026', month: 10, year: 2026, city: 'Johannesburg', area: 'Gauteng', category: 'Festival', priority: 'MEDIUM', slug: 'accommodation-sa-fashion-week-october-2026', icon: '👗', desc: 'Fashion & lifestyle audience. Sandton accommodation demand peaks. Contact Ann Nurock for media partner or travel listing.' },
  { id: 17, name: 'Cape Town International Jazz Festival', sub: '', date: '27–28 Mar 2027', month: 3, year: 2027, city: 'Cape Town', area: 'Western Cape', category: 'Festival', priority: 'MEGA', slug: 'accommodation-cape-town-jazz-festival-2027', icon: '🎺', desc: '40 000+ attendees from across Africa & abroad. Jazz Weekend package — hotel + transfer. Pitch espAfrika for official accommodation partner listing.' },
  // SPORT
  { id: 18, name: 'Sun Met', sub: 'Cape Town', date: '31 Jan 2026', month: 1, year: 2026, city: 'Cape Town', area: 'Western Cape', category: 'Sport', priority: 'LARGE', slug: 'accommodation-sun-met-cape-town-2026', icon: '🏇', desc: "SA's premier horse racing event. Dress-to-impress audience with high ABV. Cape Town accommodation fills fast." },
  { id: 19, name: 'Design Indaba', sub: '', date: '25 Feb – Mar 2026', month: 2, year: 2026, city: 'Cape Town', area: 'Western Cape', category: 'Business', priority: 'LARGE', slug: 'accommodation-design-indaba-cape-town-2026', icon: '✏️', desc: '7 000+ creative professionals. One of the world\'s most inspiring design conferences. Cape Town accommodation in high demand.' },
  { id: 20, name: 'Absa Cape Epic', sub: 'Mountain Bike Race', date: 'Mar 2026', month: 3, year: 2026, city: 'Western Cape', area: 'Western Cape', category: 'Sport', priority: 'MEGA', slug: 'accommodation-cape-epic-2026', icon: '🚵', desc: "The world's greatest mountain bike stage race. 35 000 spectators. International riders need accommodation across the Western Cape route." },
  { id: 21, name: 'Cape Town Marathon', sub: '', date: 'Mar 2026', month: 3, year: 2026, city: 'Cape Town', area: 'Western Cape', category: 'Sport', priority: 'LARGE', slug: 'accommodation-cape-town-marathon-2026', icon: '🏃', desc: "20 000+ runners. Cape Town accommodation fills well in advance of the world's most scenic marathon." },
  { id: 22, name: 'Two Oceans Marathon', sub: '', date: '18 Apr 2026 (Good Friday)', month: 4, year: 2026, city: 'Cape Town', area: 'Western Cape', category: 'Sport', priority: 'MEGA', slug: 'accommodation-two-oceans-marathon-2026', icon: '🏅', desc: '26 000+ runners — ultra and half marathon. World-class event. Cape Town stays book up months ahead.' },
  { id: 23, name: 'Rand Show', sub: '', date: '3–13 Apr 2026', month: 4, year: 2026, city: 'Johannesburg', area: 'Gauteng', category: 'Festival', priority: 'LARGE', slug: 'accommodation-rand-show-johannesburg-2026', icon: '🎡', desc: '200 000+ visitors. SA\'s biggest consumer exhibition. Nasrec accommodation demand is consistently high.' },
  { id: 24, name: 'WTM Africa', sub: 'World Travel Market', date: '7–9 Apr 2026', month: 4, year: 2026, city: 'Cape Town', area: 'Western Cape', category: 'Business', priority: 'LARGE', slug: 'accommodation-wtm-africa-cape-town-2026', icon: '✈️', desc: 'The continent\'s most important travel trade show. Cape Town accommodation for wholesale buyers and travel agents.' },
  { id: 25, name: 'Comrades Marathon', sub: '', date: '14 Jun 2026', month: 6, year: 2026, city: 'Durban', area: 'KwaZulu-Natal', category: 'Sport', priority: 'MEGA', slug: 'accommodation-comrades-marathon-2026', icon: '🏆', desc: "World's oldest ultra-marathon — 25 000+ runners. Durban accommodation for Comrades is a standout BLY. opportunity. Contact Comrades Marathon Association." },
  { id: 26, name: 'ICC Cricket (Cape Town)', sub: '', date: 'Feb–Mar 2026', month: 2, year: 2026, city: 'Cape Town', area: 'Western Cape', category: 'Sport', priority: 'MEGA', slug: 'accommodation-icc-cricket-cape-town-2026', icon: '🏏', desc: 'Biggest SA cricket event. 30 000+ fans at Newlands. Contact Kirsty du Toit (Cricket SA) for preferred partner status.' },
  { id: 27, name: 'Hollywoodbets Durban July', sub: '', date: '4 Jul 2026', month: 7, year: 2026, city: 'Durban', area: 'KwaZulu-Natal', category: 'Sport', priority: 'LARGE', slug: 'accommodation-durban-july-2026', icon: '🎩', desc: "SA's premier horse racing and social event. Durban accommodation fills in June for July race day. High-fashion audience." },
  { id: 28, name: 'SA vs All Blacks Rugby', sub: 'Rugby Championship', date: 'Aug 2026', month: 8, year: 2026, city: 'Cape Town', area: 'Western Cape', category: 'Sport', priority: 'LARGE', slug: 'accommodation-sa-vs-all-blacks-rugby-2026', icon: '🏉', desc: 'Massive domestic and international demand. Cape Town Sevens and Test match accommodation. Partner with SA Rugby Travel.' },
  { id: 29, name: 'SA vs Australia Rugby', sub: 'Rugby Championship', date: 'Sep 2026', month: 9, year: 2026, city: 'Cape Town', area: 'Western Cape', category: 'Sport', priority: 'LARGE', slug: 'accommodation-sa-vs-australia-rugby-2026', icon: '🏉', desc: 'Cape Town rugby accommodation demand is high during Rugby Championship rounds. Package with city centre stays.' },
  { id: 30, name: 'Nedbank Golf Challenge', sub: 'Sun City', date: 'Nov 2026', month: 11, year: 2026, city: 'Sun City', area: 'North West', category: 'Sport', priority: 'LARGE', slug: 'accommodation-nedbank-golf-challenge-2026', icon: '⛳', desc: "SA's biggest golf event. Sun City and surrounding accommodation fills for the DP World Tour stop." },
  { id: 31, name: 'Joburg Open', sub: 'DP World Tour', date: 'Nov 2026', month: 11, year: 2026, city: 'Johannesburg', area: 'Gauteng', category: 'Sport', priority: 'MEDIUM', slug: 'accommodation-joburg-open-golf-2026', icon: '⛳', desc: 'DP World Tour event in Johannesburg. Corporate golf audience needs city and surrounding accommodation.' },
  { id: 32, name: 'British & Irish Lions Tour', sub: '', date: 'Jun 2027', month: 6, year: 2027, city: 'Cape Town', area: 'Western Cape', category: 'Sport', priority: 'LARGE', slug: 'accommodation-british-irish-lions-tour-south-africa-2027', icon: '🦁', desc: 'Lions tours bring thousands of UK/Ireland visitors. Highest demand for Cape Town accommodation. Act now — long lead time.' },
  { id: 33, name: 'Absa Cape Epic', sub: 'Mountain Bike Race', date: 'Mar 2027', month: 3, year: 2027, city: 'Western Cape', area: 'Western Cape', category: 'Sport', priority: 'MEGA', slug: 'accommodation-cape-epic-2027', icon: '🚵', desc: "The world's greatest mountain bike stage race. International riders need accommodation across the Western Cape route." },
  { id: 34, name: 'Two Oceans Marathon', sub: '', date: 'Apr 2027 (Good Friday)', month: 4, year: 2027, city: 'Cape Town', area: 'Western Cape', category: 'Sport', priority: 'MEGA', slug: 'accommodation-two-oceans-marathon-2027', icon: '🏅', desc: '26 000+ runners — ultra and half marathon. Book accommodation months in advance.' },
  // BUSINESS
  { id: 35, name: 'Mining Indaba', sub: '', date: '8–11 Feb 2027', month: 2, year: 2027, city: 'Cape Town', area: 'Western Cape', category: 'Business', priority: 'MEGA', slug: 'accommodation-mining-indaba-cape-town-2027', icon: '⛏️', desc: '6 000+ global mining executives. The single biggest B2B accommodation opportunity for BLY. in Cape Town. Act early — rooms book 6 months out.' },
  { id: 36, name: 'Meetings Africa', sub: '', date: 'Feb 2027', month: 2, year: 2027, city: 'Johannesburg', area: 'Gauteng', category: 'Business', priority: 'LARGE', slug: 'accommodation-meetings-africa-johannesburg-2027', icon: '🤝', desc: "Africa's largest business events trade show. B2B leads source. Exhibit at Meetings Africa 2027 — top activity for B2B this year." },
  { id: 37, name: 'Tourism Indaba', sub: '', date: 'May 2027', month: 5, year: 2027, city: 'Durban', area: 'KwaZulu-Natal', category: 'Business', priority: 'LARGE', slug: 'accommodation-tourism-indaba-durban-2027', icon: '🌍', desc: "Africa's biggest tourism trade event. Exhibiting at Tourism Indaba 2027 will generate strong B2B leads." },
  { id: 38, name: 'Africa Tech Week', sub: '', date: 'Oct 2026', month: 10, year: 2026, city: 'Cape Town', area: 'Western Cape', category: 'Business', priority: 'LARGE', slug: 'accommodation-africa-tech-week-cape-town-2026', icon: '💻', desc: '15 000+ tech founders and investors from 60+ countries. Cape Town accommodation in high demand during event week.' },
  { id: 39, name: 'Comic Con Africa', sub: '', date: 'Sep 2026', month: 9, year: 2026, city: 'Johannesburg', area: 'Gauteng', category: 'Festival', priority: 'LARGE', slug: 'accommodation-comic-con-africa-johannesburg-2026', icon: '🦸', desc: '70 000+ pop culture fans. Joburg accommodation demand around Gallagher Estate. Sell packages aimed at young adult audience.' },
  { id: 40, name: 'Africa Health', sub: '', date: 'Oct 2026', month: 10, year: 2026, city: 'Johannesburg', area: 'Gauteng', category: 'Business', priority: 'LARGE', slug: 'accommodation-africa-health-johannesburg-2026', icon: '🏥', desc: '7 000+ healthcare professionals. Leading health conference and exhibition in Africa. Joburg conference accommodation.' },
  { id: 41, name: 'Decorex', sub: '', date: 'Apr 2026', month: 4, year: 2026, city: 'Cape Town', area: 'Western Cape', category: 'Business', priority: 'LARGE', slug: 'accommodation-decorex-cape-town-2026', icon: '🛋️', desc: 'Interior design and home décor trade show at CTICC. Architects and procurement buyers attend. Cape Town accommodation.' },
  // GLOBAL SPORT
  { id: 42, name: 'FIFA World Cup 2026', sub: 'SA Fan Travel', date: 'Jun–Jul 2026', month: 6, year: 2026, city: 'Johannesburg', area: 'Gauteng', category: 'Global', priority: 'MEGA', slug: 'accommodation-south-africa-fifa-world-cup-2026-travel', icon: '⚽', desc: 'Fan zones in CT, JHB, DUR. SA fans travelling to USA/Mexico/Canada — pre-departure Joburg or Cape Town stopovers. Package flights + accommodation.' },
  { id: 43, name: 'ICC T20 Cricket', sub: 'SA Fans Travelling', date: 'Jun 2026', month: 6, year: 2026, city: 'Johannesburg', area: 'Gauteng', category: 'Global', priority: 'MEGA', slug: 'accommodation-sa-fans-icc-t20-2026', icon: '🏏', desc: 'SA fans travelling to India. Pre-departure accommodation in Joburg or Cape Town — reliable demand for departure-point stays.' },
  { id: 44, name: 'Rugby World Cup 2027', sub: 'SA Fans Travelling', date: 'Sep 2027', month: 9, year: 2027, city: 'Johannesburg', area: 'Gauteng', category: 'Global', priority: 'MEGA', slug: 'accommodation-sa-fans-rugby-world-cup-2027', icon: '🏉', desc: 'Springboks in Melbourne/Australia. SA fans flying out — 3-night SA city stopover before long-haul. Build "SA Fans" package.' },
  { id: 45, name: 'LA Olympics 2028', sub: 'SA Athletes & Fans', date: '14 Jul – 9 Aug 2028', month: 7, year: 2028, city: 'Johannesburg', area: 'Gauteng', category: 'Global', priority: 'LARGE', slug: 'accommodation-la-olympics-south-africa-2028', icon: '🥇', desc: 'SA athletes and fans. Joburg and Cape Town pre-departure stays. Start building "Olympics" content now for long-term SEO.' },
  { id: 46, name: 'Volvo Ocean Race', sub: 'Cape Town Stopover', date: '2026/2027', month: 1, year: 2027, city: 'Cape Town', area: 'Western Cape', category: 'Sport', priority: 'MEDIUM', slug: 'accommodation-volvo-ocean-race-cape-town', icon: '⛵', desc: 'Brings international sailing community and spectators. Watch for next race schedule — high-value international visitors.' },
  { id: 47, name: 'Springboks Away Tests', sub: 'Rugby Championship', date: 'Jul–Aug 2026', month: 7, year: 2026, city: 'Johannesburg', area: 'Gauteng', category: 'Sport', priority: 'MEDIUM', slug: 'accommodation-springboks-away-tests-2026', icon: '🏉', desc: 'SA rugby fans who travel for away tests need pre-departure accommodation. Joburg/Cape Town stopovers before long-haul flights.' },
  // INTERNATIONAL TRADE
  { id: 48, name: 'Arabian Travel Market', sub: 'Dubai', date: '5–8 May 2026', month: 5, year: 2026, city: 'Dubai', area: 'International', category: 'Business', priority: 'LARGE', slug: 'south-africa-travel-arabian-travel-market-2026', icon: '🌐', desc: 'One of the biggest travel trade shows globally. BLY. should exhibit to reach GCC travel agents selling SA.' },
  { id: 49, name: 'WTM London', sub: 'World Travel Market', date: '3–5 Nov 2026', month: 11, year: 2026, city: 'London', area: 'International', category: 'Business', priority: 'LARGE', slug: 'south-africa-travel-wtm-london-2026', icon: '🌐', desc: 'Key for BLY. to meet UK/Europe OTAs and travel agents. Major OTAs actively recruit SA accommodation partners here.' },
  { id: 50, name: 'ITB Berlin', sub: '', date: 'Mar 2027', month: 3, year: 2027, city: 'Berlin', area: 'International', category: 'Business', priority: 'LARGE', slug: 'south-africa-travel-itb-berlin-2027', icon: '🌐', desc: "World's largest travel trade fair. Highest-ROI European trade show for a South African travel brand." },
]

const CATEGORIES = ['All', 'Festival', 'Sport', 'Business', 'Global']
const CITIES = ['All', 'Cape Town', 'Johannesburg', 'Durban', 'Knysna', 'Oudtshoorn', 'Franschhoek', 'Hermanus', 'Bloemfontein', 'Sun City', 'Northam', 'Makhanda', 'International']
const PRIORITIES = ['All', 'MEGA', 'LARGE', 'MEDIUM']

const PRIORITY_STYLE = {
  MEGA:   { bg: '#fff0f2', color: '#c8001e', label: 'MEGA' },
  LARGE:  { bg: '#fff7ed', color: '#c2570a', label: 'LARGE' },
  MEDIUM: { bg: '#f0f9ff', color: '#0369a1', label: 'MEDIUM' },
}

const s = {
  page: { minHeight: '100vh', background: '#F8F7F5', paddingBottom: 80 },
  hero: {
    background: '#1a1a2e', color: '#fff',
    padding: '64px 40px 56px', textAlign: 'center',
  },
  heroEyebrow: {
    fontSize: 11, fontWeight: 800, letterSpacing: '0.18em',
    color: '#ef4056', textTransform: 'uppercase', marginBottom: 14,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 800,
    fontSize: 'clamp(32px, 5vw, 54px)', letterSpacing: '-0.04em',
    lineHeight: 1.1, marginBottom: 16,
  },
  heroSub: { fontSize: 16, color: '#aaa', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 },
  dot: { color: '#ef4056' },
  body: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  filterBar: {
    background: '#fff', borderRadius: 20,
    padding: '20px 24px', margin: '32px 0 28px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center',
  },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 160px' },
  filterLabel: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa' },
  filterSelect: {
    padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e0db',
    fontSize: 13, fontFamily: 'var(--font-body)', color: '#1a1a2e',
    background: '#fff', cursor: 'pointer', outline: 'none',
  },
  count: { fontSize: 13, color: '#aaa', marginBottom: 20 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20,
  },
  card: {
    background: '#fff', borderRadius: 18,
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    padding: '22px 24px', display: 'flex', flexDirection: 'column',
    transition: 'box-shadow 0.15s, transform 0.15s',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  icon: { fontSize: 28, lineHeight: 1 },
  pill: (p) => ({
    display: 'inline-block', borderRadius: 99,
    padding: '3px 10px', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
    background: PRIORITY_STYLE[p].bg, color: PRIORITY_STYLE[p].color,
  }),
  cat: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
    color: '#aaa', marginBottom: 4,
  },
  name: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
    letterSpacing: '-0.03em', color: '#1a1a2e', lineHeight: 1.15, marginBottom: 2,
  },
  sub: { fontSize: 12, color: '#aaa', marginBottom: 8 },
  meta: { display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  metaItem: { fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 },
  desc: { fontSize: 13, color: '#555', lineHeight: 1.55, flex: 1, marginBottom: 16 },
  cta: {
    marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#1a1a2e', color: '#fff', borderRadius: 99,
    padding: '9px 18px', fontSize: 13, fontWeight: 700,
    textDecoration: 'none', alignSelf: 'flex-start',
    fontFamily: 'var(--font-display)',
  },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#aaa', fontSize: 15 },
  schemaNote: {
    background: '#fff', borderRadius: 16, padding: '20px 24px',
    marginTop: 40, borderLeft: '4px solid #ef4056',
    fontSize: 13, color: '#666', lineHeight: 1.6,
  },
}

export default function EventsCalendar() {
  const [cat,      setCat]      = useState('All')
  const [city,     setCity]     = useState('All')
  const [priority, setPriority] = useState('All')
  const [search,   setSearch]   = useState('')

  const filtered = useMemo(() => {
    return EVENTS.filter(e => {
      if (cat      !== 'All' && e.category !== cat)                      return false
      if (city     !== 'All' && e.city     !== city)                     return false
      if (priority !== 'All' && e.priority !== priority)                 return false
      if (search) {
        const q = search.toLowerCase()
        if (!e.name.toLowerCase().includes(q) && !e.city.toLowerCase().includes(q) && !e.desc.toLowerCase().includes(q)) return false
      }
      return true
    }).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
  }, [cat, city, priority, search])

  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroEyebrow}>South Africa &amp; Beyond</div>
        <h1 style={s.heroTitle}>
          Events Calendar<span style={s.dot}>.</span>
        </h1>
        <p style={s.heroSub}>
          50+ events. Every major festival, race, conference and sporting moment —
          with BLY. accommodation for each one.
        </p>
      </div>

      <div style={s.body}>
        {/* Filters */}
        <div style={s.filterBar}>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Search</div>
            <input
              style={{ ...s.filterSelect, minWidth: 180 }}
              placeholder="Event name or city…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Category</div>
            <select style={s.filterSelect} value={cat} onChange={e => setCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>City</div>
            <select style={s.filterSelect} value={city} onChange={e => setCity(e.target.value)}>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Priority</div>
            <select style={s.filterSelect} value={priority} onChange={e => setPriority(e.target.value)}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          {(cat !== 'All' || city !== 'All' || priority !== 'All' || search) && (
            <button
              style={{ ...s.filterSelect, border: 'none', color: '#ef4056', cursor: 'pointer', fontWeight: 700, fontSize: 12, flexShrink: 0 }}
              onClick={() => { setCat('All'); setCity('All'); setPriority('All'); setSearch('') }}
            >
              Clear filters
            </button>
          )}
        </div>

        <div style={s.count}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={s.empty}>No events match your filters.</div>
        ) : (
          <div style={s.grid}>
            {filtered.map(e => (
              <div key={e.id} style={s.card}>
                <div style={s.cardTop}>
                  <span style={s.icon}>{e.icon}</span>
                  <span style={s.pill(e.priority)}>{e.priority}</span>
                </div>
                <div style={s.cat}>{e.category}</div>
                <div style={s.name}>{e.name}</div>
                {e.sub && <div style={s.sub}>{e.sub}</div>}
                <div style={s.meta}>
                  <span style={s.metaItem}>📅 {e.date}</span>
                  <span style={s.metaItem}>📍 {e.city}</span>
                </div>
                <div style={s.desc}>{e.desc}</div>
                <Link to={`/accommodation/${e.slug}`} style={s.cta}>
                  Find accommodation →
                </Link>
              </div>
            ))}
          </div>
        )}

        <div style={s.schemaNote}>
          <strong>SEO note:</strong> Each "Find accommodation" link goes to a dedicated landing page for that event — optimised for searches like "accommodation {'{'}event name{'}'} {'{'}year{'}'}". Pages include Event Schema markup so Google shows rich result cards. Publish each page before the event is announced to outrank Booking.com on long-tail searches.
        </div>
      </div>
    </div>
  )
}
