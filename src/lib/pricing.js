// src/lib/pricing.js
//
// BLY's markup on top of HyperGuest's raw rate, for GUEST-FACING DISPLAY
// ONLY. The actual `expectedPrice` sent to HyperGuest via
// hyperguest-prebook / hyperguest-book must ALWAYS remain HyperGuest's own
// raw sell rate, completely untouched by this calculation -- marking that
// up before sending it back to HyperGuest would either cause a price
// mismatch (BN.402 error) or silently misstate what BLY owes them. Every
// booking function reads `sell.price` / `sell.currency` directly from
// HyperGuest's own response for expectedPrice -- never a value from here.
//
// Formula: guestPrice = hyperguestRate + 10% commission + 1% tourism levy
//   + 15% VAT on the full total (base + commission + levy).
//
// Guest-facing display is simplified to 3 lines:
//   "Bly. Rate"    = hyperguestRate + 10% commission, combined into one figure
//   "VAT"          = 15% of (base + commission + levy)
//   "Tourism Levy" = 1% of hyperguestRate
//   Total          = Bly. Rate + VAT + Tourism Levy

export const COMMISSION_RATE = 0.10     // 10% BLY commission on HyperGuest's rate
export const TOURISM_LEVY_RATE = 0.01   // 1% tourism levy
export const VAT_RATE = 0.15            // 15% South African VAT, on the full total

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Takes HyperGuest's raw sell price and returns the guest-facing breakdown.
 *
 * @param {number} hyperguestAmount - HyperGuest's raw sell price (untouched, unmarked-up)
 * @param {string} currency
 * @returns {{
 *   currency: string,
 *   baseAmount: number,        // HyperGuest's raw rate -- what BLY owes them (not shown to guest)
 *   commissionAmount: number,  // BLY's 10% commission (not shown to guest separately)
 *   blyRateAmount: number,     // baseAmount + commissionAmount, shown to guest as "Bly. Rate"
 *   levyAmount: number,        // 1% tourism levy, shown as "Tourism Levy"
 *   vatAmount: number,         // 15% VAT on (base + commission + levy), shown as "VAT"
 *   totalAmount: number        // Bly. Rate + VAT + Tourism Levy -- what the guest pays
 * }}
 */
export function calculateGuestPrice(hyperguestAmount, currency) {
  const base = Number(hyperguestAmount) || 0
  const commission = base * COMMISSION_RATE
  const blyRate = base + commission
  const levy = base * TOURISM_LEVY_RATE
  const vat = (base + commission + levy) * VAT_RATE
  const total = blyRate + levy + vat

  return {
    currency,
    baseAmount: round2(base),
    commissionAmount: round2(commission),
    blyRateAmount: round2(blyRate),
    levyAmount: round2(levy),
    vatAmount: round2(vat),
    totalAmount: round2(total),
  }
}
