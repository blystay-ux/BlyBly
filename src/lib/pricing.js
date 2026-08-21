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
