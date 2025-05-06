
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get environment variables
const INSTAGRAM_APP_ID = Deno.env.get('INSTAGRAM_APP_ID') || '';
const INSTAGRAM_APP_SECRET = Deno.env.get('INSTAGRAM_APP_SECRET') || '';

// Get base URL from environment variable or use a fallback
const PUBLIC_URL = Deno.env.get('PUBLIC_URL') || 'http://localhost:8080';
const REDIRECT_URI = `${PUBLIC_URL}/instagram-callback`;

console.log("Function initialized with redirect URI:", REDIRECT_URI);
console.log("Instagram credentials configured - App ID exists:", !!INSTAGRAM_APP_ID);
console.log("Instagram credentials configured - App Secret exists:", !!INSTAGRAM_APP_SECRET);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code } = await req.json();
    console.log(`Processing Instagram auth action: ${action}`);

    if (action === 'connect') {
      // Validate that secrets are present
      if (!INSTAGRAM_APP_ID) {
        console.error('Instagram App ID is missing');
        return new Response(
          JSON.stringify({ error: 'Instagram App ID is not configured. Please set INSTAGRAM_APP_ID in Supabase Edge Function secrets.' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // OAuth 2.0 authorization endpoint
      const scope = 'user_profile,user_media';
      const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code`;
      
      console.log("Generated Instagram auth URL:", authUrl);
      
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

      if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
        return new Response(
          JSON.stringify({ error: 'Instagram OAuth credentials are not configured. Please set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET in Supabase Edge Function secrets.' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      try {
        console.log("Exchanging code for token with credentials");
        
        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
          method: 'POST',
          body: new URLSearchParams({
            client_id: INSTAGRAM_APP_ID,
            client_secret: INSTAGRAM_APP_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
            code: code,
          }),
        });

        const tokenData = await tokenResponse.json();
        console.log("Token response status:", tokenResponse.status);
        
        if (tokenData.error) {
          console.error("Token error:", tokenData.error_description || tokenData.error);
          return new Response(JSON.stringify({ error: tokenData.error_description || tokenData.error }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { access_token, user_id } = tokenData;

        // Get user info using the Graph API
        const userInfoResponse = await fetch(
          `https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`
        );

        const userData = await userInfoResponse.json();
        console.log("User data status:", userInfoResponse.status);

        if (userData.error) {
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
            account_name: userData.username || `Instagram User ${user_id.substring(0, 5)}`,
            account_identifier: user_id,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('Error in Instagram callback:', error);
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
