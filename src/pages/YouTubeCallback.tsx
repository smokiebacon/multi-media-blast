
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Loader } from 'lucide-react';

export default function YouTubeCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      const errorParam = new URLSearchParams(window.location.search).get('error');
      
      if (errorParam) {
        setError(`YouTube returned an error: ${errorParam}`);
        toast({
          title: "Error",
          description: `YouTube returned an error: ${errorParam}`,
          variant: "destructive"
        });
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }
      
      if (!code || !user) {
        const reason = !code ? 'No authorization code found in URL' : 'User not authenticated';
        setError(reason);
        toast({
          title: "Error",
          description: `Failed to connect YouTube account: ${reason}`,
          variant: "destructive"
        });
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }

      try {
        console.log("Processing YouTube authorization code");
        
        const { data, error } = await supabase.functions.invoke('youtube-auth', {
          body: { action: 'callback', code },
        });

        if (error) {
          console.error("Function invocation error:", error);
          setError(error.message || "Function invocation failed");
          throw error;
        }

        console.log("YouTube callback response:", data);

        if (data.error) {
          console.error("YouTube auth error:", data.error, data.details || "");
          setError(data.error);
          throw new Error(data.error);
        }

        // Check if this exact channel is already connected
        const { data: existingAccounts, error: fetchError } = await supabase
          .from('platform_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform_id', 'youtube')
          .eq('account_identifier', data.channel_id);
          
        if (fetchError) {
          console.error("Error checking existing accounts:", fetchError);
          setError(fetchError.message);
          throw fetchError;
        }

        // Only insert if this exact channel is not already connected
        if (!existingAccounts || existingAccounts.length === 0) {
          // Store the connected account in Supabase as a new connection
          const { error: dbError } = await supabase
            .from('platform_accounts')
            .insert({
              user_id: user.id,
              platform_id: 'youtube',
              account_name: data.channel_name,
              account_identifier: data.channel_id,
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            });

          if (dbError) {
            console.error("Error inserting new account:", dbError);
            setError(dbError.message);
            throw dbError;
          }

          toast({
            title: "Success",
            description: "YouTube account connected successfully!",
          });
        } else {
          // Update the existing account with new tokens
          const { error: updateError } = await supabase
            .from('platform_accounts')
            .update({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .eq('platform_id', 'youtube')
            .eq('account_identifier', data.channel_id);

          if (updateError) {
            console.error("Error updating existing account:", updateError);
            setError(updateError.message);
            throw updateError;
          }

          toast({
            title: "Success",
            description: "YouTube account reconnected successfully!",
          });
        }
        
        setIsSuccess(true);
      } catch (error) {
        console.error('Error in callback:', error);
        setError(error.message || "Unknown error");
        toast({
          title: "Error",
          description: "Failed to connect YouTube account: " + (error.message || "Unknown error"),
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
        // Give more time before redirecting to ensure state updates properly
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    };

    handleCallback();
  }, [navigate, toast, user]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h2 className="text-2xl font-semibold mb-4">YouTube Connection</h2>
        
        {isProcessing ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-muted-foreground">Please wait while we connect your YouTube account...</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-destructive">Connection Failed</p>
              <p className="text-muted-foreground mt-2">{error}</p>
              <p className="text-sm mt-6">Redirecting to dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="font-medium text-green-600 dark:text-green-400">YouTube account connected successfully!</p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
