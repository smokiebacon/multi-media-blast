
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PlatformConnectionItem from '@/components/PlatformConnectionItem';
import { platforms as allPlatforms } from '@/data/platforms';
import { Platform } from '@/types/platforms';
import { PlatformAccount } from '@/types/platform-accounts';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PlatformsManagerProps {
  connectedPlatforms?: Platform[];
  setConnectedPlatforms?: React.Dispatch<React.SetStateAction<Platform[]>>;
}

const PlatformsManager: React.FC<PlatformsManagerProps> = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [platformAccounts, setPlatformAccounts] = useState<PlatformAccount[]>([]);

  useEffect(() => {
    if (user) {
      fetchPlatformAccounts();
    }
  }, [user]);

  const fetchPlatformAccounts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('platform_accounts')
      .select('*')
      .eq('user_id', user.id);

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

    fetchPlatformAccounts();
    toast({
      title: "Account disconnected",
      description: "Successfully disconnected account.",
    });
  };

  const getConnectedAccountsForPlatform = (platformId: string) => {
    return platformAccounts.filter(account => account.platform_id === platformId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Connections</CardTitle>
        <CardDescription>
          Connect multiple accounts from your social media platforms.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">All Platforms</TabsTrigger>
            <TabsTrigger value="connected">Connected</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {allPlatforms.map(platform => (
              <PlatformConnectionItem
                key={platform.id}
                platform={platform}
                connectedAccounts={getConnectedAccountsForPlatform(platform.id)}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="connected" className="space-y-4">
            {allPlatforms
              .filter(platform => getConnectedAccountsForPlatform(platform.id).length > 0)
              .map(platform => (
                <PlatformConnectionItem
                  key={platform.id}
                  platform={platform}
                  connectedAccounts={getConnectedAccountsForPlatform(platform.id)}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              ))}
          </TabsContent>
          
          <TabsContent value="available" className="space-y-4">
            {allPlatforms
              .filter(platform => getConnectedAccountsForPlatform(platform.id).length === 0)
              .map(platform => (
                <PlatformConnectionItem
                  key={platform.id}
                  platform={platform}
                  connectedAccounts={[]}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PlatformsManager;
