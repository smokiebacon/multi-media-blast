
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PlatformConnectionItem from '@/components/PlatformConnectionItem';
import { platforms as allPlatforms } from '@/data/platforms';
import { Platform } from '@/types/platforms';
import { useToast } from '@/components/ui/use-toast';

interface PlatformsManagerProps {
  connectedPlatforms: Platform[];
  setConnectedPlatforms: React.Dispatch<React.SetStateAction<Platform[]>>;
}

const PlatformsManager: React.FC<PlatformsManagerProps> = ({
  connectedPlatforms,
  setConnectedPlatforms
}) => {
  const { toast } = useToast();

  const handleConnect = (platformId: string) => {
    // In a real app, this would initiate OAuth flow
    // For demo purposes, we'll just simulate successful connection
    const platformToConnect = allPlatforms.find(p => p.id === platformId);
    
    if (platformToConnect && !connectedPlatforms.some(p => p.id === platformId)) {
      setConnectedPlatforms(prev => [...prev, platformToConnect]);
      toast({
        title: "Platform connected",
        description: `Successfully connected to ${platformToConnect.name}.`,
      });
    }
  };

  const handleDisconnect = (platformId: string) => {
    setConnectedPlatforms(prev => prev.filter(p => p.id !== platformId));
    const platform = allPlatforms.find(p => p.id === platformId);
    if (platform) {
      toast({
        title: "Platform disconnected",
        description: `Successfully disconnected from ${platform.name}.`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Connections</CardTitle>
        <CardDescription>
          Connect your social media accounts to post across platforms.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">All Platforms</TabsTrigger>
            <TabsTrigger value="connected">Connected</TabsTrigger>
            <TabsTrigger value="disconnected">Disconnected</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {allPlatforms.map(platform => (
              <PlatformConnectionItem
                key={platform.id}
                platform={platform}
                isConnected={connectedPlatforms.some(p => p.id === platform.id)}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="connected" className="space-y-4">
            {connectedPlatforms.length > 0 ? (
              connectedPlatforms.map(platform => (
                <PlatformConnectionItem
                  key={platform.id}
                  platform={platform}
                  isConnected={true}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No connected platforms yet</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="disconnected" className="space-y-4">
            {allPlatforms.filter(p => !connectedPlatforms.some(cp => cp.id === p.id)).map(platform => (
              <PlatformConnectionItem
                key={platform.id}
                platform={platform}
                isConnected={false}
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
