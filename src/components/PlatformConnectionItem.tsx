
import React, { useState } from 'react';
import { Check, Plus, X, AlertCircle, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Platform } from '@/types/platforms';
import { PlatformAccount } from '@/types/platform-accounts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlatformConnectionItemProps {
  platform: Platform;
  connectedAccounts: PlatformAccount[];
  onConnect: (platformId: string) => void;
  onDisconnect: (accountId: string) => void;
}

const PlatformConnectionItem: React.FC<PlatformConnectionItemProps> = ({
  platform,
  connectedAccounts,
  onConnect,
  onDisconnect,
}) => {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnectAccount, setDisconnectAccount] = useState<PlatformAccount | null>(null);

  const handleTikTokConnect = async () => {
    try {
      setConnecting('tiktok');
      toast({
        title: "Connecting to TikTok",
        description: "Please wait while we prepare TikTok authentication...",
      });

      const { data, error } = await supabase.functions.invoke('tiktok-auth', {
        body: { action: 'connect' },
      });

      if (error) {
        console.error('TikTok connect error:', error);
        throw new Error(error.message || "Error connecting to TikTok");
      }

      console.log("TikTok connect response:", data);
      
      if (!data || !data.url) {
        const errorMessage = data?.error || "No auth URL returned from function";
        console.error('TikTok URL error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Add event listener to catch any errors with custom URL schemes
      const handleError = (e) => {
        console.warn("Custom URL scheme error prevented:", e);
        // Continue with the flow - no need to show an error as this is expected behavior in some browsers
      };
      
      window.addEventListener('error', handleError, { once: true });

      // Show a toast before redirecting
      toast({
        title: "Redirecting to TikTok",
        description: "You'll be redirected to TikTok to authorize access. Please complete the authorization process.",
      });
      
      // Short delay before redirecting to ensure toast is seen
      setTimeout(() => {
        try {
          // Redirect to the OAuth consent screen
          window.location.href = data.url;
        } catch (e) {
          console.error("Redirect error:", e);
          // If there's an error with the redirect, show a message
          toast({
            title: "Redirection Issue",
            description: "Could not redirect to TikTok. Please try again or use a different browser.",
            variant: "destructive"
          });
          setConnecting(null);
        }
      }, 1000);
    } catch (error) {
      console.error('Error connecting TikTok:', error);
      toast({
        title: "Connection Failed",
        description: `Could not connect to TikTok: ${error.message || 'Unknown error'}. Please make sure the TikTok API credentials are configured correctly in Supabase Edge Function secrets.`,
        variant: "destructive"
      });
      setConnecting(null);
    }
  };

  const handleYouTubeConnect = async () => {
    try {
      setConnecting('youtube');
      toast({
        title: "Connecting to YouTube",
        description: "Please wait while we connect to your YouTube account...",
      });

      const { data, error } = await supabase.functions.invoke('youtube-auth', {
        body: { action: 'connect' },
      });

      if (error) {
        console.error('YouTube connect error:', error);
        throw error;
      }

      console.log("YouTube connect response:", data);
      
      if (!data.url) {
        throw new Error(data.error || "No auth URL returned from function");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to the OAuth consent screen
      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting YouTube:', error);
      toast({
        title: "Connection Failed",
        description: `Could not connect to YouTube: ${error.message || 'Unknown error'}. Please check that YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET are properly configured in Supabase Edge Function secrets.`,
        variant: "destructive"
      });
      setConnecting(null);
    }
  };

  const handleInstagramConnect = async () => {
    try {
      setConnecting('instagram');
      toast({
        title: "Connecting to Instagram",
        description: "Please wait while we connect to your Instagram account...",
      });

      const { data, error } = await supabase.functions.invoke('instagram-auth', {
        body: { action: 'connect' },
      });

      if (error) {
        console.error('Instagram connect error:', error);
        throw new Error(error.message || "Error connecting to Instagram");
      }

      console.log("Instagram connect response:", data);
      
      if (!data.url) {
        throw new Error(data.error || "No auth URL returned from function");
      }

      // Redirect to the OAuth consent screen
      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting Instagram:', error);
      toast({
        title: "Connection Failed",
        description: `Could not connect to Instagram: ${error.message || 'Unknown error'}. Please make sure the INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET are configured in Supabase Edge Function secrets.`,
        variant: "destructive"
      });
      setConnecting(null);
    }
  };

  const handleConnect = () => {
    if (platform.id === 'tiktok') {
      handleTikTokConnect();
    } else if (platform.id === 'youtube') {
      handleYouTubeConnect();
    } else if (platform.id === 'instagram') {
      handleInstagramConnect();
    } else {
      onConnect(platform.id);
    }
  };

  const confirmDisconnect = (account: PlatformAccount) => {
    setDisconnectAccount(account);
  };

  const handleDisconnectConfirmed = () => {
    if (disconnectAccount) {
      onDisconnect(disconnectAccount.id);
      setDisconnectAccount(null);
    }
  };

  const handleCancelDisconnect = () => {
    setDisconnectAccount(null);
  };

  return (
    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            `bg-media-${platform.id}`
          )}>
            <platform.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium">{platform.name}</h3>
            <p className="text-xs text-muted-foreground">
              {connectedAccounts.length} connected {connectedAccounts.length === 1 ? 'account' : 'accounts'}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleConnect}
          disabled={connecting === platform.id}
          className="text-xs h-8 px-3 py-1"
        >
          {connecting === platform.id ? (
            <>
              <Loader className="w-3.5 h-3.5 mr-1 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Connect New Account
            </>
          )}
        </Button>
      </div>

      {connectedAccounts.length > 0 && (
        <div className="space-y-2 mt-2">
          {connectedAccounts.map((account) => (
            <div 
              key={account.id} 
              className="flex items-center justify-between p-2 bg-muted/50 rounded"
            >
              <span className="text-sm">{account.account_name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => confirmDisconnect(account)}
                className="text-xs h-6 px-2 text-destructive hover:bg-destructive/10"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!disconnectAccount} onOpenChange={(open) => {
        if (!open) setDisconnectAccount(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {platform.name} account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect <span className="font-medium">{disconnectAccount?.account_name}</span> from your profile.
              You can reconnect it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDisconnect}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnectConfirmed} className="bg-destructive text-destructive-foreground">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlatformConnectionItem;
