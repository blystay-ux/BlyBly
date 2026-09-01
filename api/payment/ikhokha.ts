// api/payment/ikhokha.ts
//
// Creates an iKhokha payment link and returns the redirect URL to the frontend.
//
// POST /api/payment/ikhokha
// Body: { bookingId: string }
// Response: { redirectUrl: string }
//
// Required Vercel env vars:
//   IK_APP_ID       — Application ID shown in iKhokha Merchant Dashboard
//   IK_APP_SECRET   — Application Secret (used to sign requests)
//   IK_ENTITY_ID    — Application Key ID (entityID field in the request body)
//                     Usually different from IK_APP_ID — check the dashboard.
//                     Falls back to IK_APP_ID if not set.
//   VITE_BASE_URL   — e.g. https://blytravel.co.za

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const IK_APP_ID     = process.env.IK_APP_ID     ?? ''
const IK_APP_SECRET = process.env.IK_APP_SECRET ?? ''
const IK_ENTITY_ID  = process.env.IK_ENTITY_ID  ?? process.env.IK_APP_ID ?? ''
const BASE_URL      = process.env.VITE_BASE_URL  ?? ''

const IK_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment'
const IK_PATH     = '/public-api/v1/api/payment'

// Exactly matches jsStringEscape from the official iKhokha JS sample
function jsStringEscape(str: string): string {
  return str.replace(/[\\"']/g, '\\$&').replace(/
