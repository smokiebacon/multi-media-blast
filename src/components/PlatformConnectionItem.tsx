
import React from 'react';
import { Check, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Platform } from '@/types/platforms';
import { PlatformAccount } from '@/types/platform-accounts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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

  const handleYouTubeConnect = async () => {
    try {
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
        throw new Error("No auth URL returned from function");
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
        description: `Could not connect to YouTube: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleConnect = () => {
    if (platform.id === 'youtube') {
      handleYouTubeConnect();
    } else {
      onConnect(platform.id);
    }
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
          className="text-xs h-8 px-3 py-1"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Connect New Account
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
                onClick={() => onDisconnect(account.id)}
                className="text-xs h-6 px-2 text-destructive hover:bg-destructive/10"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlatformConnectionItem;
