import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
console.log("Function started");
// Get base URL from environment variable or use a fallback
const PUBLIC_URL = Deno.env.get('PUBLIC_URL') || 'http://localhost:8080';
console.log(">>>>>>>>>>>>>>>>>>>>", PUBLIC_URL);
// Fix the double slash issue by ensuring we don't add an extra slash
const REDIRECT_URI = PUBLIC_URL.endsWith('/') 
  ? `${PUBLIC_URL}facebook-callback` 
  : `${PUBLIC_URL}/facebook-callback`;

// Get Facebook app ID and secret from environment variables
const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
console.log("ID", FACEBOOK_APP_ID);
console.log("Secret", FACEBOOK_APP_SECRET);
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code } = await req.json();
    console.log(`Processing Facebook auth action: ${action}`);

    if (action === 'connect') {
      // Validate that secrets are present
      if (!FACEBOOK_APP_ID) {
        console.error('Facebook App ID is missing');
        return new Response(
          JSON.stringify({ error: 'Facebook App ID is not configured. Please set FACEBOOK_APP_ID in Supabase Edge Function secrets.' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // OAuth 2.0 authorization endpoint
      // Requesting permissions for managing pages and publishing posts
      const scope = 'email,pages_show_list,pages_read_engagement,pages_manage_posts,public_profile';
      const authUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code&state=${crypto.randomUUID()}`;
      
      console.log("Generated Facebook auth URL:", authUrl);
      
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

      if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
        return new Response(
          JSON.stringify({ error: 'Facebook OAuth credentials are not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in Supabase Edge Function secrets.' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      try {
        console.log("Exchanging code for token with credentials");
        
        // Exchange authorization code for access token
        const tokenResponse = await fetch(`https://graph.facebook.com/v17.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${code}`);

        const tokenData = await tokenResponse.json();
        console.log("Token response status:", tokenResponse.status);
        
        if (tokenData.error) {
          console.error("Token error:", tokenData.error_description || tokenData.error);
          return new Response(JSON.stringify({ error: tokenData.error_description || tokenData.error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { access_token } = tokenData;

        // Get user info from the Graph API
        const userInfoResponse = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`
        );

        const userInfo = await userInfoResponse.json();
        
        if (userInfo.error) {
          console.error("User info error:", userInfo.error);
          return new Response(JSON.stringify({ error: userInfo.error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get long-lived token for extended access
        const longLivedTokenResponse = await fetch(
          `https://graph.facebook.com/v17.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${access_token}`
        );

        const longLivedTokenData = await longLivedTokenResponse.json();
        const longLivedToken = longLivedTokenData.access_token || access_token;
        const expiresIn = longLivedTokenData.expires_in;
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

        return new Response(
          JSON.stringify({
            access_token: longLivedToken,
            token_expires_at: expiresAt,
            account_name: userInfo.name,
            account_identifier: userInfo.id,
            metadata: {
              email: userInfo.email,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error("Error in Facebook authentication:", error);
        return new Response(
          JSON.stringify({ error: error.message || "An unexpected error occurred" }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error("Error in facebook-auth function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
}); 