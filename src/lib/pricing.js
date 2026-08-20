// src/lib/pricing.js
//
// GUEST-FACING DISPLAY pricing logic, per HyperGuest's guidance
// (confirmed 2026-08-17):
//
//   - If Net and Sell rates DIFFER, HyperGuest has already applied its own
//     markup -- use Sell AS-IS, no additional commission from BLY.
//   - If Net and Sell rates are the SAME, HyperGuest applied no markup at
//     all -- BLY adds its own 10% commission on top of Sell in that case.
//
// This is entirely separate from what gets sent back to HyperGuest at
// booking time: `expectedPrice` in hyperguest-prebook / hyperguest-book
// must ALWAYS be the NET rate, regardless of the Net/Sell relationship.
// That is enforced in HotelDetail.jsx and Checkout.jsx directly, not here
// -- this file only ever computes what the GUEST sees.

export const COMMISSION_RATE = 0.10 // BLY's commission when HyperGuest applied no markup of its own
const SAME_RATE_TOLERANCE = 0.01    // treat net/sell as "the same" if they differ by less than 1 cent (floating point safety)

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * @param {number} netAmount  - HyperGuest's Net rate
 * @param {number} sellAmount - HyperGuest's Sell rate
 * @param {string} currency
 * @returns {{
 *   currency: string,
 *   netAmount: number,
 *   sellAmount: number,
 *   markupApplied: boolean, // true if BLY added its own 10% (net === sell case)
 *   totalAmount: number     // what the guest sees/pays
 * }}
 */
export function calculateGuestPrice(netAmount, sellAmount, currency) {
  const net = Number(netAmount) || 0
  const sell = Number(sellAmount) || 0
  const ratesAreEqual = Math.abs(net - sell) < SAME_RATE_TOLERANCE

  const total = ratesAreEqual ? sell * (1 + COMMISSION_RATE) : sell

  return {
    currency,
    netAmount: round2(net),
    sellAmount: round2(sell),
    markupApplied: ratesAreEqual,
    totalAmount: round2(total),
  }
}
