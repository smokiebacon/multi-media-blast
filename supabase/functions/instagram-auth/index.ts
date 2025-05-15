import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INSTAGRAM_APP_ID = Deno.env.get('INSTAGRAM_APP_ID') || '';
const INSTAGRAM_APP_SECRET = Deno.env.get('INSTAGRAM_APP_SECRET') || '';
const PUBLIC_URL = Deno.env.get('PUBLIC_URL') || 'http://localhost:8080';
const REDIRECT_URI = `${PUBLIC_URL}/instagram-callback`;
const makeId = (length: number) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Store state temporarily (in production, use a database or session)
const stateStore = new Map<string, string>();

// const generateAuthUrl = () => {
//   const scopes = ['instagram_basic', 'instagram_content_publish', 'instagram_manage_comments'];
//   const state = makeId(16);
//   const url = `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes.join(',')}&response_type=code&state=${state}`;
//   return { url, state };
// };

serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  console.log('saad')

  try {
    const body = (await req?.json())
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || body?.action;
    const code = body?.code;

    if (action === 'connect') {
      if (!INSTAGRAM_APP_ID) {
        return new Response(JSON.stringify({ error: 'Instagram App ID not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // const { url, state } = generateAuthUrl();
      const url = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1029009105506985&redirect_uri=https://efb2-103-72-0-182.ngrok-free.app/instagram-callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`
      // stateStore.set(state, 'active'); // Store state for verification
      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (action === 'callback') {
      if (!code) {
        return new Response(JSON.stringify({ error: 'No authorization code provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // if (!state || !stateStore.has(state)) {
      //   return new Response(JSON.stringify({ error: 'Invalid or missing state parameter' }), {
      //     status: 400,
      //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      //   });
      // }
      // stateStore.delete(state); // Clear state after use

      console.log('Received authorization code:', code);
      const formData = new FormData();
      formData.append('client_id', "1029009105506985");
      formData.append('client_secret', INSTAGRAM_APP_SECRET);
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', REDIRECT_URI);
      formData.append('code', code);
      // Step 1: Exchange code for short-lived access token
      const tokenData = await (
        await fetch('https://api.instagram.com/oauth/access_token', {
          method: 'POST',
          body: formData,
        })
      ).json();
      
      // const tokenData = await tokenResponse.json();
      console.log('tokenData',tokenData)
      if (tokenData.code == 400) {
        console.error('Token exchange error:', tokenData.error);
        return new Response(JSON.stringify({ error: tokenData.error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const shortLivedToken = tokenData.access_token;
      console.log('Short-lived token:', shortLivedToken);

      // Step 2: Exchange short-lived token for long-lived token
      const longLivedTokenData = await (
        await fetch(
          'https://graph.instagram.com/access_token' +
            '?grant_type=ig_exchange_token' +
            `&client_id=${INSTAGRAM_APP_ID}` +
            `&client_secret=${INSTAGRAM_APP_SECRET}` +
            `&access_token=${tokenData.access_token}`
        )
      ).json();

      console.log("longLivedTokenData",longLivedTokenData);

      // const longLivedTokenData = await longLivedTokenResponse.json();
      if (longLivedTokenData.error) {
        console.error('Long-lived token error:', longLivedTokenData.error);
        return new Response(JSON.stringify({ error: longLivedTokenData.error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Step 3: Fetch user info (Instagram Business account)
      const userInfoResponse = await fetch(
        `https://graph.instagram.com/v21.0/me?fields=user_id,username,name,profile_picture_url&access_token=${longLivedTokenData?.access_token}`
      );
      const userData = await userInfoResponse.json();
      if (userData.error) {
        console.error('User info error:', userData.error);
        return new Response(JSON.stringify({ error: userData.error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log("userData",userData)
      const instagramAccount = userData;
      if (!instagramAccount) {
        return new Response(JSON.stringify({ error: 'No Instagram Business account linked' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          access_token: longLivedTokenData.access_token,
          account_name: instagramAccount.username,
          account_identifier: instagramAccount.id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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