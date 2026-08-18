// src/lib/pricing.js
//
// BLY's markup on top of HyperGuest's raw rate, for GUEST-FACING DISPLAY
// ONLY. The actual `expectedPrice` sent to HyperGuest via
// hyperguest-prebook / hyperguest-book must ALWAYS remain HyperGuest's own
// raw sell rate, completely untouched by this calculation -- marking that
// up before sending it back to HyperGuest would either cause a price
// mismatch (BN.402 error) or silently misstate what BLY owes them.
// This function is for what the GUEST sees, nothing else.
//
// Formula (confirmed 2026-08-17): guestPrice = hyperguestRate
//   + 10% commission + 1% tourism levy + 15% VAT on the full total
//   (base + commission + levy) -- NOT just on the commission.

export const COMMISSION_RATE = 0.10     // 10% BLY commission on HyperGuest's rate
export const TOURISM_LEVY_RATE = 0.01   // 1% tourism levy
export const VAT_RATE = 0.15            // 15% South African VAT, on the full total

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Takes HyperGuest's raw sell price and returns the full guest-facing
 * breakdown with BLY's commission, tourism levy, and VAT applied.
 *
 * @param {number} hyperguestAmount - HyperGuest's raw sell price (untouched, unmarked-up)
 * @param {string} currency
 * @returns {{
 *   currency: string,
 *   baseAmount: number,       // HyperGuest's raw rate -- what BLY owes them
 *   commissionAmount: number, // BLY's 10% commission
 *   levyAmount: number,       // 1% tourism levy
 *   vatAmount: number,        // 15% VAT, on (base + commission + levy)
 *   totalAmount: number       // what the guest actually sees/pays
 * }}
 */
export function calculateGuestPrice(hyperguestAmount, currency) {
  const base = Number(hyperguestAmount) || 0
  const commission = base * COMMISSION_RATE
  const levy = base * TOURISM_LEVY_RATE
  const vat = (base + commission + levy) * VAT_RATE
  const total = base + commission + levy + vat

  return {
    currency,
    baseAmount: round2(base),
    commissionAmount: round2(commission),
    levyAmount: round2(levy),
    vatAmount: round2(vat),
    totalAmount: round2(total),
  }
}
