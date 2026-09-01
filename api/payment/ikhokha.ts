// api/payment/ikhokha.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const IK_APP_ID     = process.env.IK_APP_ID     ?? ''
const IK_APP_SECRET = process.env.IK_APP_SECRET ?? ''
const IK_ENTITY_ID  = process.env.IK_ENTITY_ID  ?? process.env.IK_APP_ID ?? ''
const BASE_URL      = process.env.VITE_BASE_URL  ?? ''

const IK_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment'
const IK_PATH     = '/public-api/v1/api/payment'

// No regex — split/join is equivalent to global replace and cannot misparse.
function jsStringEscape(str: string): string {
  return str
    .split('\\').join('\\\\')
    .split('"').join('\\"')
    .split("'").join("\\'")
    .split('
