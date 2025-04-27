
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function YouTubeCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, useState] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      
      if (!code || !user) {
        toast({
          title: "Error",
          description: "Failed to connect YouTube account.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('youtube-auth', {
          body: { action: 'callback', code },
        });

        if (error) throw error;

        console.log("YouTube callback response:", data);

        if (data.error) {
          throw new Error(data.error);
        }

        // Check if this exact channel is already connected
        const { data: existingAccounts } = await supabase
          .from('platform_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform_id', 'youtube')
          .eq('account_identifier', data.channel_id);

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

          if (dbError) throw dbError;

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

          if (updateError) throw updateError;

          toast({
            title: "Success",
            description: "YouTube account reconnected successfully!",
          });
        }
      } catch (error) {
        console.error('Error in callback:', error);
        toast({
          title: "Error",
          description: "Failed to connect YouTube account: " + (error.message || "Unknown error"),
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
        <h2 className="text-xl font-semibold mb-2">Connecting YouTube Account</h2>
        <p className="text-muted-foreground">Please wait...</p>
      </div>
    </div>
  );
}
