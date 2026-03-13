import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const TEXT_MODEL = 'gemini-2.5-flash'
const IMAGE_MODEL = 'imagen-4.0-fast-generate-001'

// ── Generate text suggestions via Gemini ────────────────────
async function generateTextSuggestions(
  apiKey: string,
  topic: string,
  tone: string,
  audience: string,
): Promise<{ texts: string[]; imagePrompts: string[] }> {
  const systemPrompt = `You are a LinkedIn content expert who creates engaging, professional posts that drive engagement.
You understand the LinkedIn algorithm and craft posts that are:
- Hook-driven (strong first line)
- Easy to scan (short paragraphs, line breaks)
- Value-packed with actionable insights
- Authentic and conversational
- Optimized for the LinkedIn feed

Return a JSON object with exactly this structure:
{
  "posts": [
    {
      "text": "the full LinkedIn post text (150-280 words)",
      "imagePrompt": "a detailed prompt for generating a professional, clean illustration that complements this post (1-2 sentences, describe the visual scene, style: modern flat illustration, professional, clean background)"
    }
  ]
}

Generate exactly 3 post variations. Do not include hashtags unless specifically requested.
Return ONLY the JSON object, no markdown fences, no other text.`

  const userPrompt = `Create 3 LinkedIn post variations about: "${topic || 'general thought leadership'}"
Tone: ${tone || 'professional yet conversational'}
Target audience: ${audience || 'B2B professionals'}`

  const res = await fetch(`${GEMINI_BASE}/models/${TEXT_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Gemini API error: ${res.status} — ${errorBody}`)
  }

  const data = await res.json()
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

  let parsed: { posts?: { text: string; imagePrompt: string }[] }
  try {
    parsed = JSON.parse(rawText)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    parsed = match ? JSON.parse(match[0]) : { posts: [] }
  }

  const posts = parsed.posts ?? []
  return {
    texts: posts.map((p) => p.text),
    imagePrompts: posts.map((p) => p.imagePrompt),
  }
}

// ── Generate image via Imagen 4 Fast ────────────────────────
async function generateImage(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const res = await fetch(`${GEMINI_BASE}/models/${IMAGE_MODEL}:predict?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
        },
      }),
    })

    if (!res.ok) {
      console.error(`Imagen error: ${res.status} — ${await res.text()}`)
      return null
    }

    const data = await res.json()
    const imageBytes = data.predictions?.[0]?.bytesBase64Encoded
    if (!imageBytes) return null

    return `data:image/png;base64,${imageBytes}`
  } catch (err) {
    console.error('Image generation failed:', err)
    return null
  }
}

// ── Main handler ────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { topic, tone, audience } = await req.json()

    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY')
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY not configured')
    }

    // 1. Generate text suggestions + image prompts
    const { texts, imagePrompts } = await generateTextSuggestions(apiKey, topic, tone, audience)

    // 2. Generate images in parallel
    const imagePromises = imagePrompts.map((prompt) => generateImage(apiKey, prompt))
    const images = await Promise.all(imagePromises)

    // 3. Combine into response
    const suggestions = texts.map((text, i) => ({
      text,
      image: images[i] ?? null,
    }))

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
