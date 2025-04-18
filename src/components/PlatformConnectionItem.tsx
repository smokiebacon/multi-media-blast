
import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Platform } from '@/types/platforms';

interface PlatformConnectionItemProps {
  platform: Platform;
  isConnected: boolean;
  onConnect: (platformId: string) => void;
  onDisconnect: (platformId: string) => void;
}

const PlatformConnectionItem: React.FC<PlatformConnectionItemProps> = ({
  platform,
  isConnected,
  onConnect,
  onDisconnect,
}) => {
  return (
    <div className={cn(
      "rounded-lg p-4 border",
      isConnected ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700"
    )}>
      <div className="flex items-center justify-between">
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
              {isConnected ? "Connected" : "Not connected"}
            </p>
          </div>
        </div>
        
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisconnect(platform.id)}
            className="text-xs h-8 px-3 py-1 border-destructive text-destructive hover:bg-destructive/10"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Disconnect
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConnect(platform.id)}
            className="text-xs h-8 px-3 py-1"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Connect
          </Button>
        )}
      </div>
    </div>
  );
};

export default PlatformConnectionItem;
