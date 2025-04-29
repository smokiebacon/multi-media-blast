
import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Share2, 
  Activity
} from 'lucide-react';
import PostForm from './PostForm';
import PlatformsManager from './PlatformsManager';
import PostsList from './PostsList';
import UploadStatus from './UploadStatus';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const Dashboard: React.FC = () => {
  const [activeUploads, setActiveUploads] = useState<Array<{id: string, platform: string, status: string}>>([]);
  const [activeTab, setActiveTab] = useState<string>("create");
  
  const addUpload = (upload: {id: string, platform: string, status: string}) => {
    setActiveUploads(prev => [...prev, upload]);
  };
  
  const updateUploadStatus = (id: string, status: string) => {
    setActiveUploads(prev => prev.map(upload => 
      upload.id === id ? {...upload, status} : upload
    ));
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="bg-gradient-to-b from-sidebar to-sidebar/90 shadow-xl">
          <SidebarContent className="flex flex-col items-center justify-center py-6">
            <div className="mb-8 flex justify-center">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-secondary-foreground text-xl font-bold">SM</span>
              </div>
            </div>
            <SidebarMenu className="space-y-4 w-full px-2">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "create"}
                  onClick={() => setActiveTab("create")}
                  tooltip="Create Post"
                  className="w-full flex justify-center items-center"
                >
                  <Upload className="h-5 w-5" />
                  <span className="ml-3 font-medium">Create Post</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "posts"}
                  onClick={() => setActiveTab("posts")}
                  tooltip="Your Posts"
                  className="w-full flex justify-center items-center"
                >
                  <FileText className="h-5 w-5" />
                  <span className="ml-3 font-medium">Your Posts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "platforms"}
                  onClick={() => setActiveTab("platforms")}
                  tooltip="Manage Platforms"
                  className="w-full flex justify-center items-center"
                >
                  <Share2 className="h-5 w-5" />
                  <span className="ml-3 font-medium">Manage Platforms</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "status"}
                  onClick={() => setActiveTab("status")}
                  tooltip="Upload Status"
                  className="w-full flex justify-center items-center"
                >
                  <Activity className="h-5 w-5" />
                  <span className="ml-3 font-medium">Upload Status</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            {activeTab === "create" && (
              <PostForm onUploadStart={addUpload} onUploadUpdate={updateUploadStatus} />
            )}
            
            {activeTab === "posts" && (
              <PostsList />
            )}
            
            {activeTab === "platforms" && (
              <PlatformsManager />
            )}
            
            {activeTab === "status" && (
              <UploadStatus uploads={activeUploads} />
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
