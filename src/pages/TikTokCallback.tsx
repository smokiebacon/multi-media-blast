
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function TikTokCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorMsg = params.get('error');
      const errorDescription = params.get('error_description');
      
      if (errorMsg || errorDescription) {
        const message = errorDescription || errorMsg || 'Unknown error from TikTok';
        console.error("TikTok auth error:", message);
        setError(message);
        toast({
          title: "TikTok Connection Failed",
          description: message,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      if (!code || !user) {
        const msg = !code ? "No authorization code received from TikTok" : "You must be logged in";
        console.error(msg);
        setError(msg);
        toast({
          title: "Error",
          description: msg,
          variant: "destructive"
        });
        setIsProcessing(false);
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }

      try {
        console.log("Received code from TikTok, exchanging for token...");
        
        const { data, error } = await supabase.functions.invoke('tiktok-auth', {
          body: { action: 'callback', code },
        });

        if (error) {
          console.error("Supabase function error:", error);
          throw error;
        }

        console.log("TikTok callback response:", data);

        if (data.error) {
          throw new Error(data.error);
        }

        // Check if this exact account is already connected
        const { data: existingAccounts } = await supabase
          .from('platform_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform_id', 'tiktok')
          .eq('account_identifier', data.account_identifier);

        // Only insert if this exact account is not already connected
        if (!existingAccounts || existingAccounts.length === 0) {
          const { error: dbError } = await supabase
            .from('platform_accounts')
            .insert({
              user_id: user.id,
              platform_id: 'tiktok',
              account_name: data.account_name,
              account_identifier: data.account_identifier,
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            });

          if (dbError) throw dbError;

          toast({
            title: "Success",
            description: "TikTok account connected successfully!",
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
            .eq('platform_id', 'tiktok')
            .eq('account_identifier', data.account_identifier);

          if (updateError) throw updateError;

          toast({
            title: "Success",
            description: "TikTok account reconnected successfully!",
          });
        }
      } catch (error) {
        console.error('Error in TikTok callback:', error);
        setError(error.message || "Unknown error");
        toast({
          title: "Error",
          description: "Failed to connect TikTok account: " + (error.message || "Unknown error"),
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    };

    handleCallback();
  }, [navigate, toast, user]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">TikTok Connection</h2>
        
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Processing your TikTok connection...</p>
          </div>
        ) : error ? (
          <div className="text-destructive">
            <p className="mb-2">Connection failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="mt-4 text-sm">Redirecting you back to dashboard...</p>
          </div>
        ) : (
          <div className="text-success">
            <p className="mb-2">Connection successful!</p>
            <p className="mt-4 text-sm">Redirecting you back to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
