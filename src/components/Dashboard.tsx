
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostForm from './PostForm';
import PlatformsManager from './PlatformsManager';
import PostsList from './PostsList';
import { FileText, Upload, Share2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Create Post
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Your Posts
          </TabsTrigger>
          <TabsTrigger value="platforms" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Manage Platforms
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <PostForm />
        </TabsContent>
        
        <TabsContent value="posts">
          <PostsList />
        </TabsContent>
        
        <TabsContent value="platforms">
          <PlatformsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
