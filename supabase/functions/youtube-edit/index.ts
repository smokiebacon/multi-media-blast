
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
    const { videoId, title, description, accessToken, refreshToken } = await req.json();
    
    console.log(`Processing YouTube edit request for video ID: ${videoId}`);
    
    // Validate request
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing access token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Missing video ID' }),
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

    // Update YouTube video metadata
    const updateUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet`;
    
    // First, get the current video data to preserve fields we're not updating
    const getVideoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}`, 
      {
        headers: {
          "Authorization": `Bearer ${currentAccessToken}`,
        }
      }
    );
    
    if (!getVideoResponse.ok) {
      const errorText = await getVideoResponse.text();
      console.error("Failed to get video data:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to get video data",
          details: errorText,
          status: getVideoResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const videoData = await getVideoResponse.json();
    if (!videoData.items || videoData.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the current snippet and preserve other fields
    const snippet = { ...videoData.items[0].snippet };
    
    // Update only the title and description
    if (title) snippet.title = title;
    if (description) snippet.description = description;
    
    // Send the update request
    const updateResponse = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${currentAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: videoId,
        snippet: snippet,
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("YouTube update failed:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "YouTube video update failed", 
          details: errorText,
          status: updateResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updatedVideoData = await updateResponse.json();
    console.log("Update successful:", updatedVideoData);

    return new Response(
      JSON.stringify({
        success: true,
        videoId: updatedVideoData.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in YouTube edit:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error during update" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
