
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
    const { title, description, mediaUrl, accessToken, refreshToken, channelId } = await req.json();
    
    console.log(`Processing YouTube upload request for channel: ${channelId}`);
    console.log(`Media URL: ${mediaUrl}`);
    
    // Validate request
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing access token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!mediaUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing media URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Download the media file from the provided URL
    console.log("Downloading media file...");
    const mediaResponse = await fetch(mediaUrl);
    if (!mediaResponse.ok) {
      throw new Error(`Failed to download media: ${mediaResponse.statusText}`);
    }
    
    const contentType = mediaResponse.headers.get('content-type') || 'video/mp4';
    const mediaData = await mediaResponse.arrayBuffer();
    console.log(`Downloaded media file: ${(mediaData.byteLength / 1024 / 1024).toFixed(2)}MB`);
    
    // Step 2: Upload to YouTube using the YouTube API
    console.log("Uploading to YouTube...");

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

    // YouTube Upload Process
    // 1. Initialize upload
    const uploadUrl = "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable";
    const metadata = {
      snippet: {
        title: title || "Uploaded video",
        description: description || "Uploaded via social media manager",
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus: "public",
      },
    };

    // Initialize resumable upload
    const initResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${currentAccessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": contentType,
        "X-Upload-Content-Length": mediaData.byteLength.toString(),
      },
      body: JSON.stringify(metadata),
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error("YouTube upload initialization failed:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "YouTube upload initialization failed", 
          details: errorText,
          status: initResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get the resumable upload URL
    const location = initResponse.headers.get("Location");
    if (!location) {
      return new Response(
        JSON.stringify({ error: "No upload URL provided by YouTube" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Upload the file
    const uploadResponse = await fetch(location, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Content-Length": mediaData.byteLength.toString(),
      },
      body: mediaData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("YouTube upload failed:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "YouTube upload failed", 
          details: errorText,
          status: uploadResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Get the uploaded video details
    const videoData = await uploadResponse.json();
    console.log("Upload successful:", videoData);

    return new Response(
      JSON.stringify({
        success: true,
        videoId: videoData.id,
        videoUrl: `https://www.youtube.com/watch?v=${videoData.id}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in YouTube upload:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error during upload" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
