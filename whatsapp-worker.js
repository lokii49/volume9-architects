// Deploy this to Cloudflare Workers (free tier) to receive contact-form
// submissions and forward them to your WhatsApp number automatically.
//
// Setup:
//   1. Create a Meta developer app with the WhatsApp product
//      (https://developers.facebook.com/apps) and complete business
//      verification so you can message any number, not just test numbers.
//   2. Grab the Phone Number ID from WhatsApp > API Setup, and generate a
//      permanent access token (System User token with whatsapp_business_
//      messaging permission) from Meta Business Suite.
//   3. Deploy this file as a Worker, then set these Secrets in the
//      Worker's settings (Settings > Variables > Encrypt):
//        WHATSAPP_TOKEN            — permanent access token
//        WHATSAPP_PHONE_NUMBER_ID  — the sender Phone Number ID
//        WHATSAPP_TO_NUMBER        — your number to receive inquiries on,
//                                    in international format, e.g. 917729887245
//   4. Point assets/js/main.js's WHATSAPP_WORKER_URL at the deployed
//      Worker's URL (either the *.workers.dev URL or a custom route).

const ALLOWED_ORIGIN = 'https://volume9architects.in';

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Not found', { status: 404, headers: corsHeaders });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, error: 'Invalid JSON' }, 400, corsHeaders);
    }

    const name    = String(body.name    || '').trim().slice(0, 120);
    const phone   = String(body.phone   || '').trim().slice(0, 40);
    const project = String(body.project || '').trim().slice(0, 120);
    const message = String(body.message || '').trim().slice(0, 1000);

    if (!name || !phone || !message) {
      return json({ success: false, error: 'Missing required fields' }, 400, corsHeaders);
    }

    const text = [
      'New inquiry from volume9architects.in',
      '',
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Project Type: ${project || '—'}`,
      '',
      message,
    ].join('\n');

    const waRes = await fetch(
      `https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: env.WHATSAPP_TO_NUMBER,
          type: 'text',
          text: { body: text },
        }),
      }
    );

    const waData = await waRes.json();

    if (!waRes.ok) {
      return json({ success: false, error: waData }, 502, corsHeaders);
    }

    return json({ success: true }, 200, corsHeaders);
  },
};

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
