
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, channelId, accessToken, refreshToken } = await req.json();
    
    console.log(`Searching YouTube videos with query: ${query}`);
    
    // Validate request
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing access token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // First, check if we need to refresh the token
    let currentAccessToken = accessToken;
    if (refreshToken) {
      try {
        const YOUTUBE_CLIENT_ID = Deno.env.get('YOUTUBE_CLIENT_ID') || '';
        const YOUTUBE_CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET') || '';
        
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: YOUTUBE_CLIENT_ID,
            client_secret: YOUTUBE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });
        
        const refreshData = await refreshResponse.json();
        if (refreshData.access_token) {
          console.log("Successfully refreshed access token");
          currentAccessToken = refreshData.access_token;
        } else {
          console.error("Token refresh failed:", refreshData);
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
      }
    }

    // Build search URL
    let searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('maxResults', '5');
    searchUrl.searchParams.append('type', 'video');
    
    if (query) {
      searchUrl.searchParams.append('q', query);
    }
    
    if (channelId) {
      searchUrl.searchParams.append('channelId', channelId);
    }
    
    // Perform the search
    const searchResponse = await fetch(searchUrl.toString(), {
      headers: {
        "Authorization": `Bearer ${currentAccessToken}`
      }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("YouTube search failed:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "YouTube search failed", 
          details: errorText,
          status: searchResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchData = await searchResponse.json();
    console.log("Search successful, found:", searchData.items?.length || 0, "items");

    return new Response(
      JSON.stringify(searchData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in YouTube search:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error during search" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
