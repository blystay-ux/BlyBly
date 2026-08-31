// PayFastButton.jsx
// Saves a pending booking to Supabase, then redirects to PayFast's hosted payment page.

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PayFastButton({
  property,
  info,
  checkIn,
  nights,
  leadGuest,
  roomGuests,
  roomId,
  roomName,
  ratePlanId,
  ratePlanName,
  guestPrice,
  sell,
  net,
  addNights,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function handlePay() {
    setLoading(true)
    setError(null)

    const agencyReference = `BLY-${Date.now()}`
    const checkOut        = addNights(checkIn, nights)
    const expectedPrice   = guestPrice?.totalAmount ?? sell?.price

    try {
      // 1. Save pending booking
      const { data: booking, error: dbErr } = await supabase
        .from('hg_bookings')
        .insert({
          hyperguest_property_id: property.propertyId,
          agency_reference:       agencyReference,
          status:                 'Pending',
          payment_status:         'unpaid',
          check_in:               checkIn,
          check_out:              checkOut,
          lead_guest:             leadGuest,
          guest_email:            leadGuest.email,
          guest_phone:            leadGuest.phone,
          total_price_zar:        expectedPrice,
          meta: {
            hotelName:    info?.name,
            roomName,
            ratePlanName,
          },
          checkout_payload: {
            propertyId: property.propertyId,
            checkIn,
            checkOut,
            agencyReference,
            leadGuest,
            rooms: [{
              roomId,
              ratePlanId,
              roomName,
              ratePlanName,
              expectedPrice,
              guests: roomGuests,
            }],
          },
        })
        .select('id')
        .single()

      if (dbErr) throw new Error(dbErr.message)

      // 2. Get a signed PayFast redirect URL from the server
      const pfRes = await fetch('/api/payment/payfast', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bookingId: booking.id }),
      })

      const pfData = await pfRes.json()
      if (!pfRes.ok || !pfData.redirectUrl) throw new Error(pfData.error ?? 'Could not create payment')

      // 3. Redirect to PayFast
      window.location.href = pfData.redirectUrl
    } catch (err) {
      console.error('[PayFastButton]', err)
      setError('Could not initiate payment. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ width: 200 }}>
      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          display:        'flex',
          justifyContent: 'center',
          alignItems:     'center',
          width:          '100%',
          height:         48,
          background:     loading ? '#555' : '#1D1D1B',
          color:          '#FFFFFF',
          border:         '1px solid #e5e5e5',
          borderRadius:   16,
          fontFamily:     'sans-serif',
          fontWeight:     700,
          fontSize:       16,
          cursor:         loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Please wait…' : 'Pay Now'}
      </button>
      <p style={{ margin: '5px 0 0', fontSize: 8, textAlign: 'center', fontFamily: 'sans-serif' }}>
        Secured by PayFast
      </p>
      {error && (
        <p style={{ color: 'red', fontSize: 12, marginTop: 8 }}>{error}</p>
      )}
    </div>
  )
}
