import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
// Razorpay SDK is not natively available in Deno yet, so we use standardized fetch API calls
import { encode } from "https://deno.land/std@0.177.0/encoding/base64.ts"

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency } = await req.json()
    
    // Retrieve environment secrets (set these via `supabase secrets set`)
    const key_id = Deno.env.get('RAZORPAY_KEY_ID')
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!key_id || !key_secret) {
      throw new Error("Razorpay credentials missing in Edge Function environment.")
    }

    // Call Razorpay API to generate an Order ID
    const basicAuth = encode(`${key_id}:${key_secret}`)
    
    const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        amount: amount, 
        currency: currency || "INR",
        receipt: "habitropolis_coins_" + Date.now(),
        payment_capture: 1
      })
    })

    const orderData = await rpRes.json()

    if (!rpRes.ok) {
      console.error("Razorpay error: ", orderData)
      throw new Error(orderData.error?.description || "Failed to create order")
    }

    return new Response(JSON.stringify(orderData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
