
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Platform } from '@/types/platforms';
import { PlatformAccount } from '@/types/platform-accounts';
import PlatformsList from './PlatformsList';

interface PlatformsTabsProps {
  allPlatforms: Platform[];
  platformAccounts: PlatformAccount[];
  isLoading: boolean;
  onConnect: (platformId: string) => void;
  onDisconnect: (accountId: string) => void;
}

const PlatformsTabs: React.FC<PlatformsTabsProps> = ({
  allPlatforms,
  platformAccounts,
  isLoading,
  onConnect,
  onDisconnect
}) => {
  const getConnectedAccountsForPlatform = (platformId: string) => {
    return platformAccounts.filter(account => account.platform_id === platformId);
  };

  if (isLoading) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        Loading your connected accounts...
      </div>
    );
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="all">All Platforms</TabsTrigger>
        <TabsTrigger value="connected">Connected</TabsTrigger>
        <TabsTrigger value="available">Available</TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" className="space-y-4">
        <PlatformsList 
          platforms={allPlatforms}
          getConnectedAccounts={getConnectedAccountsForPlatform}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </TabsContent>
      
      <TabsContent value="connected" className="space-y-4">
        {allPlatforms
          .filter(platform => getConnectedAccountsForPlatform(platform.id).length > 0)
          .map(platform => (
            <PlatformsList 
              key="connected"
              platforms={allPlatforms.filter(p => 
                getConnectedAccountsForPlatform(p.id).length > 0
              )}
              getConnectedAccounts={getConnectedAccountsForPlatform}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              emptyMessage="No connected platforms yet. Connect a platform to get started."
            />
          ))}
      </TabsContent>
      
      <TabsContent value="available" className="space-y-4">
        <PlatformsList 
          platforms={allPlatforms.filter(platform => 
            getConnectedAccountsForPlatform(platform.id).length === 0
          )}
          getConnectedAccounts={getConnectedAccountsForPlatform}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          emptyMessage="All platforms are connected. Great job!"
        />
      </TabsContent>
    </Tabs>
  );
};

export default PlatformsTabs;
