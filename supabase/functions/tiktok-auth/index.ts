import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get environment variables
const TIKTOK_CLIENT_ID = Deno.env.get('TIKTOK_CLIENT_ID') || '';
const TIKTOK_CLIENT_SECRET = Deno.env.get('TIKTOK_CLIENT_SECRET') || '';
const PUBLIC_URL = Deno.env.get('PUBLIC_URL') || 'http://localhost:8080';
const REDIRECT_URI = `${PUBLIC_URL}/tiktok-callback`;

console.log("Function initialized with redirect URI:", REDIRECT_URI);
console.log("TikTok credentials configured - Client ID exists:", !!TIKTOK_CLIENT_ID);
console.log("TikTok credentials configured - Client Secret exists:", !!TIKTOK_CLIENT_SECRET);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code } = await req.json();
    console.log(`Processing TikTok auth action: ${action}`);

    if (action === 'connect') {
      // Validate that secrets are present
      if (!TIKTOK_CLIENT_ID) {
        console.error('TikTok Client ID is missing');
        return new Response(
          JSON.stringify({ error: 'TikTok Client ID is not configured. Please set TIKTOK_CLIENT_ID in Supabase Edge Function secrets.' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // OAuth 2.0 authorization endpoint
      const scope = 'user.info.basic';
      const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${TIKTOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code`;
      
      console.log("Generated TikTok auth URL:", authUrl);
      
      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'callback') {
      // Validate secrets and code
      if (!code) {
        return new Response(JSON.stringify({ error: 'No code provided' }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!TIKTOK_CLIENT_ID || !TIKTOK_CLIENT_SECRET) {
        return new Response(
          JSON.stringify({ error: 'TikTok OAuth credentials are not configured. Please set TIKTOK_CLIENT_ID and TIKTOK_CLIENT_SECRET in Supabase Edge Function secrets.' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      try {
        console.log("Exchanging code for token with credentials");
        
        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: TIKTOK_CLIENT_ID,
            client_secret: TIKTOK_CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
            code: code,
          }),
        });

        const tokenData = await tokenResponse.json();

        console.log("Token response status:", tokenResponse.status,tokenData);
        
        if (tokenData.error) {
          console.error("Token error:", tokenData.error_description || tokenData.error);
          return new Response(JSON.stringify({ error: tokenData.error_description || tokenData.error }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { access_token, open_id,expires_in,refresh_token } = tokenData;

        // Get user info using the TikTok API
        const userInfoResponse = await fetch(
          `https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${access_token}`,
            },
          }
        );

        const userData = await userInfoResponse.json();
        console.log("User data status:", userData);

        if (userData.error?.code !== 'ok') {
          console.error("User data error:", userData.error.message);
          return new Response(JSON.stringify({ error: userData.error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
    
        // Return user data
        return new Response(
          JSON.stringify({
            access_token: access_token,
            account_name: userData.data?.user.display_name,
            account_identifier: open_id,
            token_expires_at: expires_in,
            refresh_token : refresh_token,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('Error in TikTok callback:', error);
        return new Response(JSON.stringify({ error: 'Failed to exchange code', details: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: 'Invalid request', details: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});