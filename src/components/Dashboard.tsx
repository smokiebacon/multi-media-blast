
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostForm from './PostForm';
import PlatformsManager from './PlatformsManager';
import { Platform } from '@/types/platforms';

const Dashboard: React.FC = () => {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="create">Create Post</TabsTrigger>
          <TabsTrigger value="platforms">Manage Platforms</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <PostForm connectedPlatforms={connectedPlatforms} />
        </TabsContent>
        
        <TabsContent value="platforms">
          <PlatformsManager 
            connectedPlatforms={connectedPlatforms}
            setConnectedPlatforms={setConnectedPlatforms}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
