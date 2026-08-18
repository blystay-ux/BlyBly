// src/lib/pricing.js
//
// BLY's commission on top of HyperGuest's raw rate, for GUEST-FACING
// DISPLAY ONLY. The actual `expectedPrice` sent to HyperGuest via
// hyperguest-prebook / hyperguest-book must ALWAYS remain HyperGuest's own
// raw sell rate, completely untouched by this calculation.
//
// CONFIRMED 2026-08-17: HyperGuest's rate already includes VAT and the
// tourism levy -- they are NOT added again on top. The guest-facing price
// is simply: HyperGuest's rate + 10% commission. That's the entire
// calculation. Nothing else gets added.

export const COMMISSION_RATE = 0.10 // 10% BLY commission on HyperGuest's rate (VAT/levy already included in their rate)

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Takes HyperGuest's raw sell price (VAT + tourism levy already included
 * by HyperGuest) and adds BLY's 10% commission -- nothing else.
 *
 * @param {number} hyperguestAmount - HyperGuest's raw sell price (untouched, unmarked-up)
 * @param {string} currency
 * @returns {{
 *   currency: string,
 *   baseAmount: number,       // HyperGuest's raw rate -- what BLY owes them (not shown to guest)
 *   commissionAmount: number, // BLY's 10% commission
 *   totalAmount: number       // baseAmount + commissionAmount -- what the guest sees/pays
 * }}
 */
export function calculateGuestPrice(hyperguestAmount, currency) {
  const base = Number(hyperguestAmount) || 0
  const commission = base * COMMISSION_RATE
  const total = base + commission

  return {
    currency,
    baseAmount: round2(base),
    commissionAmount: round2(commission),
    totalAmount: round2(total),
  }
}
