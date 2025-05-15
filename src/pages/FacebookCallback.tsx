import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function FacebookCallback() {
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
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
          setError(`Facebook authorization failed: ${errorDescription || errorReason || error}`);
          return;
        }

        if (!code) {
          setError('No authorization code received from Facebook');
          return;
        }

        setStatus('Exchanging code for access token...');

        // Call our edge function to exchange code for token
        const { data, error: functionError } = await supabase.functions.invoke('facebook-auth', {
          body: { action: 'callback', code },
        });

        if (functionError || data?.error) {
          setDebugInfo({ functionError, dataError: data?.error });
          throw new Error(functionError?.message || data?.error || 'Failed to authenticate with Facebook');
        }

        setStatus('Getting account information...');

        // Check if this exact account is already connected
        const { data: existingAccounts } = await supabase
          .from('platform_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform_id', 'facebook')
          .eq('account_identifier', data.account_identifier);
          console.log('existingAccounts',existingAccounts);

        if (!existingAccounts || existingAccounts.length === 0) {
          console.log('data',data);
          // Store the connection in the database
          const { error: dbError } = await supabase
          .from('platform_accounts')
          .insert({
            user_id: user.id,
            platform_id: 'facebook',
            account_name: data.account_name,
            account_identifier: data.account_identifier,
            access_token: data.access_token,
            refresh_token: data?.refresh_token || "",
          });

          // const {} = await supabase?.from("pages").insert({})

          if (dbError) {
            console.log('dbError',dbError);
            setDebugInfo({ dbError });
            throw new Error(`Failed to save account: ${dbError.message}`);
          }

          toast({
            title: 'Facebook Connected',
            description: `Successfully connected Facebook account: ${data.account_name}`,
          });
        } else {
          // Update the existing account with new tokens
          const { error: updateError } = await supabase
            .from('platform_accounts')
            .update({
              access_token: data.access_token,
              token_expires_at: data.token_expires_at,
              updated_at: new Date().toISOString(),
              metadata: data.metadata,
            })
            .eq('user_id', user.id)
            .eq('platform_id', 'facebook')
            .eq('account_identifier', data.account_identifier);

          if (updateError) {
            setDebugInfo({ updateError });
            throw new Error(`Failed to update account: ${updateError.message}`);
          }

          toast({
            title: 'Facebook Reconnected',
            description: `Successfully reconnected Facebook account: ${data.account_name}`,
          });
        }

        setStatus('Success! Redirecting...');

        // Redirect back to the dashboard page
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } catch (err: any) {
        console.error('Facebook callback error:', err);
        setError(err.message || 'An unknown error occurred');
        toast({
          title: 'Connection Failed',
          description: err.message || 'Failed to connect Facebook account',
          variant: 'destructive',
        });
      }
    };
    if(!loading) {
      processCallback();
    }
  }, [loading]);
  useEffect(() => {
    if(!loading) {
      console.count('FacebookCallback useEffect');
    } else {
      // console.count('FacebookCallback useEffect');
    }
  },[loading])
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Connection Failed</h1>
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md mb-6">
          {error}
        </div>
        {debugInfo && (
          <Alert variant="destructive" className="mb-6 max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <details className="text-xs text-left">
                <summary className="cursor-pointer">Debug Information</summary>
                <pre className="mt-2 p-2 bg-muted/50 rounded overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </AlertDescription>
          </Alert>
        )}
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 border rounded-lg shadow-sm max-w-lg w-full">
        <h2 className="text-xl font-semibold mb-4">Facebook Connection</h2>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{status}</p>
        </div>
      </div>
    </div>
  );
} 