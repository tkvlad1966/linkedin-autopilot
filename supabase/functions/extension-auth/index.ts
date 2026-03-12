/**
 * extension-auth Edge Function
 *
 * Called by the Chrome Extension on first setup.
 * Exchanges the user's extension_token for a short-lived Supabase JWT
 * that the extension stores in chrome.storage.sync and refreshes every 50 min.
 *
 * Flow:
 *   POST { extension_token: "uuid" }
 *   → lookup profiles WHERE extension_token = $1
 *   → generate magic-link session via Admin API
 *   → return { access_token, user_id, expires_in }
 *
 * Security: SUPABASE_SERVICE_ROLE_KEY is only available server-side here.
 *           It is NEVER sent to the extension.
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // service_role — server-side only
  { auth: { autoRefreshToken: false, persistSession: false } }
)

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let extension_token: string | undefined

  try {
    const body = await req.json()
    extension_token = body?.extension_token
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!extension_token || typeof extension_token !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing extension_token' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Look up the profile by extension_token
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('extension_token', extension_token)
    .single()

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Step 1: Generate a magic link — gives us a hashed_token (not a session yet)
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: profile.email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('generateLink error:', linkError)
    return new Response(JSON.stringify({ error: 'Failed to generate link' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Step 2: Exchange hashed_token → real session with access_token
  const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'email',
  })

  if (sessionError || !sessionData?.session?.access_token) {
    console.error('verifyOtp error:', sessionError)
    return new Response(JSON.stringify({ error: 'Failed to create session' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      access_token: sessionData.session.access_token,
      user_id: profile.id,
      expires_in: 3600, // extension should refresh after 50 min
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
})
