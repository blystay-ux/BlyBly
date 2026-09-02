// src/lib/pricing.js
//
// BLY's commission on top of HyperGuest's raw rates, for GUEST-FACING
// DISPLAY ONLY. The actual `expectedPrice` sent to HyperGuest via
// hyperguest-prebook / hyperguest-book must ALWAYS remain HyperGuest's own
// Net rate, completely untouched by this calculation (enforced directly
// in HotelDetail.jsx / Checkout.jsx, not here).
//
// PUBLIC pricing (confirmed 2026-08-20):
//   - If Net and Sell differ, HyperGuest already applied its own markup --
//     use Sell as-is, no additional BLY commission.
//   - If Net and Sell are the same, HyperGuest applied no markup -- BLY
//     adds its own 10% on top of Sell in that case.
//
// BLY INSIDERS pricing (added 2026-08-20): a logged-in, active Bly
// Insiders member always gets Net + 3%, regardless of the Net/Sell
// relationship -- a flat, simpler, cheaper rate as their membership perk.
// Insider status is checked once globally in AuthContext.jsx
// (useAuth().isInsider) and passed into this function by the caller.

export const COMMISSION_RATE = 0.10         // public rate: 10% when Net === Sell
export const INSIDER_COMMISSION_RATE = 0.03 // Bly Insiders rate: flat 3% on Net, always
const SAME_RATE_TOLERANCE = 0.01            // treat net/sell as "the same" if they differ by less than 1 cent (floating point safety)

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * @param {number} netAmount  - HyperGuest's Net rate
 * @param {number} sellAmount - HyperGuest's Sell rate
 * @param {string} currency
 * @param {boolean} isInsider - true if the current user is a logged-in, active Bly Insiders member
 * @returns {{
 *   currency: string,
 *   netAmount: number,
 *   sellAmount: number,
 *   markupApplied: boolean, // true if BLY added its own commission (either the 10% net===sell case, or the Insider 3%)
 *   isInsiderRate: boolean, // true if the Insider formula was used
 *   totalAmount: number     // what the guest sees/pays
 * }}
 */
export function calculateGuestPrice(netAmount, sellAmount, currency, isInsider = false) {
  const net = Number(netAmount) || 0
  const sell = Number(sellAmount) || 0

  if (isInsider) {
    const total = net * (1 + INSIDER_COMMISSION_RATE)
    return {
      currency,
      netAmount: round2(net),
      sellAmount: round2(sell),
      markupApplied: true,
      isInsiderRate: true,
      totalAmount: round2(total),
    }
  }

  const ratesAreEqual = Math.abs(net - sell) < SAME_RATE_TOLERANCE
  const total = ratesAreEqual ? sell * (1 + COMMISSION_RATE) : sell

  return {
    currency,
    netAmount: round2(net),
    sellAmount: round2(sell),
    markupApplied: ratesAreEqual,
    isInsiderRate: false,
    totalAmount: round2(total),
  }
}

// ─── ZAR Conversion ──────────────────────────────────────────────────────────

/** 3% buffer added on top of the live exchange rate to absorb FX fluctuations */
export const FX_BUFFER = 0.03

/** In-memory FX cache: { [currency]: { rate: number, expiresAt: number } } */
const _fxCache = {}
const FX_TTL = 60 * 60 * 1000  // 1 hour

/**
 * Fetch the 1-unit → ZAR exchange rate for a given currency.
 * Calls /api/fx-rate proxy (server-side, no key exposed).
 * Returns null if rate cannot be fetched — callers fall back to original currency.
 */
export async function getZARRate(currency) {
  if (!currency || currency.toUpperCase() === 'ZAR') return 1

  const code = currency.toUpperCase()
  const now  = Date.now()

  const cached = _fxCache[code]
  if (cached && cached.expiresAt > now) return cached.rate

  try {
    const res  = await fetch(`/api/fx-rate?from=${code}`)
    if (!res.ok) return null
    const data = await res.json()
    const rate = data?.rate

    if (typeof rate === 'number' && rate > 0) {
      _fxCache[code] = { rate, expiresAt: now + FX_TTL }
      return rate
    }
    return null
  } catch (err) {
    console.warn(`[pricing] Could not fetch ZAR rate for ${code}:`, err)
    return null
  }
}

/**
 * Prefetch ZAR rates for multiple currencies in one pass.
 * Call this once when search results arrive so per-card renders are instant.
 * Returns a map: { USD: 18.72, EUR: 20.1, ZAR: 1, ... }
 */
export async function prefetchZARRates(currencies) {
  const unique = [...new Set((currencies || []).map(c => c?.toUpperCase()).filter(Boolean))]
  const entries = await Promise.all(unique.map(async c => [c, await getZARRate(c)]))
  return Object.fromEntries(entries.filter(([, r]) => r != null))
}

/**
 * Convert an amount in any currency to ZAR, adding the 3% FX buffer.
 */
export function convertToZAR(amount, zarRate) {
  // No FX buffer when already ZAR (rate === 1)
  if (zarRate === 1) return Math.round((amount + Number.EPSILON) * 100) / 100
  return Math.round((amount * zarRate * (1 + FX_BUFFER) + Number.EPSILON) * 100) / 100
}

/**
 * All-in-one: calculateGuestPrice + ZAR conversion.
 * Pass zarRate from prefetchZARRates result; pass null if unavailable.
 */
export function calculateGuestPriceZAR(netAmount, sellAmount, currency, isInsider = false, zarRate = null) {
  const base = calculateGuestPrice(netAmount, sellAmount, currency, isInsider)
  const totalAmountZAR = zarRate != null ? convertToZAR(base.totalAmount, zarRate) : null
  return { ...base, totalAmountZAR, zarRate }
}

/**
 * Format a ZAR price for display: "ZAR 3,065.20"
 * Falls back to the original currency if ZAR conversion is unavailable.
 */
export function formatDisplayPrice(priceResult) {
  const { totalAmountZAR, totalAmount, currency } = priceResult
  if (totalAmountZAR != null) {
    return `ZAR ${totalAmountZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${currency} ${totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
