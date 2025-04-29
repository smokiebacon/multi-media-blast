
import React from 'react';
import { Platform } from '@/types/platforms';
import { PlatformAccount } from '@/types/platform-accounts';
import PlatformConnectionItem from '@/components/PlatformConnectionItem';

interface PlatformsListProps {
  platforms: Platform[];
  getConnectedAccounts: (platformId: string) => PlatformAccount[];
  onConnect: (platformId: string) => void;
  onDisconnect: (accountId: string) => void;
  emptyMessage?: string;
}

const PlatformsList: React.FC<PlatformsListProps> = ({
  platforms,
  getConnectedAccounts,
  onConnect,
  onDisconnect,
  emptyMessage = "No platforms available."
}) => {
  if (platforms.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {platforms.map(platform => (
        <PlatformConnectionItem
          key={platform.id}
          platform={platform}
          connectedAccounts={getConnectedAccounts(platform.id)}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      ))}
    </>
  );
};

export default PlatformsList;
