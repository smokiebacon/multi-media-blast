
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get base URL from environment variable or use a fallback
const PUBLIC_URL = Deno.env.get('PUBLIC_URL') || 'http://localhost:3000';
// Fix the double slash issue by ensuring we don't add an extra slash
const REDIRECT_URI = PUBLIC_URL.endsWith('/') 
  ? `${PUBLIC_URL}tiktok-callback` 
  : `${PUBLIC_URL}/tiktok-callback`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code } = await req.json();
    
    // Check for both possible environment variable names for TikTok client key
    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY') || Deno.env.get('TIKTOK_CLIENT_ID');
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');

    console.log("TikTok Auth Function Environment Check:");
    console.log("- PUBLIC_URL:", PUBLIC_URL);
    console.log("- REDIRECT_URI:", REDIRECT_URI);
    console.log("- client_key value:", clientKey ? clientKey.substring(0, 4) + "..." : "undefined");
    console.log("- Has TIKTOK_CLIENT_SECRET:", !!clientSecret);
    // Log all environment variables that might contain TikTok-related values
    console.log("- All env vars related to TikTok:", 
      Object.keys(Deno.env.toObject())
        .filter(key => key.toUpperCase().includes('TIKTOK') || key.toUpperCase().includes('TIK'))
        .join(', ')
    );

    if (!clientKey || !clientSecret) {
      console.error("TikTok credentials not configured");
      throw new Error("TikTok credentials not configured. Please set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET in Supabase Edge Function secrets.");
    }

    // Trim any potential whitespace from credentials
    const trimmedClientKey = clientKey.trim();
    const trimmedClientSecret = clientSecret.trim();
    
    console.log("Processing TikTok auth action:", action);

    if (action === 'connect') {
      // Generate a random state for CSRF protection
      const csrfState = crypto.randomUUID();
      
      // Create the authorization URL with all required parameters
      // Make sure to use web-specific parameters and avoid mobile-specific parameters
      const authUrl = `https://www.tiktok.com/v2/auth/authorize?` +
        `client_key=${encodeURIComponent(trimmedClientKey)}` +
        `&scope=user.info.basic,video.list` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&state=${csrfState}`;

      console.log("Generated TikTok auth URL:", authUrl);
      
      return new Response(
        JSON.stringify({ url: authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'callback' && code) {
      console.log("Handling TikTok callback with code:", code.substring(0, 4) + "...");
      
      // Exchange code for access token
      const tokenUrl = 'https://open.tiktok.com/v2/oauth/token/';
      const tokenBody = new URLSearchParams({
        client_key: trimmedClientKey,
        client_secret: trimmedClientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      });
      
      console.log("Sending token request to:", tokenUrl);
      console.log("Token request params:", {
        client_key_first_chars: trimmedClientKey.substring(0, 4) + "...",
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      });
      
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenBody,
      });

      const tokenData = await tokenResponse.json();
      console.log("Token response status:", tokenResponse.status);
      console.log("Token response headers:", Object.fromEntries(tokenResponse.headers.entries()));
      
      // Log error specifics but hide sensitive data
      if (tokenData.error || !tokenData.data) {
        console.error("Token error:", {
          error: tokenData.error,
          error_description: tokenData.error_description,
          message: tokenData.message,
          response_data: JSON.stringify(tokenData).substring(0, 200) + "...",
        });
        throw new Error(tokenData.error_description || tokenData.message || 'Failed to get access token');
      }

      // Extract the access token and open_id from the response
      const { access_token, refresh_token, open_id } = tokenData.data;

      // Get user info
      const userInfoUrl = 'https://open.tiktok.com/v2/user/info/';
      const userInfoParams = new URLSearchParams({
        fields: 'open_id,union_id,avatar_url,display_name',
      });
      
      console.log("Fetching user info from:", userInfoUrl);
      
      const userResponse = await fetch(`${userInfoUrl}?${userInfoParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      const userData = await userResponse.json();
      console.log("User data response status:", userResponse.status);
      
      if (userData.error || !userData.data) {
        console.error("User data error:", {
          error: userData.error,
          error_description: userData.error_description,
          message: userData.message,
        });
        throw new Error(userData.error_description || userData.message || 'Failed to get user info');
      }

      return new Response(
        JSON.stringify({
          access_token,
          refresh_token,
          account_name: userData.data.user.display_name || 'TikTok User',
          account_identifier: open_id,
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
