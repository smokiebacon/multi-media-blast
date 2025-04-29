
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function InstagramCallback() {
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const processCallback = async () => {
      try {
        if (!user) {
          setError('Authentication required. Please log in.');
          return;
        }

        // Get the authorization code from URL
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        const error = queryParams.get('error');
        const errorReason = queryParams.get('error_reason');
        const errorDescription = queryParams.get('error_description');

        if (error) {
          setError(`Instagram authorization failed: ${errorDescription || errorReason || error}`);
          return;
        }

        if (!code) {
          setError('No authorization code received from Instagram');
          return;
        }

        setStatus('Exchanging code for access token...');

        // Call our edge function to exchange code for token
        const { data, error: functionError } = await supabase.functions.invoke('instagram-auth', {
          body: { action: 'callback', code },
        });

        if (functionError || data.error) {
          throw new Error(functionError?.message || data.error || 'Failed to authenticate with Instagram');
        }

        setStatus('Getting account information...');

        // Store the connection in the database
        const { error: dbError } = await supabase.from('platform_accounts').insert({
          user_id: user.id,
          platform_id: 'instagram',
          account_name: data.account_name,
          account_identifier: data.account_identifier,
          access_token: data.access_token,
        });

        if (dbError) {
          throw new Error(`Failed to save account: ${dbError.message}`);
        }

        setStatus('Success! Redirecting...');
        toast({
          title: 'Instagram Connected',
          description: `Successfully connected Instagram account ${data.account_name}`,
        });

        // Redirect back to the platforms page
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } catch (err: any) {
        console.error('Instagram callback error:', err);
        setError(err.message || 'An unknown error occurred');
        toast({
          title: 'Connection Failed',
          description: err.message || 'Failed to connect Instagram account',
          variant: 'destructive',
        });
      }
    };

    processCallback();
  }, [navigate, user, toast]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Connection Failed</h1>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md mb-6">
          {error}
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-6"></div>
      <h1 className="text-xl font-semibold mb-2">Connecting Instagram Account</h1>
      <p className="text-muted-foreground">{status}</p>
    </div>
  );
}
