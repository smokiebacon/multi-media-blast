
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostForm from './PostForm';
import PlatformsManager from './PlatformsManager';

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="create">Create Post</TabsTrigger>
          <TabsTrigger value="platforms">Manage Platforms</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <PostForm />
        </TabsContent>
        
        <TabsContent value="platforms">
          <PlatformsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
