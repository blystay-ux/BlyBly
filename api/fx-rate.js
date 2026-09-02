// api/fx-rate.js
// Vercel serverless function — proxies Frankfurter (ECB) exchange rates.
// Never exposes any secret. Cached in-process for 1 hour.
//
// Usage: GET /api/fx-rate?from=USD   → { rate: 18.72 }  (rate is 1 USD → ZAR)
//        GET /api/fx-rate?from=ZAR   → { rate: 1 }

const CACHE = {}
const TTL_MS = 60 * 60 * 1000  // 1 hour

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

      const url = `https://api.frankfurter.app/latest?from=${currency}&to=ZAR`
      const fxRes = await fetch(url)
      if (!fxRes.ok) throw new Error(`Frankfurter ${fxRes.status} for ${currency}`)
      const fxData = await fxRes.json()
      const rate = fxData?.rates?.ZAR

      if (!rate) {
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
          const url = `https://api.frankfurter.app/latest?from=${currency}&to=ZAR`
          const fxRes = await fetch(url)
          if (!fxRes.ok) return
          const fxData = await fxRes.json()
          const rate = fxData?.rates?.ZAR
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
