
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function YouTubeCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

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

        // Store the connected account in Supabase
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
      } catch (error) {
        console.error('Error in callback:', error);
        toast({
          title: "Error",
          description: "Failed to connect YouTube account.",
          variant: "destructive"
        });
      }

      navigate('/dashboard');
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
