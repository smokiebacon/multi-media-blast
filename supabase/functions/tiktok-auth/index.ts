
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REDIRECT_URI = `${Deno.env.get('PUBLIC_URL')}/tiktok-callback`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code } = await req.json();
    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');

    if (!clientKey || !clientSecret) {
      throw new Error("TikTok credentials not configured");
    }

    console.log("Processing TikTok auth action:", action);

    if (action === 'connect') {
      const csrfState = crypto.randomUUID();
      const authUrl = `https://www.tiktok.com/auth/authorize?` +
        `client_key=${clientKey}` +
        `&scope=user.info.basic,video.list` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&state=${csrfState}`;

      return new Response(
        JSON.stringify({ url: authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'callback' && code) {
      console.log("Handling TikTok callback with code");
      
      const tokenResponse = await fetch('https://open.tiktok.com/oauth/access_token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log("Token response:", tokenData);

      if (tokenData.error) {
        throw new Error(tokenData.error_description || 'Failed to get access token');
      }

      // Get user info
      const userResponse = await fetch('https://open.tiktok.com/oauth/userinfo/', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const userData = await userResponse.json();
      console.log("User data:", userData);

      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          account_name: userData.data.display_name || 'TikTok User',
          account_identifier: userData.data.open_id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error("Error in tiktok-auth function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
