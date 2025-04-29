
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { platforms as allPlatforms } from '@/data/platforms';
import { PlatformAccount } from '@/types/platform-accounts';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import PlatformsTabs from './platforms/PlatformsTabs';
import PlatformsAuthState from './platforms/PlatformsAuthState';

const PlatformsManager: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [platformAccounts, setPlatformAccounts] = useState<PlatformAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlatformAccounts();
    }
  }, [user]);

  const fetchPlatformAccounts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('platform_accounts')
      .select('*')
      .eq('user_id', user.id);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error fetching accounts",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setPlatformAccounts(data || []);
  };

  const handleConnect = async (platformId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to connect accounts.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would initiate OAuth flow
    // For demo purposes, we'll simulate creating a new connection
    const accountName = `${platformId} Account ${platformAccounts.filter(a => a.platform_id === platformId).length + 1}`;
    
    const { error } = await supabase
      .from('platform_accounts')
      .insert({
        user_id: user.id,
        platform_id: platformId,
        account_name: accountName,
        account_identifier: `demo-${Date.now()}`,
      });

    if (error) {
      toast({
        title: "Error connecting account",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    fetchPlatformAccounts();
    toast({
      title: "Account connected",
      description: `Successfully connected new ${platformId} account.`,
    });
  };

  const handleDisconnect = async (accountId: string) => {
    const { error } = await supabase
      .from('platform_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      toast({
        title: "Error disconnecting account",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    // Update the local state by removing the disconnected account
    setPlatformAccounts(accounts => accounts.filter(account => account.id !== accountId));
    
    toast({
      title: "Account disconnected",
      description: "Successfully disconnected account.",
    });
  };

  if (!user) {
    return <PlatformsAuthState />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Connections</CardTitle>
        <CardDescription>
          Connect multiple accounts from your social media platforms.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PlatformsTabs 
          allPlatforms={allPlatforms}
          platformAccounts={platformAccounts}
          isLoading={isLoading}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      </CardContent>
    </Card>
  );
};

export default PlatformsManager;
