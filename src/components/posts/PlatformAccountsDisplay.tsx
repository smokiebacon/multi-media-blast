
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PlatformAccount } from '@/types/platform-accounts';
import { platforms } from '@/data/platforms';
import { Platform } from '@/types/platforms';

type PlatformAccountsDisplayProps = {
  platformId: string;
  accounts: PlatformAccount[];
  selectedAccountsOnly?: boolean;
};

const PlatformAccountsDisplay = ({ 
  platformId, 
  accounts, 
  selectedAccountsOnly = false 
}: PlatformAccountsDisplayProps) => {
  const getPlatformInfo = (platformId: string): Platform | undefined => {
    return platforms.find(p => p.id === platformId);
  };

  const platform = getPlatformInfo(platformId);
  
  if (!platform) return null;
  
  return (
    <div className="flex flex-col">
      <Badge variant="outline" className="bg-muted mb-1">
        <platform.icon className="h-3 w-3 mr-1" />
        {platform.name}
      </Badge>
      {accounts.length > 0 ? (
        <div className="text-xs text-muted-foreground pl-2">
          {accounts.map((account, idx) => (
            <div key={account.id}>
              {account.account_name}
              {idx < accounts.length - 1 ? ", " : ""}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground pl-2">No accounts</div>
      )}
    </div>
  );
};

export default PlatformAccountsDisplay;
