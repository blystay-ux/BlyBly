// api/fx-rate.js
// Vercel serverless function — proxies Frankfurter (ECB) exchange rates.
// Never exposes any secret. Cached in-process for 1 hour.
//
// Usage: GET /api/fx-rate?from=USD   → { rate: 18.72 }  (rate is 1 USD → ZAR)
//        GET /api/fx-rate?from=ZAR   → { rate: 1 }

const CACHE = {}
const TTL_MS = 60 * 60 * 1000  // 1 hour

// Frankfurter (ECB) only publishes ~30 major currencies, so AED, MUR, THB-style
// "other" currencies used to come back empty and the site fell back to showing the
// raw foreign price (e.g. "AED 982.52"). Rate lookup now tries sources in order and
// uses the first that answers, so every currency can be shown in ZAR.
async function getJson(url) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 6000)
  try {
    const r = await fetch(url, { signal: ctl.signal })
    if (!r.ok) return null
    return await r.json()
  } catch { return null } finally { clearTimeout(t) }
}

async function fetchRateToZAR(currency) {
  const code = currency.toUpperCase()
  const lower = code.toLowerCase()

  // 1. Frankfurter / ECB (majors)
  let d = await getJson(`https://api.frankfurter.app/latest?from=${code}&to=ZAR`)
  if (d?.rates?.ZAR > 0) return d.rates.ZAR

  // 2. open.er-api.com (160+ currencies, no key)
  d = await getJson(`https://open.er-api.com/v6/latest/${code}`)
  if (d?.result === 'success' && d?.rates?.ZAR > 0) return d.rates.ZAR

  // 3. fawazahmed0 currency-api via jsDelivr (static, very wide coverage)
  d = await getJson(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${lower}.json`)
  if (d?.[lower]?.zar > 0) return d[lower].zar

  return null
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')

  const { from } = req.query

  try {
    if (from) {
      const currency = from.toUpperCase()

      if (currency === 'ZAR') {
        return res.json({ from: 'ZAR', to: 'ZAR', rate: 1 })
      }

      const cached = CACHE[currency]
      if (cached && cached.expiresAt > Date.now()) {
        return res.json({ from: currency, to: 'ZAR', rate: cached.rate })
      }

      const rate = await fetchRateToZAR(currency)

      if (!rate) {
        res.setHeader('Cache-Control', 'no-store') // never cache a failed lookup
        return res.status(404).json({ error: `No ZAR rate for ${currency}` })
      }

      CACHE[currency] = { rate, expiresAt: Date.now() + TTL_MS }
      return res.json({ from: currency, to: 'ZAR', rate })

    } else {
      const SUPPORTED = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'AED', 'MUR', 'BWP', 'NAD', 'ZMW']
      const now = Date.now()
      const stale = SUPPORTED.filter(c => !CACHE[c] || CACHE[c].expiresAt <= now)

      await Promise.all(stale.map(async (currency) => {
        try {
          const rate = await fetchRateToZAR(currency)
          if (rate) CACHE[currency] = { rate, expiresAt: now + TTL_MS }
        } catch { /* skip */ }
      }))

      const rates = { ZAR: 1 }
      for (const c of SUPPORTED) {
        if (CACHE[c]) rates[c] = CACHE[c].rate
      }
      return res.json({ to: 'ZAR', rates })
    }
  } catch (err) {
    console.error('[fx-rate]', err)
    return res.status(502).json({ error: 'Could not fetch exchange rates', detail: err.message })
  }
}
