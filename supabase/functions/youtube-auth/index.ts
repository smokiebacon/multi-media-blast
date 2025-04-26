
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Make sure we use the environment variables
const YOUTUBE_CLIENT_ID = Deno.env.get('YOUTUBE_CLIENT_ID') || '';
const YOUTUBE_CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET') || '';
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY') || '';
const REDIRECT_URI = 'https://45efbe08-2f80-47f8-b48a-801bdd07efa3.lovableproject.com/youtube-callback';

// Add debug logs to check if environment variables are set
console.log("Config check - Client ID exists:", !!YOUTUBE_CLIENT_ID);
console.log("Config check - Client Secret exists:", !!YOUTUBE_CLIENT_SECRET);
console.log("Config check - API Key exists:", !!YOUTUBE_API_KEY);
console.log("Redirect URI set to:", REDIRECT_URI);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code } = await req.json();

    if (action === 'connect') {
      if (!YOUTUBE_CLIENT_ID) {
        return new Response(
          JSON.stringify({ error: 'YouTube Client ID is not configured' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const scope = 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
      
      console.log("Generated auth URL:", authUrl);
      
      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'callback') {
      if (!code) {
        return new Response(JSON.stringify({ error: 'No code provided' }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
        return new Response(
          JSON.stringify({ error: 'YouTube OAuth credentials are not configured' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      try {
        console.log("Exchanging code for token with credentials");
        
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
          return new Response(JSON.stringify({ error: 'No YouTube channel found' }), {
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
