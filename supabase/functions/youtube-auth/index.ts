
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Securely retrieve secrets using Deno.env
const YOUTUBE_CLIENT_ID = Deno.env.get('YOUTUBE_CLIENT_ID') || '';
const YOUTUBE_CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET') || '';
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY') || '';

// Important: Make sure this matches EXACTLY what you've registered in Google Cloud Console
// Including the protocol (https://), and there should be no trailing slashes
const REDIRECT_URI = Deno.env.get('PUBLIC_URL') 
  ? `${Deno.env.get('PUBLIC_URL')}/youtube-callback`.replace(/\/+$/, '') 
  : 'https://45efbe08-2f80-47f8-b48a-801bdd07efa3.lovableproject.com/youtube-callback';

console.log("Function initialized with redirect URI:", REDIRECT_URI);
console.log("Credentials configured - Client ID exists:", !!YOUTUBE_CLIENT_ID);
console.log("Credentials configured - Client Secret exists:", !!YOUTUBE_CLIENT_SECRET);
console.log("Credentials configured - API Key exists:", !!YOUTUBE_API_KEY);

// Log all environment variables starting with YOUTUBE to help debug
console.log("All YouTube related environment variables:", 
  Object.keys(Deno.env.toObject())
    .filter(key => key.includes('YOUTUBE'))
    .join(', ')
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code } = await req.json();
    console.log(`Processing action: ${action}`);

    if (action === 'connect') {
      // Validate that secrets are present
      if (!YOUTUBE_CLIENT_ID) {
        console.error('YouTube Client ID is missing');
        return new Response(
          JSON.stringify({ error: 'YouTube Client ID is not configured. Please set YOUTUBE_CLIENT_ID in Supabase Edge Function secrets.' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const scope = 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload';
      // Do NOT URL encode the entire REDIRECT_URI, Google needs the exact string to match
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
      
      console.log("Generated auth URL:", authUrl);
      
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

      if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
        return new Response(
          JSON.stringify({ error: 'YouTube OAuth credentials are not configured. Please set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in Supabase Edge Function secrets.' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      try {
        console.log("Exchanging code for token with credentials");
        console.log("Using redirect URI for token exchange:", REDIRECT_URI);
        
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: YOUTUBE_CLIENT_ID,
            client_secret: YOUTUBE_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });

        const tokens = await tokenResponse.json();
        console.log("Token response status:", tokenResponse.status);
        
        if (tokens.error) {
          console.error("Token error:", tokens.error_description || tokens.error);
          return new Response(JSON.stringify({ error: tokens.error_description || tokens.error }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get channel info
        const channelResponse = await fetch(
          'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          }
        );

        const channelData = await channelResponse.json();
        console.log("Channel data status:", channelResponse.status);

        if (!channelData.items || channelData.items.length === 0) {
          console.error("No channel found:", channelData);
          return new Response(JSON.stringify({ error: 'No YouTube channel found', details: channelData }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const channel = channelData.items[0];

        // Return all necessary data
        return new Response(
          JSON.stringify({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            channel_name: channel.snippet.title,
            channel_id: channel.id,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('Error in callback:', error);
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
