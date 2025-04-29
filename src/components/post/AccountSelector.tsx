
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PlatformAccount } from '@/types/platform-accounts';
import { platforms as allPlatforms } from '@/data/platforms';

interface AccountSelectorProps {
  platformAccounts: PlatformAccount[];
  selectedAccounts: string[];
  onToggleAccount: (accountId: string) => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  platformAccounts,
  selectedAccounts,
  onToggleAccount,
}) => {
  const accountsByPlatform = platformAccounts.reduce<Record<string, PlatformAccount[]>>((acc, account) => {
    if (!acc[account.platform_id]) {
      acc[account.platform_id] = [];
    }
    acc[account.platform_id].push(account);
    return acc;
  }, {});

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">
        Select Accounts
      </label>
      <div className="space-y-4">
        {Object.entries(accountsByPlatform).map(([platformId, accounts]) => {
          const platform = allPlatforms.find(p => p.id === platformId);
          if (!platform) return null;
          
          return (
            <div key={platformId} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{platform.name}</h3>
              <div className="flex flex-wrap gap-2">
                {accounts.map((account) => (
                  <Badge
                    key={account.id}
                    variant={selectedAccounts.includes(account.id) ? "default" : "outline"}
                    className="cursor-pointer py-2 px-3"
                    onClick={() => onToggleAccount(account.id)}
                  >
                    <platform.icon className="h-4 w-4 mr-1" />
                    {account.account_name}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
        {platformAccounts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No accounts connected. Please connect accounts in the Platforms tab first.
          </p>
        )}
      </div>
    </div>
  );
};

export default AccountSelector;
