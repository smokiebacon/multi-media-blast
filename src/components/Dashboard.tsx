
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostForm from './PostForm';
import PlatformsManager from './PlatformsManager';
import PostsList from './PostsList';
import { FileText, Upload, Share2, Activity } from 'lucide-react';
import UploadStatus from './UploadStatus';

const Dashboard: React.FC = () => {
  const [activeUploads, setActiveUploads] = useState<Array<{id: string, platform: string, status: string}>>([]);
  
  const addUpload = (upload: {id: string, platform: string, status: string}) => {
    setActiveUploads(prev => [...prev, upload]);
  };
  
  const updateUploadStatus = (id: string, status: string) => {
    setActiveUploads(prev => prev.map(upload => 
      upload.id === id ? {...upload, status} : upload
    ));
  };

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
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
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Upload Status
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <PostForm onUploadStart={addUpload} onUploadUpdate={updateUploadStatus} />
        </TabsContent>
        
        <TabsContent value="posts">
          <PostsList />
        </TabsContent>
        
        <TabsContent value="platforms">
          <PlatformsManager />
        </TabsContent>
        
        <TabsContent value="status">
          <UploadStatus uploads={activeUploads} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
