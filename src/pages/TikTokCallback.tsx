
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function TikTokCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      
      if (!code || !user) {
        toast({
          title: "Error",
          description: "Failed to connect TikTok account.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('tiktok-auth', {
          body: { action: 'callback', code },
        });

        if (error) throw error;

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
        console.error('Error in callback:', error);
        toast({
          title: "Error",
          description: "Failed to connect TikTok account: " + (error.message || "Unknown error"),
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
        navigate('/dashboard');
      }
    };

    handleCallback();
  }, [navigate, toast, user]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Connecting TikTok Account</h2>
        <p className="text-muted-foreground">Please wait...</p>
      </div>
    </div>
  );
}
